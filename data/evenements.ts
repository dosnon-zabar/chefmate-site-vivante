import type { Evenement } from "@/lib/types";

export const evenements: Evenement[] = [
  {
    id: "mock-1",
    slug: "grand-banquet-de-village",
    titre: "Grand banquet de village",
    description:
      "Une grande tablée en plein air au cœur du village de Bonnieux. Menu provençal complet : aïoli géant, légumes du jardin, fromages de chèvre locaux et tarte aux fruits de saison.",
    date: "2026-06-21",
    nombre_places: 120,
    presentation: null,
    compte_rendu: null,
    photo_url: "https://traiteur.zabar.fr/cdn/evenements/banquet-village.jpg",
    images: [],
    temoignages: [],
    created_at: "2026-01-15T10:00:00Z",
    est_passe: false,
  },
  {
    id: "mock-2",
    slug: "atelier-cuisine-d-ete",
    titre: "Atelier cuisine d'été",
    description:
      "Apprenez à cuisiner les légumes d'été avec les producteurs du coin. Au programme : ratatouille, tian, farcis provençaux.",
    date: "2026-07-12",
    nombre_places: 25,
    presentation: null,
    compte_rendu: null,
    photo_url: "https://traiteur.zabar.fr/cdn/evenements/atelier-cuisine.jpg",
    images: [],
    temoignages: [],
    created_at: "2026-02-01T10:00:00Z",
    est_passe: false,
  },
  {
    id: "mock-3",
    slug: "marche-paysan-nocturne",
    titre: "Marché paysan nocturne",
    description:
      "Marché de producteurs locaux en nocturne avec dégustation et musique live. Retrouvez nos maraîchers, fromagers, vignerons et apiculteurs du Luberon.",
    date: "2026-08-02",
    nombre_places: 200,
    presentation: null,
    compte_rendu: null,
    photo_url: "https://traiteur.zabar.fr/cdn/evenements/marche-paysan.jpg",
    images: [],
    temoignages: [],
    created_at: "2026-02-15T10:00:00Z",
    est_passe: false,
  },
];
