import Link from "next/link";
import type { Recette } from "@/lib/types";
import ImageWithFallback from "./ImageWithFallback";

type Props = {
  recette: Recette;
};

export default function RecetteCard({ recette }: Props) {
  return (
    <Link
      href={`/recettes/${recette.slug}`}
      className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <ImageWithFallback
          src={recette.photo_url}
          alt={recette.nom}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          fallbackText={recette.nom}
        />
      </div>
      <div className="p-4">
        <h3 className="font-serif text-lg text-brun group-hover:text-orange transition-colors">
          {recette.nom}
        </h3>
        <p className="text-xs text-brun-light mt-1">
          Par {recette.auteur.nom} &middot; {recette.saison}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {recette.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[11px] px-2 py-0.5 rounded-full bg-vert-eau/15 text-vert-eau font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
