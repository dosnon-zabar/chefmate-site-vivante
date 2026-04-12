import Link from "next/link";
import { fetchRecettes, fetchEvenements, fetchSiteConfig } from "@/lib/api";
import RecetteCard from "@/components/RecetteCard";
import EvenementCard from "@/components/EvenementCard";
import { EtoileOrange, EtoileBleu, Soleil, DemiSoleil, CourbePeche, OndeVerte } from "@/components/Motifs";

export default async function Accueil() {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  const [config, { recettes }, { evenements: prochainsEvenements }, { evenements: eventsPasses }] = await Promise.all([
    fetchSiteConfig(),
    fetchRecettes({ limit: 6, status: "publiee" }),
    fetchEvenements({ limit: 3, date_from: today, sort_by: "event_date", sort_order: "asc", status: "publiee" }),
    fetchEvenements({ limit: 3, date_to: yesterday, sort_by: "event_date", sort_order: "desc", status: "publiee" }),
  ]);

  const title = config?.title ?? "Vivante";
  const subtitle = config?.subtitle ?? "Manger les lieux";
  const baseline = config?.baseline ?? "Luberon";
  const homeIntro = config?.home_intro;
  const showEvents = config?.home_events_enabled !== false;
  const showPastEvents = config?.home_past_events_enabled !== false;
  const showRecipes = config?.home_recipes_enabled !== false;
  const showAbout = config?.home_about_enabled !== false;
  return (
    <>
      {/* Hero — fond clair avec motifs décoratifs */}
      <section className="relative bg-creme overflow-hidden py-24 sm:py-32">
        {/* Motifs décoratifs */}
        <div className="absolute top-6 left-8 sm:left-16">
          <EtoileOrange className="w-10 h-10 sm:w-14 sm:h-14" />
        </div>
        <div className="absolute top-20 right-12 sm:right-24">
          <EtoileBleu className="w-5 h-5" />
        </div>
        <div className="absolute bottom-8 right-8 sm:right-20">
          <Soleil className="w-16 h-16 sm:w-20 sm:h-20 opacity-80" />
        </div>
        <div className="absolute bottom-0 left-16 sm:left-32">
          <DemiSoleil className="w-20 h-10 opacity-50" />
        </div>
        <div className="absolute top-1/3 left-4 sm:left-10 opacity-40">
          <CourbePeche className="w-8 h-16" />
        </div>
        <div className="absolute top-12 right-1/3 opacity-50">
          <OndeVerte className="w-12 h-6" />
        </div>
        <div className="absolute bottom-20 left-1/4 opacity-30">
          <EtoileOrange className="w-6 h-6" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="font-serif text-6xl sm:text-8xl font-bold tracking-tight text-brun">
            {title}
          </h1>
          <p className="mt-2 text-sm uppercase tracking-[0.3em] text-brun-light">
            &mdash; {subtitle} &mdash;
          </p>
          {baseline && (
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-brun-light/60">
              {baseline}
            </p>
          )}
          {homeIntro ? (
            <div className="mt-8 text-xl sm:text-2xl text-brun-light max-w-2xl mx-auto leading-relaxed font-serif italic"
              dangerouslySetInnerHTML={{ __html: homeIntro }} />
          ) : (
            <p className="mt-8 text-xl sm:text-2xl text-brun-light max-w-2xl mx-auto leading-relaxed font-serif italic">
              Cuisine vivante, festive et populaire
              <br />
              au c&oelig;ur du {baseline}
            </p>
          )}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/evenements"
              className="inline-flex items-center justify-center px-7 py-3.5 bg-orange text-white font-semibold rounded-full hover:bg-orange-light transition-colors shadow-sm"
            >
              Nos prochains événements
            </Link>
            <Link
              href="/recettes"
              className="inline-flex items-center justify-center px-7 py-3.5 border-2 border-brun/20 text-brun font-semibold rounded-full hover:bg-brun/5 transition-colors"
            >
              Découvrir nos recettes
            </Link>
          </div>
        </div>
      </section>

      {/* Prochains événements */}
      {showEvents && prochainsEvenements.length > 0 && (
        <section className="py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-end justify-between mb-10">
              <div className="flex items-center gap-3">
                <EtoileOrange className="w-7 h-7 hidden sm:block" />
                <div>
                  <h2 className="font-serif text-3xl sm:text-4xl text-brun">
                    {config?.home_events_title ?? "Prochains événements"}
                  </h2>
                  <p className="mt-2 text-brun-light">
                    {config?.home_events_subtitle ?? "Retrouvez-nous autour d'une table"}
                  </p>
                </div>
              </div>
              <Link
                href="/evenements"
                className="hidden sm:inline-flex text-sm font-semibold text-orange hover:text-orange-light transition-colors"
              >
                Voir tout &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {prochainsEvenements.map((evt) => (
                <EvenementCard key={evt.id} evenement={evt} />
              ))}
            </div>
            <div className="sm:hidden mt-6 text-center">
              <Link
                href="/evenements"
                className="text-sm font-semibold text-orange"
              >
                Voir tous les événements &rarr;
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Événements passés */}
      {showPastEvents && eventsPasses.length > 0 && (
        <section className="py-16 sm:py-20 bg-white/40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="font-serif text-3xl sm:text-4xl text-brun-light">
                  {config?.home_past_events_title ?? "Événements passés"}
                </h2>
                <p className="mt-2 text-brun-light/70">
                  {config?.home_past_events_subtitle ?? "Retour sur nos dernières rencontres"}
                </p>
              </div>
              <Link
                href="/evenements"
                className="hidden sm:inline-flex text-sm font-semibold text-orange hover:text-orange-light transition-colors"
              >
                Voir tous les événements &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {eventsPasses.map((evt) => (
                <EvenementCard key={evt.id} evenement={evt} variant="past" />
              ))}
            </div>
            <div className="sm:hidden mt-6 text-center">
              <Link
                href="/evenements"
                className="text-sm font-semibold text-orange"
              >
                Voir tous les événements &rarr;
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Nos recettes */}
      {showRecipes && <section className="py-16 sm:py-20 bg-white/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-10">
            <div className="flex items-center gap-3">
              <EtoileBleu className="w-5 h-5 hidden sm:block" />
              <div>
                <h2 className="font-serif text-3xl sm:text-4xl text-brun">
                  {config?.home_recipes_title ?? "Nos recettes"}
                </h2>
                <p className="mt-2 text-brun-light">
                  {config?.home_recipes_subtitle ?? "Saveurs provençales à partager"}
                </p>
              </div>
            </div>
            <Link
              href="/recettes"
              className="hidden sm:inline-flex text-sm font-semibold text-orange hover:text-orange-light transition-colors"
            >
              Toutes les recettes &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recettes.map((recette) => (
              <RecetteCard key={recette.id} recette={recette} />
            ))}
          </div>
          <div className="sm:hidden mt-6 text-center">
            <Link
              href="/recettes"
              className="text-sm font-semibold text-orange"
            >
              Toutes les recettes &rarr;
            </Link>
          </div>
        </div>
      </section>}

      {/* Qui sommes-nous */}
      {showAbout &&
      <section className="relative py-16 sm:py-20 overflow-hidden">
        <div className="absolute top-8 right-12 opacity-40">
          <EtoileOrange className="w-8 h-8" />
        </div>
        <div className="absolute bottom-4 left-8 opacity-30">
          <OndeVerte className="w-10 h-5" />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl text-brun">
            {config?.home_about_title ?? "Qui sommes-nous ?"}
          </h2>
          {config?.home_about_text ? (
            <div className="mt-6 text-lg text-brun-light leading-relaxed max-w-2xl mx-auto"
              dangerouslySetInnerHTML={{ __html: config.home_about_text }} />
          ) : (
            <p className="mt-6 text-lg text-brun-light leading-relaxed max-w-2xl mx-auto">
              Cuisine vivante, festive et populaire au c&oelig;ur du {baseline}.
            </p>
          )}
          <Link
            href="/a-propos"
            className="inline-flex items-center justify-center mt-8 px-7 py-3.5 bg-vert-eau text-brun font-semibold rounded-full hover:bg-vert-eau-light transition-colors"
          >
            En savoir plus
          </Link>
        </div>
      </section>}
    </>
  );
}
