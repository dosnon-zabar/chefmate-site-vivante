import type { Metadata } from "next";
import { fetchRecettes, fetchSiteConfig } from "@/lib/api";
import RecetteCard from "@/components/RecetteCard";

export async function generateMetadata(): Promise<Metadata> {
  const config = await fetchSiteConfig();
  return {
    title: config?.recipes_seo_title ?? "Nos recettes",
    description: config?.recipes_seo_desc ?? undefined,
    openGraph: config?.recipes_seo_image ? { images: [config.recipes_seo_image] } : undefined,
  };
}

export default async function RecettesPage() {
  const [config, { recettes }] = await Promise.all([
    fetchSiteConfig(),
    fetchRecettes({ limit: 50, status: "publiee", sort_by: "created_at", sort_order: "desc" }),
  ]);

  const saisons = [
    "toutes",
    ...new Set(recettes.map((r) => r.saison)),
  ];
  const allTags = [...new Set(recettes.flatMap((r) => r.tags))];

  return (
    <div className="py-12 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-10">
          <h1 className="font-serif text-4xl sm:text-5xl text-brun">
            {config?.recipes_page_title ?? "Nos recettes"}
          </h1>
          {config?.recipes_intro ? (
            <div className="mt-3 text-lg text-brun-light" dangerouslySetInnerHTML={{ __html: config.recipes_intro }} />
          ) : (
            <p className="mt-3 text-lg text-brun-light">
              Recettes provençales et méditerranéennes, à cuisiner et à partager.
            </p>
          )}
        </div>

        {/* Filtres (UI statique) */}
        {saisons.length > 1 && (
          <div className="mb-8 space-y-4">
            <div>
              <span className="text-sm font-medium text-brun mr-3">
                Saison :
              </span>
              {saisons.map((saison) => (
                <button
                  key={saison}
                  className={`text-sm px-3 py-1 rounded-full mr-2 mb-2 transition-colors ${
                    saison === "toutes"
                      ? "bg-terracotta text-ivoire"
                      : "bg-white text-brun-light hover:bg-argile/20"
                  }`}
                >
                  {saison === "toutes" ? "Toutes" : saison}
                </button>
              ))}
            </div>
            {allTags.length > 0 && (
              <div>
                <span className="text-sm font-medium text-brun mr-3">
                  Tags :
                </span>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    className="text-sm px-3 py-1 rounded-full mr-2 mb-2 bg-white text-brun-light hover:bg-sauge/10 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Grille */}
        {recettes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recettes.map((recette) => (
              <RecetteCard key={recette.id} recette={recette} />
            ))}
          </div>
        ) : (
          <p className="text-brun-light text-center py-12">
            Aucune recette publiée pour le moment.
          </p>
        )}
      </div>
    </div>
  );
}
