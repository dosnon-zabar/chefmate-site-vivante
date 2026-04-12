import { fetchEvenements, fetchSiteConfig } from "@/lib/api";
import EvenementCard from "@/components/EvenementCard";
import { EtoileOrange } from "@/components/Motifs";

export default async function EvenementsPage() {
  const today = new Date().toISOString().split("T")[0];

  const [config, { evenements: aVenir }, { evenements: passes }] = await Promise.all([
    fetchSiteConfig(),
    fetchEvenements({ limit: 20, date_from: today, sort_by: "event_date", sort_order: "asc", status: "publiee" }),
    fetchEvenements({ limit: 20, date_to: new Date(Date.now() - 86400000).toISOString().split("T")[0], sort_by: "event_date", sort_order: "desc", status: "publiee" }),
  ]);

  const aucunEvent = aVenir.length === 0 && passes.length === 0;

  return (
    <div className="py-12 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-12">
          <h1 className="font-serif text-4xl sm:text-5xl text-brun">
            Événements
          </h1>
          {config?.events_intro ? (
            <div className="mt-3 text-lg text-brun-light" dangerouslySetInnerHTML={{ __html: config.events_intro }} />
          ) : (
            <p className="mt-3 text-lg text-brun-light">
              Banquets, ateliers, marchés et rencontres — retrouvez-nous sur le terrain.
            </p>
          )}
        </div>

        {aucunEvent && (
          <p className="text-brun-light py-12 text-center">
            Pas d&apos;événement pour le moment — restez connectés !
          </p>
        )}

        {aVenir.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <EtoileOrange className="w-6 h-6" />
              <h2 className="font-serif text-2xl sm:text-3xl text-brun">
                À venir
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {aVenir.map((evt) => (
                <EvenementCard key={evt.id} evenement={evt} variant="upcoming" />
              ))}
            </div>
          </section>
        )}

        {passes.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-8">
              <h2 className="font-serif text-2xl sm:text-3xl text-brun-light">
                Événements passés
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {passes.map((evt) => (
                <EvenementCard key={evt.id} evenement={evt} variant="past" />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
