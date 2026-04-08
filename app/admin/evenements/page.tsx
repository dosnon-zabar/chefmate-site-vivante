export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { fetchEvenements } from "@/lib/api";
import RemoveEventButton from "./RemoveEventButton";
import ToastFlash from "@/components/ToastFlash";

function isTraiteur(roles: string[]): boolean {
  return roles.some((r) =>
    ["traiteur", "admin global", "admin_plateforme"].includes(r.toLowerCase())
  );
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  brouillon: { label: "Brouillon", className: "bg-brun-light/10 text-brun-light" },
  non_publiee: { label: "Non publié", className: "bg-orange/10 text-orange" },
  publiee: { label: "Publié", className: "bg-vert-eau/15 text-vert-eau" },
};

export default async function AdminEvenementsPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!isTraiteur(session.roles)) redirect("/admin");

  const { evenements } = await fetchEvenements(
    { limit: 100, sort_by: "event_date", sort_order: "desc" },
    { token: session.token, cache: "no-store" }
  );

  return (
    <div>
      {/* Toast après save_and_quit */}
      <ToastFlash param="saved" message="L'événement a bien été modifié !" type="success" />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-brun">Événements</h1>
          <p className="text-brun-light mt-1">
            {evenements.length} événement{evenements.length > 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/admin/evenements/nouveau"
          className="px-4 py-2 bg-orange text-white font-medium rounded-lg hover:bg-orange-light transition-colors text-sm"
        >
          + Nouvel événement
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-creme-dark/50">
              <th className="text-left px-5 py-3 text-brun-light font-medium">Titre</th>
              <th className="text-left px-5 py-3 text-brun-light font-medium">Date</th>
              <th className="text-left px-5 py-3 text-brun-light font-medium">Lieu</th>
              <th className="text-left px-5 py-3 text-brun-light font-medium">Statut</th>
              <th className="text-left px-5 py-3 text-brun-light font-medium">Période</th>
              <th className="text-right px-5 py-3 text-brun-light font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {evenements.map((e) => {
              const firstDate = e.dates[0];
              const status = STATUS_LABELS[e.statut] || STATUS_LABELS.brouillon;
              return (
                <tr key={e.id} className="border-b border-creme-dark/30 last:border-0 hover:bg-creme/50">
                  <td className="px-5 py-3 text-brun font-medium">
                    <Link href={`/admin/evenements/${e.id}`} className="hover:text-orange">
                      {e.titre}
                    </Link>
                    {e.dates.length > 1 && (
                      <span className="ml-2 text-xs text-brun-light">
                        ({e.dates.length} dates)
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-brun-light">
                    {firstDate ? formatDate(firstDate.start_datetime) : formatDate(e.date)}
                  </td>
                  <td className="px-5 py-3 text-brun-light">
                    {firstDate?.location || "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${status.className}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs ${e.est_passe ? "text-brun-light/60" : "text-vert-eau"}`}>
                      {e.est_passe ? "Passé" : "À venir"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right space-x-2">
                    <Link
                      href={`/admin/evenements/${e.id}`}
                      className="text-xs text-orange hover:text-orange-light"
                    >
                      Modifier
                    </Link>
                    <RemoveEventButton eventId={e.id} title={e.titre} />
                  </td>
                </tr>
              );
            })}
            {evenements.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-brun-light">
                  Aucun événement
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
