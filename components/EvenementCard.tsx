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

function getDisplayDate(evenement: Evenement, variant: "upcoming" | "past"): string {
  // Multi-dates
  if (evenement.dates.length > 0) {
    const sorted = evenement.dates.slice().sort((a, b) =>
      a.start_datetime.localeCompare(b.start_datetime)
    );
    if (variant === "upcoming") {
      const now = new Date().toISOString();
      const next = sorted.find((d) => d.start_datetime >= now) || sorted[0];
      const formatted = formatDate(next.start_datetime);
      if (sorted.length > 1) {
        return `${formatted} (+${sorted.length - 1} autre${sorted.length > 2 ? "s" : ""})`;
      }
      return formatted;
    }
    // past : montrer la dernière
    const last = sorted[sorted.length - 1];
    return formatDate(last.start_datetime);
  }
  return formatDate(evenement.date);
}

export default function EvenementCard({ evenement, variant = "upcoming" }: Props) {
  const displayDate = getDisplayDate(evenement, variant);

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
          <p className="text-xs text-brun-light/60">{displayDate}</p>
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
          {displayDate}
        </p>
        <h3 className="font-serif text-xl text-brun mt-1 group-hover:text-orange transition-colors">
          {evenement.titre}
        </h3>
        {evenement.description && (
          <p className="text-sm text-brun-light mt-2 line-clamp-2">
            {evenement.description.replace(/<[^>]*>/g, "").trim()}
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
