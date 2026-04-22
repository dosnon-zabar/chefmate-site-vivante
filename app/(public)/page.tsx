import Link from "next/link";
import { fetchRecettes, fetchEvenements, fetchSiteConfig } from "@/lib/api";
import RecetteCard from "@/components/RecetteCard";
import EvenementCard from "@/components/EvenementCard";
import { EtoileOrange, OndeVerte } from "@/components/Motifs";

export default async function Accueil() {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  const [config, { recettes }, { evenements: prochainsEvenements }, { evenements: eventsPasses }] = await Promise.all([
    fetchSiteConfig(),
    fetchRecettes({ limit: 6, status: "publiee" }),
    fetchEvenements({ limit: 3, date_from: today, sort_by: "event_date", sort_order: "desc", status: "publiee" }),
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
      {/* Hero — image de fond ou fond blanc avec pictos */}
      <section
        className={`relative overflow-hidden py-28 sm:py-36 ${config?.home_hero_image ? "bg-cover bg-center" : ""}`}
        style={config?.home_hero_image ? { backgroundImage: `url(${config.home_hero_image})` } : undefined}
      >
        {/* Overlay sombre si image de fond */}
        {config?.home_hero_image && (
          <div className="absolute inset-0 bg-brun/50" />
        )}

        {/* Pictos décoratifs — masqués si image de fond */}
        {!config?.home_hero_image && (
          <>
            <img src="/picto-soleil.png" alt="" className="absolute -top-16 -right-16 w-52 sm:w-72 opacity-80 pointer-events-none" />
            <img src="/picto-etoile.png" alt="" className="absolute top-12 left-[10%] w-20 sm:w-28 opacity-50 pointer-events-none -rotate-12" />
            <img src="/picto-onde.png" alt="" className="absolute bottom-16 right-[15%] w-16 sm:w-24 opacity-60 pointer-events-none" />
            <img src="/picto-etoile.png" alt="" className="absolute bottom-6 left-[30%] w-10 sm:w-14 opacity-30 pointer-events-none rotate-45" />
          </>
        )}

        <div className={`relative max-w-6xl mx-auto px-4 sm:px-6 text-center ${config?.home_hero_image ? "text-ivoire" : ""}`}>
          <h1 className={`text-[5.5rem] sm:text-[8rem] font-normal ${config?.home_hero_image ? "text-ivoire drop-shadow-lg" : "text-brun"}`}>
            {title}
          </h1>
          <p className={`mt-2 text-sm uppercase tracking-[0.3em] flex items-center justify-center gap-3 ${config?.home_hero_image ? "text-ivoire/80" : "text-brun-light"}`} style={{ fontFamily: "Nunito, sans-serif" }}>
            <img src="/dash.png" alt="" className="h-3 w-auto opacity-60" />
            {subtitle}
            <img src="/dash.png" alt="" className="h-3 w-auto opacity-60 scale-x-[-1]" />
          </p>
          {baseline && (
            <p className={`mt-1 text-xs uppercase tracking-[0.2em] ${config?.home_hero_image ? "text-ivoire/60" : "text-brun-light/60"}`} style={{ fontFamily: "Nunito, sans-serif" }}>
              {baseline}
            </p>
          )}
          {homeIntro ? (
            <div className={`my-14 mx-auto ${config?.home_hero_image ? "text-ivoire/90" : "text-brun-light"}`} style={{ fontFamily: "DM Sans, sans-serif", fontSize: "18px", lineHeight: "150%", maxWidth: "550px" }}
              dangerouslySetInnerHTML={{ __html: homeIntro }} />
          ) : (
            <p className={`my-14 mx-auto ${config?.home_hero_image ? "text-ivoire/90" : "text-brun-light"}`} style={{ fontFamily: "DM Sans, sans-serif", fontSize: "18px", lineHeight: "150%", maxWidth: "550px" }}>
              Cuisine vivante, festive et populaire
              <br />
              au c&oelig;ur du {baseline}
            </p>
          )}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/evenements"
              className="inline-flex items-center justify-center px-7 py-3.5 bg-vert-eau text-white font-semibold uppercase rounded-full hover:bg-vert-eau-light transition-colors shadow-sm"
            >
              Nos événements
            </Link>
            <Link
              href="/recettes"
              className={`inline-flex items-center justify-center px-7 py-3.5 border-2 font-semibold uppercase rounded-full transition-colors ${config?.home_hero_image ? "border-ivoire/40 text-ivoire hover:bg-ivoire/10" : "border-brun/20 text-brun hover:bg-brun/5"}`}
            >
              Découvrir nos recettes
            </Link>
          </div>
        </div>
      </section>

      {/* Prochains événements */}
      {showEvents && prochainsEvenements.length > 0 && (
        <section className="relative py-20 sm:py-28">
          <img src="/picto-etoile.png" alt="" className="absolute -top-6 right-[5%] w-24 sm:w-36 opacity-30 pointer-events-none -rotate-12" />
          <img src="/picto-onde.png" alt="" className="absolute bottom-10 left-[8%] w-12 sm:w-16 opacity-25 pointer-events-none rotate-12 hidden sm:block" />
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-end justify-between mb-12">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="font-serif text-6xl text-brun">
                    {config?.home_events_title ?? "Prochains événements"}
                  </h2>
                  <p className="mt-2 text-brun-light">
                    {config?.home_events_subtitle ?? "Retrouvez-nous autour d'une table"}
                  </p>
                </div>
              </div>
              <Link
                href="/evenements"
                className="hidden sm:inline-flex text-sm font-semibold text-orange uppercase hover:text-orange-light transition-colors"
              >
                Tous les événements &rarr;
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
                className="text-sm font-semibold text-orange uppercase"
              >
                Tous les événements &rarr;
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Événements passés */}
      {showPastEvents && eventsPasses.length > 0 && (
        <section className="relative py-20 sm:py-28 bg-stone-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="font-serif text-6xl text-brun-light">
                  {config?.home_past_events_title ?? "Événements passés"}
                </h2>
                <p className="mt-2 text-brun-light/70">
                  {config?.home_past_events_subtitle ?? "Retour sur nos dernières rencontres"}
                </p>
              </div>
              <Link
                href="/evenements"
                className="hidden sm:inline-flex text-sm font-semibold text-orange uppercase hover:text-orange-light transition-colors"
              >
                Tous les événements &rarr;
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
                className="text-sm font-semibold text-orange uppercase"
              >
                Tous les événements &rarr;
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Nos recettes */}
      {showRecipes && <section className="relative py-20 sm:py-28">
        <img src="/picto-soleil.png" alt="" className="absolute -bottom-12 -left-12 w-40 sm:w-56 opacity-25 pointer-events-none" />
        <img src="/picto-etoile.png" alt="" className="absolute top-16 right-[10%] w-14 sm:w-20 opacity-20 pointer-events-none rotate-12 hidden sm:block" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-12">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="font-serif text-6xl text-brun">
                  {config?.home_recipes_title ?? "Nos recettes"}
                </h2>
                <p className="mt-2 text-brun-light">
                  {config?.home_recipes_subtitle ?? "Saveurs provençales à partager"}
                </p>
              </div>
            </div>
            <Link
              href="/recettes"
              className="hidden sm:inline-flex text-sm font-semibold text-orange uppercase hover:text-orange-light transition-colors"
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
              className="text-sm font-semibold text-orange uppercase"
            >
              Toutes les recettes &rarr;
            </Link>
          </div>
        </div>
      </section>}

      {/* Qui sommes-nous */}
      {showAbout &&
      <section className="relative py-20 sm:py-28 bg-stone-50 overflow-hidden">
        <img src="/picto-soleil.png" alt="" className="absolute -bottom-14 -right-14 w-44 sm:w-56 opacity-30 pointer-events-none" />
        <img src="/picto-onde.png" alt="" className="absolute top-12 left-[8%] w-14 sm:w-20 opacity-30 pointer-events-none -rotate-12 hidden sm:block" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-serif text-6xl text-brun">
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
            className="inline-flex items-center justify-center mt-8 px-7 py-3.5 bg-vert-eau text-white font-semibold uppercase rounded-full hover:bg-vert-eau-light transition-colors shadow-sm"
          >
            En savoir plus
          </Link>
        </div>
      </section>}
    </>
  );
}
