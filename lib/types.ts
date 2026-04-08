// === Types internes (utilisés par les composants) ===

export type Recette = {
  id: string;
  slug: string;
  nom: string;
  nombre_parts: number;
  statut: "a_faire" | "en_cours" | "finalisee";
  est_publique: boolean;
  tags: string[];
  saison: string;
  auteur: { id: string; nom: string };
  ingredients: { nom: string; quantite: number; unite: string }[];
  instructions: string;
  etapes: { texte: string; image_url?: string }[];
  photo_url?: string;
  created_at: string;
};

export type EventDate = {
  id?: string;
  start_datetime: string;
  duration_minutes: number | null;
  guest_count: number;
  location: string | null;
  reservation_open: boolean;
  reservation_url: string | null;
  sort_order: number;
};

export type EventStatus = "brouillon" | "non_publiee" | "publiee";

export type Evenement = {
  id: string;
  slug: string;
  titre: string;
  description: string | null;
  date: string | null;           // event_date principal (legacy, conservé pour rétrocompat)
  dates: EventDate[];            // multi-dates
  statut: EventStatus;
  nombre_places: number;
  presentation: string | null;
  compte_rendu: string | null;
  notes: string | null;
  photo_url?: string;
  team_id: string | null;
  images: { id?: string; type: "cover" | "report"; url: string; caption?: string; copyright?: string; sort_order?: number }[];
  temoignages: { id?: string; auteur: string; role?: string; texte: string; sort_order?: number }[];
  created_at: string;
  updated_at: string;
  est_passe: boolean;
};

export type Membre = {
  id: string;
  nom: string;
  role: string;
  bio: string;
  photo_url?: string;
};

export type TeamMember = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  active: boolean;
  created_at: string;
  roles: { id: string; name: string }[];
};

export type Role = {
  id: string;
  name: string;
  description: string;
};

export type User = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  roles: string[];
};

// === Types API ChefMate (réponse brute) ===

export type ApiRecipe = {
  id: string;
  name: string;
  slug: string | null;
  serving_count: number;
  status: string | null;
  is_public: boolean;
  images: { id: string; url: string; nom: string }[];
  sort_order: number;
  creator_id: string | null;
  created_at: string;
  updated_at: string;
  recipe_steps: {
    id: string;
    title: string | null;
    text: string;
    image_url: string | null;
    sort_order: number;
  }[];
  creator: { id: string; first_name: string; last_name: string } | null;
  recipe_teams: { team: { id: string; name: string } }[];
  recipe_type_assignments: { type: { id: string; name: string; color: string } }[];
  recipe_seasons: { season: { id: string; name: string; icon: string } }[];
  recipe_tags: { tag: { id: string; name: string; color: string } }[];
  ingredients: {
    id: string;
    name: string;
    quantity: number;
    sort_order: number;
    comment: string | null;
    unit: { id: string; name: string; abbreviation: string };
    aisle: { id: string; name: string; color: string } | null;
  }[];
};

export type ApiEventDate = {
  id: string;
  start_datetime: string;
  duration_minutes: number | null;
  guest_count: number;
  location: string | null;
  reservation_open: boolean;
  reservation_url: string | null;
  sort_order: number;
};

export type ApiEvent = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  event_date: string | null;
  guest_count: number | null;
  presentation_text: string | null;
  report_text: string | null;
  notes: string | null;
  status: EventStatus | null;
  team_id: string | null;
  created_at: string;
  updated_at: string;
  team: { id: string; name: string } | null;
  event_dates?: ApiEventDate[];
  event_images: {
    id: string;
    image_type: "cover" | "report";
    image_url: string;
    caption: string | null;
    copyright: string | null;
    sort_order: number;
  }[];
  event_testimonials: {
    id: string;
    author_name: string;
    author_role: string | null;
    text: string;
    sort_order: number;
  }[];
  event_recipes: {
    id: string;
    serving_count: number;
    recette: { id: string; name: string; serving_count: number } | null;
  }[];
};

export type ApiResponse<T> = {
  data: T;
  meta?: { total: number; limit: number; offset: number };
};
