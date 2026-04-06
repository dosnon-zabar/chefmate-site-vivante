import Link from "next/link";
import type { Evenement } from "@/lib/types";
import ImageWithFallback from "./ImageWithFallback";

type Props = {
  evenement: Evenement;
  variant?: "upcoming" | "past";
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "Date à confirmer";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function EvenementCard({ evenement, variant = "upcoming" }: Props) {
  if (variant === "past") {
    return (
      <Link
        href={`/evenements/${evenement.slug}`}
        className="group block bg-white/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
      >
        <div className="relative aspect-[16/9] overflow-hidden">
          <ImageWithFallback
            src={evenement.photo_url}
            alt={evenement.titre}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
            fallbackText={evenement.titre}
          />
        </div>
        <div className="p-4">
          <p className="text-xs text-brun-light/60">
            {formatDate(evenement.date)}
          </p>
          <h3 className="font-serif text-lg text-brun mt-1 group-hover:text-orange transition-colors">
            {evenement.titre}
          </h3>
          {evenement.compte_rendu && (
            <p className="text-xs text-orange font-medium mt-2">
              Voir le compte-rendu &rarr;
            </p>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/evenements/${evenement.slug}`}
      className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <ImageWithFallback
          src={evenement.photo_url}
          alt={evenement.titre}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          fallbackText={evenement.titre}
        />
      </div>
      <div className="p-5">
        <p className="text-xs font-semibold text-orange uppercase tracking-wide">
          {formatDate(evenement.date)}
        </p>
        <h3 className="font-serif text-xl text-brun mt-1 group-hover:text-orange transition-colors">
          {evenement.titre}
        </h3>
        {evenement.description && (
          <p className="text-sm text-brun-light mt-2 line-clamp-2">
            {evenement.description}
          </p>
        )}
        <div className="flex items-center justify-between mt-4">
          {evenement.nombre_places > 0 && (
            <span className="text-xs text-vert-eau font-semibold">
              {evenement.nombre_places} places
            </span>
          )}
          <span className="text-xs text-orange font-medium ml-auto">
            En savoir plus &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}
