"use client"

/**
 * ShoppingListModal — popin "Liste de courses" sur la fiche recette.
 *
 * Déclenchée par ShoppingListButton sous la liste d'ingrédients.
 * L'utilisateur ajuste le nombre de parts (±) et voit la liste se
 * recalculer en direct, groupée par rayon de supermarché dans l'ordre
 * défini par l'admin (sort_order par parent + par enfant).
 *
 * Trois règles métier clés :
 *
 *  - **Fallback du rayon** : si `recipe_ingredients.aisle_id` est null,
 *    on utilise `master.default_aisle` (géré en amont dans mapRecipe).
 *    Un ingrédient ne tombe en "Autres" QUE si ni l'un ni l'autre ne
 *    sont renseignés.
 *
 *  - **Ordre des rayons** : on trie par (parent.sort_order,
 *    own.sort_order, own.nom). Pour un rayon sans parent, on utilise
 *    (own.sort_order, 0, own.nom). "Autres" (aucun rayon) toujours
 *    en dernier. Le parent n'est pas affiché — c'est juste un axe
 *    de tri, la section reste le rayon-feuille.
 *
 *  - **Regroupement de doublons** : deux entrées avec le même nom
 *    (lowercase + trim) ET la même unité sont fusionnées, les
 *    quantités additionnées. Les commentaires distincts sont
 *    concaténés ; les commentaires identiques dédupliqués.
 */

import { useState, useEffect, useMemo } from "react"
import { formatIngredientNatural } from "@/lib/format-ingredient"
import type { Recette, Aisle } from "@/lib/types"

interface Props {
  open: boolean
  onClose: () => void
  recette: Recette
  /** Référentiel complet des rayons (fetch séparé via fetchAisles). */
  aisles: Aisle[]
}

/** Max 2 décimales, pareil que manager/RecipePdfModal.tsx. */
function roundQty(qty: number): number {
  if (qty === Math.floor(qty)) return qty
  return Math.round(qty * 100) / 100
}

/** Clé de merge : nom normalisé + unité. */
function mergeKey(nom: string, unite: string): string {
  return `${nom.trim().toLowerCase()}|${unite.trim().toLowerCase()}`
}

export default function ShoppingListModal({ open, onClose, recette, aisles }: Props) {
  const [portions, setPortions] = useState(recette.nombre_parts || 1)

  useEffect(() => {
    if (open) setPortions(recette.nombre_parts || 1)
  }, [open, recette.nombre_parts])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  const portionLabel = recette.portion_type || "personnes"
  const multiplier = portions / (recette.nombre_parts || 1)

  /** Map aisle id → aisle row (pour lookup parent). */
  const aislesById = useMemo(() => {
    const m = new Map<string, Aisle>()
    for (const a of aisles) m.set(a.id, a)
    return m
  }, [aisles])

  /**
   * Résultat : tableau de sections, chaque section = un rayon-feuille
   * (ou "Autres"), avec ses ingrédients déjà fusionnés. Sections triées
   * dans l'ordre de course : parent.sort_order → own.sort_order → nom.
   */
  const grouped = useMemo(() => {
    type Merged = {
      nom: string
      nom_pluriel?: string | null
      unite: string
      unite_pluriel?: string | null
      scaledQty: number
      comments: string[]
      rayonId: string | null
    }

    // 1. Merge par (nom + unité) pour fusionner les doublons.
    const mergedMap = new Map<string, Merged>()
    for (const ing of recette.ingredients) {
      const name = ing.nom.trim()
      if (!name) continue
      const scaled = ing.quantite ? roundQty(ing.quantite * multiplier) : 0
      const key = mergeKey(name, ing.unite || "")
      const existing = mergedMap.get(key)
      if (existing) {
        existing.scaledQty = roundQty(existing.scaledQty + scaled)
        if (ing.commentaire && !existing.comments.includes(ing.commentaire)) {
          existing.comments.push(ing.commentaire)
        }
        // Preserve the first non-null rayon (they should match in
        // practice ; if they don't, first-seen wins).
        if (!existing.rayonId && ing.rayon?.id) {
          existing.rayonId = ing.rayon.id
        }
      } else {
        mergedMap.set(key, {
          nom: name,
          nom_pluriel: ing.nom_pluriel ?? null,
          unite: ing.unite,
          unite_pluriel: ing.unite_pluriel ?? null,
          scaledQty: scaled,
          comments: ing.commentaire ? [ing.commentaire] : [],
          rayonId: ing.rayon?.id ?? null,
        })
      }
    }

    // 2. Group by rayon id (leaf).
    const byRayon = new Map<
      string,
      { rayon: Aisle | null; items: Merged[] }
    >()
    for (const m of mergedMap.values()) {
      const rayon = m.rayonId ? aislesById.get(m.rayonId) ?? null : null
      const key = rayon?.id ?? "__autres__"
      const bucket = byRayon.get(key) ?? { rayon, items: [] }
      bucket.items.push(m)
      byRayon.set(key, bucket)
    }

    // 3. Sort key for each rayon: (parent.sort_order, own.sort_order, own.name).
    //    Rayons without parent use their own sort_order as the "parent" slot
    //    so top-level aisles can interleave naturally with children of other
    //    parents. "Autres" always last.
    function sortKey(rayon: Aisle | null): [number, number, string] {
      if (!rayon) return [Number.MAX_SAFE_INTEGER, 0, ""]
      const parent = rayon.parent_id ? aislesById.get(rayon.parent_id) : null
      const parentSort = parent
        ? parent.sort_order ?? 0
        : rayon.sort_order ?? 0
      const ownSort = parent ? rayon.sort_order ?? 0 : 0
      return [parentSort, ownSort, rayon.name]
    }

    return [...byRayon.values()].sort((a, b) => {
      const ka = sortKey(a.rayon)
      const kb = sortKey(b.rayon)
      if (ka[0] !== kb[0]) return ka[0] - kb[0]
      if (ka[1] !== kb[1]) return ka[1] - kb[1]
      return ka[2].localeCompare(kb[2], "fr")
    })
  }, [recette.ingredients, aislesById, multiplier])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shopping-list-title"
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1
              id="shopping-list-title"
              className="font-serif text-3xl text-brun leading-tight"
            >
              Liste de courses
            </h1>
            <h2 className="font-serif text-xl text-brun-light mt-1">
              {recette.nom}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="text-brun-light hover:text-brun text-lg leading-none flex-shrink-0"
          >
            ✕
          </button>
        </div>

        <div className="bg-creme rounded-lg p-4 mb-5">
          <label className="block text-sm font-medium text-brun mb-2">
            Recette pour {recette.nombre_parts} {portionLabel} — adapter
            pour
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPortions((p) => Math.max(1, p - 1))}
              aria-label="Diminuer"
              className="w-9 h-9 rounded-full bg-white border border-brun/10 text-brun flex items-center justify-center hover:bg-creme-dark transition-colors text-lg"
            >
              −
            </button>
            <input
              type="number"
              min={1}
              value={portions}
              onChange={(e) =>
                setPortions(Math.max(1, parseInt(e.target.value) || 1))
              }
              className="w-16 text-center text-lg font-semibold text-brun bg-white border border-brun/10 rounded-lg px-2 py-1"
            />
            <button
              type="button"
              onClick={() => setPortions((p) => p + 1)}
              aria-label="Augmenter"
              className="w-9 h-9 rounded-full bg-white border border-brun/10 text-brun flex items-center justify-center hover:bg-creme-dark transition-colors text-lg"
            >
              +
            </button>
            <span className="text-sm text-brun-light">{portionLabel}</span>
            {multiplier !== 1 && (
              <span className="text-xs text-terracotta ml-auto font-medium">
                ×{roundQty(multiplier)}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-5">
          {grouped.length === 0 ? (
            <p className="text-sm text-brun-light italic">
              Pas d&apos;ingrédients dans cette recette.
            </p>
          ) : (
            grouped.map((g) => (
              <section key={g.rayon?.id ?? "__autres__"}>
                <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brun-light mb-2">
                  {g.rayon?.color && (
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: g.rayon.color }}
                      aria-hidden
                    />
                  )}
                  {g.rayon?.name ?? "Autres"}
                </h4>
                <ul className="space-y-1.5">
                  {g.items.map((ing, i) => (
                    <li key={i} className="text-sm text-brun leading-snug">
                      {ing.scaledQty > 0
                        ? formatIngredientNatural(
                            ing.nom,
                            ing.scaledQty,
                            ing.unite,
                            ing.unite_pluriel,
                            ing.nom_pluriel
                          )
                        : ing.nom}
                      {ing.comments.length > 0 && (
                        <span className="text-brun-light italic ml-1">
                          ({ing.comments.join(" ; ")})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-vert-eau text-white rounded-lg hover:bg-vert-eau-light transition-colors text-sm font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
