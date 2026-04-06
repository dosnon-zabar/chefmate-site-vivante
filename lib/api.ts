import type { Recette, Evenement, User, ApiRecipe, ApiResponse } from "./types";

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
    cache: "no-store",
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
    cache: "no-store",
  });

  if (!res.ok) return null;

  const json: ApiResponse<ApiRecipe> = await res.json();
  return mapRecipe(json.data);
}

// === Événements (pas encore dans l'API, stubs) ===

export async function fetchEvenements(
  _params?: { limit?: number }
): Promise<Evenement[]> {
  return Promise.resolve([]);
}

export async function fetchEvenement(_id: string): Promise<Evenement | null> {
  return Promise.resolve(null);
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
