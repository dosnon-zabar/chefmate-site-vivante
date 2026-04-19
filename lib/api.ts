import type { Recette, Evenement, SiteConfig, ApiRecipe, ApiEvent, ApiResponse } from "./types";
import { ADMIN_API_URL, ADMIN_ROOT_URL } from "./admin-url";

const BASE_URL = ADMIN_API_URL;
const API_KEY = process.env.CHEFMATE_API_KEY || "";
const CDN_BASE = ADMIN_ROOT_URL;

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

// === Site Config ===

export async function fetchSiteConfig(): Promise<SiteConfig | null> {
  try {
    const res = await fetch(`${BASE_URL}/site-config`, {
      headers: headers(),
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json: ApiResponse<SiteConfig> = await res.json();
    const data = json.data;
    if (!data) return null;

    // Resolve relative image URLs to absolute
    if (data.home_hero_image) data.home_hero_image = resolveImageUrl(data.home_hero_image) ?? null;
    if (data.about_header_image) data.about_header_image = resolveImageUrl(data.about_header_image) ?? null;
    if (data.home_seo_image) data.home_seo_image = resolveImageUrl(data.home_seo_image) ?? null;
    if (data.recipes_seo_image) data.recipes_seo_image = resolveImageUrl(data.recipes_seo_image) ?? null;
    if (data.events_seo_image) data.events_seo_image = resolveImageUrl(data.events_seo_image) ?? null;
    if (data.about_seo_image) data.about_seo_image = resolveImageUrl(data.about_seo_image) ?? null;
    if (data.about_values) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data.about_values = data.about_values.map((v: any) => ({
        ...v,
        icon: resolveImageUrl(v.icon) ?? undefined,
      }));
    }
    if (data.about_team_members) {
      data.about_team_members = data.about_team_members.map((m) => ({
        ...m,
        image_url: resolveImageUrl(m.image_url) ?? undefined,
      }));
    }

    return data;
  } catch {
    return null;
  }
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
    presentation: r.presentation,
    portion_type: r.portion_type?.name ?? null,
    seo_title: r.seo_title,
    seo_desc: r.seo_desc,
    seo_image: resolveImageUrl(r.seo_image),
    auteur: r.creator
      ? { id: r.creator.id, nom: `${r.creator.first_name} ${r.creator.last_name}` }
      : { id: "", nom: "Inconnu" },
    ingredients: r.ingredients
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((i) => ({
        nom: i.name,
        nom_pluriel: i.name_plural ?? null,
        quantite: i.quantity,
        unite: i.unit.abbreviation,
        unite_pluriel: i.unit.abbreviation_plural ?? null,
        group_id: i.group_id,
      })),
    ingredient_groups: (r.ingredient_groups ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((g) => ({ id: g.id, titre: g.title, sort_order: g.sort_order })),
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
        titre: s.title,
        texte: s.text,
        image_url: resolveImageUrl(s.image_url),
        // Pass through the timing block unchanged — the consumer
        // (RecipeTiming component) reads them via stepToTiming().
        prep_minutes_min: s.prep_minutes_min,
        prep_minutes_max: s.prep_minutes_max,
        cook_minutes_min: s.cook_minutes_min,
        cook_minutes_max: s.cook_minutes_max,
        rest_minutes_min: s.rest_minutes_min,
        rest_minutes_max: s.rest_minutes_max,
        timing_notes: s.timing_notes,
      })),
    photo_url: resolveImageUrl(r.images?.[0]?.url),
    photos: (r.images ?? []).map((img) => resolveImageUrl(img.url)).filter(Boolean) as string[],
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
    report_title: e.report_title,
    seo_title: e.seo_title,
    seo_desc: e.seo_desc,
    seo_image: resolveImageUrl(e.seo_image),
    steps_title: e.steps_title,
    steps_text: e.steps_text,
    parcours: (e.event_steps ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((s) => ({
        titre: s.title,
        texte: s.text,
        image_url: resolveImageUrl(s.image_url) ?? null,
        sort_order: s.sort_order,
      })),
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
  params?: { limit?: number; offset?: number; date_from?: string; date_to?: string; sort_by?: string; sort_order?: string; status?: string }
): Promise<{ evenements: Evenement[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.offset) searchParams.set("offset", String(params.offset));
  if (params?.date_from) searchParams.set("date_from", params.date_from);
  if (params?.date_to) searchParams.set("date_to", params.date_to);
  if (params?.sort_by) searchParams.set("sort_by", params.sort_by);
  if (params?.sort_order) searchParams.set("sort_order", params.sort_order);
  if (params?.status) searchParams.set("status", params.status);

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
