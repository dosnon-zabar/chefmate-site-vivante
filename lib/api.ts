import type { Recette, Evenement, User, ApiRecipe, ApiEvent, ApiResponse } from "./types";

const BASE_URL = process.env.CHEFMATE_API_URL || "https://traiteur.zabar.fr/api/v1";
const API_KEY = process.env.CHEFMATE_API_KEY || "";
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
  const today = new Date().toISOString().split("T")[0];
  const est_passe = e.event_date ? e.event_date < today : false;

  return {
    id: e.id,
    slug: e.slug || e.id,
    titre: e.name,
    description: e.description,
    date: e.event_date,
    nombre_places: e.guest_count || 0,
    presentation: e.presentation_text,
    compte_rendu: e.report_text,
    photo_url: resolveImageUrl(e.image_url) ||
      resolveImageUrl(
        e.event_images?.find((img) => img.image_type === "cover")?.image_url
      ),
    images: (e.event_images || [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((img) => ({
        type: img.image_type,
        url: resolveImageUrl(img.image_url)!,
        caption: img.caption || undefined,
      })),
    temoignages: (e.event_testimonials || [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((t) => ({
        auteur: t.author_name,
        role: t.author_role || undefined,
        texte: t.text,
      })),
    created_at: e.created_at,
    est_passe,
  };
}

export async function fetchEvenements(
  params?: { limit?: number; offset?: number; date_from?: string; date_to?: string; sort_by?: string; sort_order?: string }
): Promise<{ evenements: Evenement[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.offset) searchParams.set("offset", String(params.offset));
  if (params?.date_from) searchParams.set("date_from", params.date_from);
  if (params?.date_to) searchParams.set("date_to", params.date_to);
  if (params?.sort_by) searchParams.set("sort_by", params.sort_by);
  if (params?.sort_order) searchParams.set("sort_order", params.sort_order);

  const res = await fetch(`${BASE_URL}/events?${searchParams}`, {
    headers: headers(),
    next: { revalidate: 30 },
  });

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

export async function fetchEvenement(id: string): Promise<Evenement | null> {
  const res = await fetch(`${BASE_URL}/events/${id}`, {
    headers: headers(),
    next: { revalidate: 30 },
  });

  if (!res.ok) return null;

  const json: ApiResponse<ApiEvent> = await res.json();
  return mapEvent(json.data);
}

// === Auth (pas utilisé pour cette phase) ===

export async function login(
  _email: string,
  _password: string
): Promise<{ token: string }> {
  return Promise.resolve({ token: "" });
}

export async function getMe(_token: string): Promise<User> {
  return Promise.resolve({
    id: "",
    email: "",
    first_name: "",
    last_name: "",
    roles: [],
  });
}
