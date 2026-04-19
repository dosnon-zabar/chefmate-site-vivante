import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchRecette, fetchSiteConfig } from "@/lib/api";
import { formatIngredientNatural } from "@/lib/format-ingredient";
import {
  stepToTiming,
  sumTimings,
  activeDuration,
  passiveDuration,
  formatDuration,
} from "@/lib/timing";
import ImageWithFallback from "@/components/ImageWithFallback";
import ImageSlider from "@/components/ImageSlider";

type Props = {
  params: Promise<{ id: string }>;
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const [recette, config] = await Promise.all([fetchRecette(id), fetchSiteConfig()]);
  if (!recette) return { title: "Recette" };

  const siteName = config?.title ?? "Vivante";
  const title = recette.seo_title || `${recette.nom} - ${siteName}`;
  const description = recette.seo_desc || (recette.presentation ? stripHtml(recette.presentation).slice(0, 200) : undefined);
  const image = recette.seo_image || recette.photo_url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function RecetteDetailPage({ params }: Props) {
  const { id } = await params;
  const recette = await fetchRecette(id);

  if (!recette) notFound();

  return (
    <div className="py-12 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <Link
          href="/recettes"
          className="inline-flex items-center gap-1 text-sm text-brun-light hover:text-terracotta transition-colors mb-6"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Retour aux recettes
        </Link>

        {(recette.photos?.length ?? 0) > 0 && (
          <ImageSlider images={recette.photos!} alt={recette.nom} />
        )}

        <h1 className="font-serif text-4xl sm:text-5xl text-brun">
          {recette.nom}
        </h1>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          {recette.saison && recette.saison.split(/,\s*/).map((s) => (
            <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-jaune/20 text-brun font-medium uppercase">
              {s.trim()}
            </span>
          ))}
          {recette.tags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] px-2 py-0.5 rounded-full bg-vert-eau/15 text-vert-eau font-medium uppercase"
            >
              {tag}
            </span>
          ))}
          <span className="text-xs text-brun-light ml-2">Par {recette.auteur.nom}</span>
        </div>

        {(() => {
          // Aggregated timing summary as a single header line:
          //   ⏲ Préparation : 30 min  •  Cuisson et repos : 1h45
          // Each half is suppressed if its duration is empty; the whole
          // line is hidden when no step has any timing.
          const agg = sumTimings(
            recette.etapes.map((e) => stepToTiming(e as unknown as Record<string, unknown>))
          );
          const active = formatDuration(activeDuration(agg));
          const passive = formatDuration(passiveDuration(agg));
          if (!active && !passive) return null;
          return (
            <p className="mt-3 text-sm text-brun-light flex flex-wrap items-center gap-x-3 gap-y-1">
              <span aria-hidden>⏲</span>
              {active && <span>Préparation : {active}</span>}
              {active && passive && (
                <span className="text-brun-light/40" aria-hidden>•</span>
              )}
              {passive && <span>Cuisson et repos : {passive}</span>}
            </p>
          );
        })()}

        {recette.presentation && recette.presentation.replace(/<[^>]*>/g, "").trim() && (
          <div
            className="rich-content emphasis-green mt-8 text-brun-light leading-relaxed text-lg"
            style={{ maxWidth: "650px" }}
            dangerouslySetInnerHTML={{ __html: recette.presentation }}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-10">
          {/* Ingrédients */}
          <div className="md:col-span-1">
            <h2 className="font-serif text-2xl text-brun mb-1">Ingrédients</h2>
            <p className="text-xs text-brun-light uppercase tracking-wide mb-4">
              Pour {recette.nombre_parts} {recette.portion_type ?? "personnes"}
            </p>
            {recette.ingredients.length > 0 ? (
              (() => {
                const groups = recette.ingredient_groups ?? [];
                const hasGroups = groups.length > 0 && recette.ingredients.some((i) => i.group_id);
                if (!hasGroups) {
                  // Flat list (no groups → legacy display)
                  return (
                    <ul className="space-y-3">
                      {recette.ingredients.map((ing, i) => (
                        <li
                          key={i}
                          className="text-sm text-brun border-b border-stone-200 pb-2 last:border-0 last:pb-0"
                        >
                          {formatIngredientNatural(ing.nom, ing.quantite, ing.unite, ing.unite_pluriel, ing.nom_pluriel)}
                        </li>
                      ))}
                    </ul>
                  );
                }
                // Grouped display
                const ungrouped = recette.ingredients.filter((i) => !i.group_id);
                return (
                  <div className="space-y-6">
                    {groups.map((g) => {
                      const items = recette.ingredients.filter((i) => i.group_id === g.id);
                      if (items.length === 0) return null;
                      return (
                        <div key={g.id}>
                          <h3 className="font-serif text-lg text-brun mb-2">{g.titre}</h3>
                          <ul className="space-y-2">
                            {items.map((ing, i) => (
                              <li key={i} className="text-sm text-brun border-b border-stone-200 pb-2 last:border-0 last:pb-0">
                                {formatIngredientNatural(ing.nom, ing.quantite, ing.unite, ing.unite_pluriel, ing.nom_pluriel)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                    {ungrouped.length > 0 && (
                      <ul className="space-y-2">
                        {ungrouped.map((ing, i) => (
                          <li key={i} className="text-sm text-brun border-b border-stone-200 pb-2 last:border-0 last:pb-0">
                            {formatIngredientNatural(ing.nom, ing.quantite, ing.unite, ing.unite_pluriel, ing.nom_pluriel)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })()
            ) : (
              <p className="text-sm text-brun-light/60 italic">
                Pas d&apos;ingrédients renseignés
              </p>
            )}
          </div>

          {/* Préparation */}
          <div className="md:col-span-2">
            <h2 className="font-serif text-2xl text-brun mb-4">Préparation</h2>
            {recette.etapes.length > 0 ? (
              <div className="space-y-6">
                {recette.etapes.map((etape, i) => (
                  <div key={i}>
                    <p className="text-xs font-medium text-terracotta uppercase tracking-wide mb-2">
                      Étape {i + 1}{etape.titre ? ` — ${etape.titre}` : ""}
                    </p>
                    <div
                      className="rich-content text-brun-light leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: etape.texte }}
                    />
                    {etape.image_url && (
                      <div className="relative aspect-[16/9] rounded-lg overflow-hidden mt-4">
                        <ImageWithFallback
                          src={etape.image_url}
                          alt={`Étape ${i + 1}`}
                          fill
                          className="object-cover"
                          fallbackText={`Étape ${i + 1}`}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : recette.instructions ? (
              <div className="bg-white rounded-xl p-6">
                <p className="text-brun-light leading-relaxed whitespace-pre-line">
                  {recette.instructions}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-6">
                <p className="text-sm text-brun-light/60 italic">
                  Pas d&apos;instructions renseignées
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
