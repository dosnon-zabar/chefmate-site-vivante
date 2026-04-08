"use client";

import { useState, useActionState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import EventDatesEditor from "./EventDatesEditor";
import ImageManager, { type ManagedImage, type ImageManagerHandle } from "./ImageManager";
import RichTextEditor from "@/components/RichTextEditor";
import ToastFlash from "@/components/ToastFlash";
import type { Evenement, EventDate } from "@/lib/types";
import { createEventAction, updateEventAction, type ActionState } from "./actions";

type Props = {
  event?: Evenement;
};

type EditableTestimonial = {
  id?: string;
  auteur: string;
  role?: string;
  texte: string;
  sort_order?: number;
};

type Tab = "general" | "presentation" | "compte-rendu" | "temoignages";

const inputClass =
  "w-full px-3 py-2.5 rounded-lg border border-brun/10 bg-creme text-sm text-brun placeholder:text-brun-light/40 focus:outline-none focus:ring-2 focus:ring-orange/30";

const labelClass = "block text-sm font-medium text-brun mb-1";

function toManagedImages(event: Evenement | undefined, type: "cover" | "report"): ManagedImage[] {
  if (!event) return [];
  return event.images
    .filter((img) => img.type === type && img.id)
    .map((img) => ({
      id: img.id!,
      image_url: img.url,
      caption: img.caption || null,
      copyright: img.copyright || null,
      sort_order: img.sort_order || 0,
    }));
}

export default function EventForm({ event }: Props) {
  const isEdit = !!event;
  const action = isEdit ? updateEventAction : createEventAction;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);
  const [flushing, setFlushing] = useState(false);

  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab | null) || "general";
  const validTabs: Tab[] = ["general", "presentation", "compte-rendu", "temoignages"];
  const [tab, setTab] = useState<Tab>(
    validTabs.includes(initialTab) ? initialTab : "general"
  );
  const [dates, setDates] = useState<EventDate[]>(event?.dates || []);
  const [testimonials, setTestimonials] = useState<EditableTestimonial[]>(
    event?.temoignages || []
  );

  const initialCoverImages = toManagedImages(event, "cover");
  const initialReportImages = toManagedImages(event, "report");

  // Refs vers les ImageManager pour pouvoir flusher leurs modifs en attente
  // (caption / copyright) au clic sur un bouton d'enregistrement.
  const coverMgrRef = useRef<ImageManagerHandle>(null);
  const reportMgrRef = useRef<ImageManagerHandle>(null);

  /**
   * Wrapper autour de formAction : déclenche d'abord les flush des ImageManager
   * (PATCH des caption/copyright en attente), PUIS laisse le server action
   * faire son travail normal (PATCH event, redirect, etc.).
   */
  async function handleAction(formData: FormData) {
    setFlushing(true);
    try {
      await Promise.all([
        coverMgrRef.current?.flushPending?.() ?? Promise.resolve(true),
        reportMgrRef.current?.flushPending?.() ?? Promise.resolve(true),
      ]);
    } finally {
      setFlushing(false);
    }
    return formAction(formData);
  }

  const isPending = pending || flushing;

  function addTestimonial() {
    setTestimonials([
      ...testimonials,
      { auteur: "", texte: "", role: "", sort_order: testimonials.length },
    ]);
  }

  function updateTestimonial(idx: number, patch: Partial<EditableTestimonial>) {
    setTestimonials(testimonials.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  }

  function removeTestimonial(idx: number) {
    setTestimonials(testimonials.filter((_, i) => i !== idx));
  }

  const testimonialsPayload = testimonials
    .filter((t) => t.auteur && t.texte)
    .map((t, idx) => ({
      author_name: t.auteur,
      author_role: t.role || null,
      text: t.texte,
      sort_order: idx,
    }));

  return (
    <form action={handleAction} className="space-y-6">
      {/* Toast après save_and_stay */}
      <ToastFlash param="saved" message="L'événement a bien été modifié !" type="success" />

      {isEdit && <input type="hidden" name="event_id" value={event!.id} />}
      <input type="hidden" name="dates_json" value={JSON.stringify(dates)} />
      <input type="hidden" name="testimonials_json" value={JSON.stringify(testimonialsPayload)} />

      {state?.error && (
        <div className="bg-rose/10 text-rose text-sm px-4 py-3 rounded-lg">
          {state.error}
        </div>
      )}

      {/* Onglets */}
      <div className="flex gap-1 border-b border-brun/10">
        {(
          [
            { key: "general", label: "Infos générales", disabled: false },
            { key: "presentation", label: "Présentation", disabled: !isEdit },
            { key: "compte-rendu", label: "Compte-rendu", disabled: !isEdit },
            { key: "temoignages", label: "Témoignages", disabled: !isEdit },
          ] as { key: Tab; label: string; disabled: boolean }[]
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => !t.disabled && setTab(t.key)}
            disabled={t.disabled}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-[1px] transition-colors ${
              t.disabled
                ? "border-transparent text-brun-light/30 cursor-not-allowed"
                : tab === t.key
                ? "border-orange text-orange"
                : "border-transparent text-brun-light hover:text-brun"
            }`}
          >
            {t.label}
            {t.disabled && (
              <svg className="inline w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            )}
          </button>
        ))}
      </div>

      {/* === ONGLET GÉNÉRAL === */}
      {tab === "general" && (
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <label className={labelClass}>Titre</label>
            <input
              name="name"
              type="text"
              defaultValue={event?.titre || ""}
              required
              className={inputClass}
              placeholder="Nom de l'événement"
            />
          </div>

          <div>
            <label className={labelClass}>Slug (URL)</label>
            <input
              name="slug"
              type="text"
              defaultValue={event?.slug || ""}
              className={inputClass}
              placeholder="Auto-généré si vide"
            />
            <p className="text-xs text-brun-light/60 mt-1">
              URL : /evenements/<strong>{event?.slug || "..."}</strong>
            </p>
          </div>

          <div>
            <label className={labelClass}>Statut de publication</label>
            <select
              name="status"
              defaultValue={event?.statut || "brouillon"}
              className={inputClass}
            >
              <option value="brouillon">Brouillon</option>
              <option value="non_publiee">Non publié</option>
              <option value="publiee">Publié</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Description courte</label>
            <RichTextEditor
              name="description"
              defaultValue={event?.description || ""}
              rows={3}
              placeholder="Quelques lignes résumant l'événement"
            />
          </div>

          <div>
            <label className={labelClass}>Dates de l&apos;événement</label>
            <p className="text-xs text-brun-light/60 mb-3">
              Vous pouvez ajouter plusieurs dates pour les événements récurrents.
            </p>
            <EventDatesEditor initialDates={dates} onChange={setDates} />
          </div>

          <div>
            <label className={labelClass}>Notes internes (optionnel)</label>
            <RichTextEditor
              name="notes"
              defaultValue={event?.notes || ""}
              rows={2}
              placeholder="Notes privées, non affichées publiquement"
            />
          </div>

          {!isEdit && (
            <div className="bg-jaune/10 border border-jaune/30 rounded-lg p-4 text-sm text-brun">
              <p className="font-medium mb-1">📌 Création en cours</p>
              <p className="text-brun-light">
                Pour ajouter des images de présentation et de compte-rendu, enregistrez
                d&apos;abord l&apos;événement (même en brouillon). Les onglets seront
                alors débloqués.
              </p>
            </div>
          )}
        </div>
      )}

      {/* === ONGLETS PRÉSENTATION & COMPTE-RENDU (édition uniquement) ===
          NOTE: on garde les deux onglets montés en permanence (hidden via CSS)
          pour préserver les modifs en attente dans les ImageManager quand on
          change d'onglet. Sans ça, taper une légende puis changer d'onglet
          effacerait les modifs non sauvegardées. */}
      {isEdit && (
        <>
          <div
            className={`bg-white rounded-2xl p-6 shadow-sm space-y-6 ${
              tab === "presentation" ? "" : "hidden"
            }`}
          >
            <div>
              <label className={labelClass}>Texte de présentation</label>
              <RichTextEditor
                name="presentation_text"
                defaultValue={event?.presentation || ""}
                rows={8}
                placeholder="Présentation détaillée de l'événement, ce qui y sera fait, l'ambiance..."
              />
            </div>

            <div>
              <label className={labelClass + " mb-3"}>Images de présentation</label>
              <p className="text-xs text-brun-light/60 mb-3">
                La première image de la liste sera utilisée comme image de couverture
                de l&apos;événement. Glissez-déposez les vignettes pour réorganiser
                l&apos;ordre. Les modifications de légende et copyright sont
                enregistrées lors du clic sur &laquo;&nbsp;Enregistrer&nbsp;&raquo;.
              </p>
              <ImageManager
                ref={coverMgrRef}
                eventId={event!.id}
                imageType="cover"
                initialImages={initialCoverImages}
                label="Ajouter une ou plusieurs images de présentation"
              />
            </div>
          </div>

          <div
            className={`bg-white rounded-2xl p-6 shadow-sm space-y-6 ${
              tab === "compte-rendu" ? "" : "hidden"
            }`}
          >
            <div>
              <label className={labelClass}>Texte du compte-rendu</label>
              <RichTextEditor
                name="report_text"
                defaultValue={event?.compte_rendu || ""}
                rows={10}
                placeholder="Compte-rendu de l'événement après sa tenue"
              />
            </div>

            <div>
              <label className={labelClass + " mb-3"}>Photos du compte-rendu</label>
              <p className="text-xs text-brun-light/60 mb-3">
                Les photos sont liées immédiatement à l&apos;événement dès
                l&apos;upload. Les modifications de légende et copyright sont
                enregistrées lors du clic sur &laquo;&nbsp;Enregistrer&nbsp;&raquo;.
              </p>
              <ImageManager
                ref={reportMgrRef}
                eventId={event!.id}
                imageType="report"
                initialImages={initialReportImages}
                label="Ajouter une ou plusieurs photos du compte-rendu"
              />
            </div>
          </div>
        </>
      )}

      {/* === ONGLET TÉMOIGNAGES (édition uniquement) === */}
      {tab === "temoignages" && isEdit && (
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className={labelClass + " mb-0"}>Témoignages</label>
                <p className="text-xs text-brun-light/60 mt-1">
                  Citations à afficher sur la page publique de l&apos;événement
                </p>
              </div>
              <button
                type="button"
                onClick={addTestimonial}
                className="text-xs text-orange hover:text-orange-light font-semibold"
              >
                + Ajouter un témoignage
              </button>
            </div>
            {testimonials.length === 0 ? (
              <p className="text-sm text-brun-light/60 italic py-6 text-center bg-creme/30 rounded-lg">
                Aucun témoignage pour le moment
              </p>
            ) : (
              <div className="space-y-3">
                {testimonials.map((t, idx) => (
                  <div key={idx} className="bg-creme/50 rounded-lg p-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={t.auteur}
                        onChange={(e) => updateTestimonial(idx, { auteur: e.target.value })}
                        className={inputClass}
                        placeholder="Nom de l'auteur"
                      />
                      <input
                        type="text"
                        value={t.role || ""}
                        onChange={(e) => updateTestimonial(idx, { role: e.target.value })}
                        className={inputClass}
                        placeholder="Rôle (optionnel)"
                      />
                    </div>
                    <textarea
                      value={t.texte}
                      onChange={(e) => updateTestimonial(idx, { texte: e.target.value })}
                      rows={3}
                      className={inputClass}
                      placeholder="Citation..."
                    />
                    <button
                      type="button"
                      onClick={() => removeTestimonial(idx)}
                      className="text-xs text-rose hover:text-rose/70"
                    >
                      Supprimer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab courant pour le server action (mode "rester sur la page") */}
      <input type="hidden" name="current_tab" value={tab} />

      {/* Boutons */}
      <div className="flex items-center justify-between pt-4">
        <Link
          href="/admin/evenements"
          className="text-sm text-brun-light hover:text-brun"
        >
          Annuler
        </Link>
        <div className="flex items-center gap-3">
          {isEdit && (
            <button
              type="submit"
              name="intent"
              value="save_and_stay"
              disabled={isPending}
              className="px-6 py-2.5 bg-white border-2 border-orange text-orange font-semibold rounded-lg hover:bg-orange/5 transition-colors text-sm disabled:opacity-50"
            >
              {isPending ? "Enregistrement..." : "Enregistrer"}
            </button>
          )}
          <button
            type="submit"
            name="intent"
            value="save_and_quit"
            disabled={isPending}
            className="px-6 py-2.5 bg-orange text-white font-semibold rounded-lg hover:bg-orange-light transition-colors text-sm disabled:opacity-50"
          >
            {isPending
              ? "Enregistrement..."
              : isEdit
              ? "Enregistrer et quitter"
              : "Créer l'événement (brouillon)"}
          </button>
        </div>
      </div>
    </form>
  );
}
