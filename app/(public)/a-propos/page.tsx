import { equipe } from "@/data/equipe";
import { fetchSiteConfig } from "@/lib/api";
import ImageWithFallback from "@/components/ImageWithFallback";

export default async function AProposPage() {
  const config = await fetchSiteConfig();

  return (
    <div className="py-12 sm:py-16">
      {/* Histoire et valeurs */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 mb-16">
        <h1 className="font-serif text-4xl sm:text-5xl text-brun">À propos</h1>
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
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="font-serif text-3xl text-brun text-center mb-12">
            Nos valeurs
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-sauge/15 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-sauge" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              </div>
              <h3 className="font-serif text-xl text-brun mb-2">Territoire</h3>
              <p className="text-sm text-brun-light leading-relaxed">
                Ancré dans le Luberon, notre travail valorise les producteurs
                locaux, les savoir-faire paysans et les ressources du territoire.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-ocre/15 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-ocre" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <h3 className="font-serif text-xl text-brun mb-2">Convivialité</h3>
              <p className="text-sm text-brun-light leading-relaxed">
                La table est un lieu de rencontre. Nos événements sont ouverts à
                toutes et tous, sans distinction, dans un esprit de partage.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-terracotta/15 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
              </div>
              <h3 className="font-serif text-xl text-brun mb-2">Transmission</h3>
              <p className="text-sm text-brun-light leading-relaxed">
                Partager les gestes, les recettes et les histoires. La cuisine
                est un patrimoine vivant qui se transmet de main en main.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Équipe */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="font-serif text-3xl text-brun text-center mb-12">
            L&apos;équipe
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {equipe.map((membre) => (
              <div
                key={membre.id}
                className="bg-white rounded-xl overflow-hidden shadow-sm"
              >
                <div className="relative aspect-square overflow-hidden">
                  <ImageWithFallback
                    src={membre.photo_url}
                    alt={membre.nom}
                    fill
                    className="object-cover"
                    fallbackText={membre.nom}
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-serif text-xl text-brun">
                    {membre.nom}
                  </h3>
                  <p className="text-sm text-terracotta mt-0.5">
                    {membre.role}
                  </p>
                  <p className="text-sm text-brun-light mt-3 leading-relaxed">
                    {membre.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="bg-brun text-ivoire py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-serif text-3xl mb-4">Nous contacter</h2>
          <p className="text-ivoire/70 mb-6">
            Une question, une envie de participer, une idée de collaboration ?
          </p>
          <a
            href="mailto:contact@vivante-luberon.fr"
            className="inline-flex items-center justify-center px-6 py-3 bg-terracotta text-ivoire font-medium rounded-lg hover:bg-terracotta-dark transition-colors"
          >
            contact@vivante-luberon.fr
          </a>
        </div>
      </section>
    </div>
  );
}
