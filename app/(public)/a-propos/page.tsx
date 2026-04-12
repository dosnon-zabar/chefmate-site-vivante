import type { Metadata } from "next";
import { equipe } from "@/data/equipe";
import { fetchSiteConfig } from "@/lib/api";
import ImageWithFallback from "@/components/ImageWithFallback";

export async function generateMetadata(): Promise<Metadata> {
  const config = await fetchSiteConfig();
  return {
    title: config?.about_seo_title ?? "À propos",
    description: config?.about_seo_desc ?? undefined,
    openGraph: config?.about_seo_image ? { images: [config.about_seo_image] } : undefined,
  };
}

export default async function AProposPage() {
  const config = await fetchSiteConfig();

  return (
    <div className="py-12 sm:py-16">
      {/* Histoire et valeurs */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 mb-16">
        <h1 className="font-serif text-4xl sm:text-5xl text-brun">{config?.about_page_title ?? "À propos"}</h1>
        {config?.about_text ? (
          <div className="mt-8 space-y-6 text-brun-light leading-relaxed text-lg"
            dangerouslySetInnerHTML={{ __html: config.about_text }} />
        ) : (
          <div className="mt-8 space-y-6 text-brun-light leading-relaxed text-lg">
            <p>
              <strong className="text-brun">Vivante</strong> est né d&apos;une
              envie simple : remettre la cuisine au centre du village. Pas la
              cuisine des magazines, ni celle des restaurants étoilés — la cuisine
              populaire, celle qui se transmet, qui se partage, qui rassemble
              autour d&apos;une table en plein air.
            </p>
          </div>
        )}
      </section>

      {/* Valeurs */}
      {config?.about_values_enabled !== false && (
        <section className="bg-white py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="font-serif text-3xl text-brun text-center mb-12">
              {config?.about_values_title ?? "Nos valeurs"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {(config?.about_values && config.about_values.length > 0
                ? config.about_values
                : [
                    { title: "Territoire", text: "Ancré dans le Luberon, notre travail valorise les producteurs locaux, les savoir-faire paysans et les ressources du territoire." },
                    { title: "Convivialité", text: "La table est un lieu de rencontre. Nos événements sont ouverts à toutes et tous, sans distinction, dans un esprit de partage." },
                    { title: "Transmission", text: "Partager les gestes, les recettes et les histoires. La cuisine est un patrimoine vivant qui se transmet de main en main." },
                  ]
              ).map((val, i) => (
                <div key={i} className="text-center">
                  <h3 className="font-serif text-xl text-brun mb-2">{val.title}</h3>
                  <p className="text-sm text-brun-light leading-relaxed">{val.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Équipe */}
      {config?.about_team_enabled !== false && (
        <section className="py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="font-serif text-3xl text-brun text-center mb-12">
              {config?.about_team_title ?? "L'équipe"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {(config?.about_team_members && config.about_team_members.length > 0
                ? config.about_team_members
                : equipe.map(m => ({ name: m.nom, image_url: m.photo_url, text: m.bio }))
              ).map((membre, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm">
                  {membre.image_url && (
                    <div className="relative aspect-square overflow-hidden">
                      <ImageWithFallback
                        src={membre.image_url}
                        alt={membre.name}
                        fill
                        className="object-cover"
                        fallbackText={membre.name}
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="font-serif text-xl text-brun">{membre.name}</h3>
                    {membre.text && (
                      <p className="text-sm text-brun-light mt-3 leading-relaxed">{membre.text}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact */}
      {config?.about_contact_enabled !== false && (
        <section className="bg-brun text-ivoire py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="font-serif text-3xl mb-4">
              {config?.about_contact_title ?? "Nous contacter"}
            </h2>
            {config?.about_contact_text ? (
              <div className="text-ivoire/70 mb-6" dangerouslySetInnerHTML={{ __html: config.about_contact_text }} />
            ) : (
              <p className="text-ivoire/70 mb-6">
                Une question, une envie de participer, une idée de collaboration ?
              </p>
            )}
            {(config?.contact_email) && (
              <a
                href={`mailto:${config.contact_email}`}
                className="inline-flex items-center justify-center px-6 py-3 bg-terracotta text-ivoire font-medium rounded-lg hover:bg-terracotta-dark transition-colors"
              >
                {config.contact_email}
              </a>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
