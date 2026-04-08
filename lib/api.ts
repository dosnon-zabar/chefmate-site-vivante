import type { Recette, Evenement, EventStatus, TeamMember, Role, ApiRecipe, ApiEvent, ApiResponse } from "./types";

const BASE_URL = process.env.CHEFMATE_API_URL || "https://traiteur.zabar.fr/api/v1";
const API_KEY = process.env.CHEFMATE_API_KEY || "";
const TEAM_ID = process.env.CHEFMATE_TEAM_ID || "";
const CDN_BASE = "https://traiteur.zabar.fr";

function headers(): HeadersInit {
  return {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json",
  };
}

/** Convertit une URL d'image relative de l'API en URL absolue */
function resolveImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return `${CDN_BASE}${url}`;
}

/** Extrait le texte brut du HTML riche des steps */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Mappe une recette API vers le type interne */
function mapRecipe(r: ApiRecipe): Recette {
  const statusMap: Record<string, Recette["statut"]> = {
    a_faire: "a_faire",
    en_cours: "en_cours",
    terminee: "finalisee",
    finalisee: "finalisee",
  };

  return {
    id: r.id,
    slug: r.slug || r.id,
    nom: r.name,
    nombre_parts: r.serving_count,
    statut: statusMap[r.status || ""] || "en_cours",
    est_publique: r.is_public,
    tags: r.recipe_tags.map((t) => t.tag.name),
    saison: r.recipe_seasons.map((s) => s.season.name).join(", ") || "toutes saisons",
    auteur: r.creator
      ? { id: r.creator.id, nom: `${r.creator.first_name} ${r.creator.last_name}` }
      : { id: "", nom: "Inconnu" },
    ingredients: r.ingredients
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((i) => ({
        nom: i.name,
        quantite: i.quantity,
        unite: i.unit.abbreviation,
      })),
    instructions: r.recipe_steps
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((s) => {
        const title = s.title ? `${s.title}\n` : "";
        return title + stripHtml(s.text);
      })
      .join("\n\n"),
    etapes: r.recipe_steps
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((s) => ({
        texte: stripHtml(s.text),
        image_url: resolveImageUrl(s.image_url),
      })),
    photo_url: resolveImageUrl(r.images?.[0]?.url),
    created_at: r.created_at,
  };
}

// === Recettes ===

export async function fetchRecettes(
  params?: { limit?: number; offset?: number; nom?: string; status?: string; sort_by?: string; sort_order?: string }
): Promise<{ recettes: Recette[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.offset) searchParams.set("offset", String(params.offset));
  if (params?.nom) searchParams.set("name", params.nom);
  if (params?.status) searchParams.set("status", params.status);
  if (params?.sort_by) searchParams.set("sort_by", params.sort_by);
  if (params?.sort_order) searchParams.set("sort_order", params.sort_order);

  const res = await fetch(`${BASE_URL}/recipes?${searchParams}`, {
    headers: headers(),
    next: { revalidate: 30 },
  });

  if (!res.ok) {
    console.error(`API error: ${res.status} ${res.statusText}`);
    return { recettes: [], total: 0 };
  }

  const json: ApiResponse<ApiRecipe[]> = await res.json();
  return {
    recettes: json.data.map(mapRecipe),
    total: json.meta?.total ?? json.data.length,
  };
}

export async function fetchRecette(id: string): Promise<Recette | null> {
  const res = await fetch(`${BASE_URL}/recipes/${id}`, {
    headers: headers(),
    next: { revalidate: 30 },
  });

  if (!res.ok) return null;

  const json: ApiResponse<ApiRecipe> = await res.json();
  return mapRecipe(json.data);
}

// === Événements ===

function mapEvent(e: ApiEvent): Evenement {
  const now = new Date().toISOString();
  const dates = (e.event_dates || [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((d) => ({
      id: d.id,
      start_datetime: d.start_datetime,
      duration_minutes: d.duration_minutes,
      guest_count: d.guest_count,
      location: d.location,
      reservation_open: d.reservation_open,
      reservation_url: d.reservation_url,
      sort_order: d.sort_order,
    }));

  // est_passe = true seulement si toutes les dates sont passées
  // S'il n'y a pas de dates, on retombe sur event_date
  let est_passe = false;
  if (dates.length > 0) {
    est_passe = dates.every((d) => d.start_datetime < now);
  } else if (e.event_date) {
    const today = now.split("T")[0];
    est_passe = e.event_date < today;
  }

  return {
    id: e.id,
    slug: e.slug || e.id,
    titre: e.name,
    description: e.description,
    date: e.event_date,
    dates,
    statut: (e.status as Evenement["statut"]) || "brouillon",
    nombre_places: e.guest_count || 0,
    presentation: e.presentation_text,
    compte_rendu: e.report_text,
    notes: e.notes,
    team_id: e.team_id,
    photo_url: resolveImageUrl(
      e.event_images
        ?.filter((img) => img.image_type === "cover")
        ?.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]
        ?.image_url
    ),
    images: (e.event_images || [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((img) => ({
        id: img.id,
        type: img.image_type,
        url: resolveImageUrl(img.image_url)!,
        caption: img.caption || undefined,
        copyright: img.copyright || undefined,
        sort_order: img.sort_order,
      })),
    temoignages: (e.event_testimonials || [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((t) => ({
        id: t.id,
        auteur: t.author_name,
        role: t.author_role || undefined,
        texte: t.text,
        sort_order: t.sort_order,
      })),
    created_at: e.created_at,
    updated_at: e.updated_at,
    est_passe,
  };
}

export async function fetchEvenements(
  params?: { limit?: number; offset?: number; date_from?: string; date_to?: string; sort_by?: string; sort_order?: string; status?: string },
  options?: { token?: string; cache?: RequestCache }
): Promise<{ evenements: Evenement[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.offset) searchParams.set("offset", String(params.offset));
  if (params?.date_from) searchParams.set("date_from", params.date_from);
  if (params?.date_to) searchParams.set("date_to", params.date_to);
  if (params?.sort_by) searchParams.set("sort_by", params.sort_by);
  if (params?.sort_order) searchParams.set("sort_order", params.sort_order);
  if (params?.status) searchParams.set("status", params.status);

  const requestHeaders = options?.token ? bearerHeaders(options.token) : headers();
  const fetchOptions: RequestInit = { headers: requestHeaders };
  if (options?.cache === "no-store") {
    fetchOptions.cache = "no-store";
  } else {
    (fetchOptions as { next?: { revalidate: number } }).next = { revalidate: 30 };
  }

  const res = await fetch(`${BASE_URL}/events?${searchParams}`, fetchOptions);

  if (!res.ok) {
    console.error(`API events error: ${res.status} ${res.statusText}`);
    return { evenements: [], total: 0 };
  }

  const json: ApiResponse<ApiEvent[]> = await res.json();
  return {
    evenements: json.data.map(mapEvent),
    total: json.meta?.total ?? json.data.length,
  };
}

export async function fetchEvenement(id: string, options?: { token?: string; cache?: RequestCache }): Promise<Evenement | null> {
  const requestHeaders = options?.token ? bearerHeaders(options.token) : headers();
  const fetchOptions: RequestInit = { headers: requestHeaders };
  if (options?.cache === "no-store") {
    fetchOptions.cache = "no-store";
  } else {
    (fetchOptions as { next?: { revalidate: number } }).next = { revalidate: 30 };
  }

  const res = await fetch(`${BASE_URL}/events/${id}`, fetchOptions);

  if (!res.ok) return null;

  const json: ApiResponse<ApiEvent> = await res.json();
  return mapEvent(json.data);
}

// === Mutations Event (Bearer token requis) ===

export type EventInput = {
  name: string;
  slug?: string;
  description?: string | null;
  event_date?: string | null;
  guest_count?: number;
  presentation_text?: string | null;
  report_text?: string | null;
  notes?: string | null;
  status?: EventStatus;
  team_id: string;
  dates?: {
    start_datetime: string;
    duration_minutes?: number | null;
    guest_count?: number;
    location?: string | null;
    reservation_open?: boolean;
    reservation_url?: string | null;
    sort_order?: number;
  }[];
  images?: {
    image_type: "cover" | "report";
    image_url: string;
    caption?: string | null;
    sort_order?: number;
  }[];
  testimonials?: {
    author_name: string;
    author_role?: string | null;
    text: string;
    sort_order?: number;
  }[];
};

export async function createEvenement(
  token: string,
  data: EventInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  const res = await fetch(`${BASE_URL}/events`, {
    method: "POST",
    headers: bearerHeaders(token),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) return { success: false, error: json.error || "Erreur lors de la création" };
  return { success: true, id: json.data?.id };
}

export async function updateEvenement(
  token: string,
  id: string,
  data: Partial<EventInput>
): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`${BASE_URL}/events/${id}`, {
    method: "PATCH",
    headers: bearerHeaders(token),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) return { success: false, error: json.error || "Erreur lors de la modification" };
  return { success: true };
}

export async function deleteEvenement(
  token: string,
  id: string
): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`${BASE_URL}/events/${id}`, {
    method: "DELETE",
    headers: bearerHeaders(token),
  });
  if (!res.ok) {
    const json = await res.json();
    return { success: false, error: json.error || "Erreur lors de la suppression" };
  }
  return { success: true };
}

// === Membres d'équipe (auth Bearer token) ===

function bearerHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function fetchTeamMembers(token: string): Promise<TeamMember[]> {
  const res = await fetch(`${BASE_URL}/teams/${TEAM_ID}/members`, {
    headers: bearerHeaders(token),
    cache: "no-store",
  });
  if (!res.ok) return [];
  const json: ApiResponse<TeamMember[]> = await res.json();
  return json.data;
}

export async function createTeamMember(
  token: string,
  data: { first_name: string; last_name: string; email: string; password: string; phone?: string; role_id?: string }
): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`${BASE_URL}/teams/${TEAM_ID}/members`, {
    method: "POST",
    headers: bearerHeaders(token),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) return { success: false, error: json.error || "Erreur lors de la création" };
  return { success: true };
}

export async function updateTeamMember(
  token: string,
  userId: string,
  data: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`${BASE_URL}/teams/${TEAM_ID}/members/${userId}`, {
    method: "PATCH",
    headers: bearerHeaders(token),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) return { success: false, error: json.error || "Erreur lors de la modification" };
  return { success: true };
}

export async function removeTeamMember(
  token: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`${BASE_URL}/teams/${TEAM_ID}/members/${userId}`, {
    method: "DELETE",
    headers: bearerHeaders(token),
  });
  if (!res.ok) {
    const json = await res.json();
    return { success: false, error: json.error || "Erreur lors de la suppression" };
  }
  return { success: true };
}

export async function fetchRoles(token: string): Promise<Role[]> {
  const res = await fetch(`${BASE_URL}/roles`, {
    headers: bearerHeaders(token),
    cache: "no-store",
  });
  if (!res.ok) return [];
  const json: ApiResponse<Role[]> = await res.json();
  // Ne retourner que les rôles assignables depuis Vivante
  const assignable = ["contributeur", "traiteur", "team manager"];
  return json.data.filter((r) => assignable.includes(r.name.toLowerCase()));
}

// === Gestion granulaire des images d'un event ===

export type EventImagePayload = {
  image_type: "cover" | "report";
  image_url: string;
  caption?: string;
  copyright?: string;
};

export type EventImageRow = {
  id: string;
  event_id: string;
  image_type: "cover" | "report";
  image_url: string;
  caption: string | null;
  copyright: string | null;
  sort_order: number;
};

export async function addEventImage(
  token: string,
  eventId: string,
  data: EventImagePayload
): Promise<{ success: boolean; image?: EventImageRow; error?: string }> {
  const res = await fetch(`${BASE_URL}/events/${eventId}/images`, {
    method: "POST",
    headers: bearerHeaders(token),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) return { success: false, error: json.error || "Erreur ajout image" };
  return { success: true, image: json.data };
}

export async function updateEventImage(
  token: string,
  eventId: string,
  imageId: string,
  data: { caption?: string; copyright?: string; sort_order?: number }
): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`${BASE_URL}/events/${eventId}/images/${imageId}`, {
    method: "PATCH",
    headers: bearerHeaders(token),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) return { success: false, error: json.error || "Erreur modification image" };
  return { success: true };
}

export async function deleteEventImage(
  token: string,
  eventId: string,
  imageId: string
): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`${BASE_URL}/events/${eventId}/images/${imageId}`, {
    method: "DELETE",
    headers: bearerHeaders(token),
  });
  if (!res.ok) {
    const json = await res.json();
    return { success: false, error: json.error || "Erreur suppression image" };
  }
  return { success: true };
}

// === Upload d'images (Bearer token) ===

export async function uploadImage(
  token: string,
  file: File,
  prefix: "recettes" | "events" | "equipe" = "events"
): Promise<{ success: boolean; url?: string; error?: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("prefix", prefix);

  const res = await fetch(`${BASE_URL}/upload-image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    return { success: false, error: json.error || "Erreur lors de l'upload" };
  }

  // Résoudre l'URL relative en URL absolue
  return { success: true, url: resolveImageUrl(json.url) };
}

// User type is used by lib/auth.ts, re-exported for convenience
export type { User } from "./types";
