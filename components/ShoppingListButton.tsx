"use client"

/**
 * Petit wrapper client qui expose un bouton "Liste de courses" et
 * la popin ShoppingListModal associée. Existe pour que la page
 * recette puisse rester un Server Component — seul ce composant
 * a besoin de useState.
 */

import { useState } from "react"
import type { Recette, Aisle } from "@/lib/types"
import ShoppingListModal from "./ShoppingListModal"

export default function ShoppingListButton({
  recette,
  aisles,
}: {
  recette: Recette
  aisles: Aisle[]
}) {
  const [open, setOpen] = useState(false)

  // Pas d'ingrédients → on ne propose pas le bouton (pas utile).
  if (recette.ingredients.length === 0) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-vert-eau text-white rounded-lg hover:bg-vert-eau-light transition-colors text-sm font-medium"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 3h2l.4 2m0 0L8 13h10l3-8H5.4M8 13l-2.7 5.4A1 1 0 006.2 20h11.6M9 21a1 1 0 110-2 1 1 0 010 2zm9 0a1 1 0 110-2 1 1 0 010 2z"
          />
        </svg>
        Liste de courses
      </button>
      <ShoppingListModal
        open={open}
        onClose={() => setOpen(false)}
        recette={recette}
        aisles={aisles}
      />
    </>
  )
}
