export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { fetchTeamMembers } from "@/lib/api";
import RemoveMemberButton from "@/components/RemoveMemberButton";

export default async function AdminEquipePage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  // Seuls les Team managers et Admins ont accès
  const isTeamManager = session.roles.some(
    (r) => ["team manager", "admin global", "admin_plateforme"].includes(r.toLowerCase())
  );
  if (!isTeamManager) redirect("/admin");

  const members = await fetchTeamMembers(session.token);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-brun">Équipe</h1>
          <p className="text-brun-light mt-1">
            {members.length} membre{members.length > 1 ? "s" : ""} dans l&apos;équipe
          </p>
        </div>
        <Link
          href="/admin/equipe/nouveau"
          className="px-4 py-2 bg-orange text-white font-medium rounded-lg hover:bg-orange-light transition-colors text-sm"
        >
          + Nouveau membre
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-creme-dark/50">
              <th className="text-left px-5 py-3 text-brun-light font-medium">Nom</th>
              <th className="text-left px-5 py-3 text-brun-light font-medium">Email</th>
              <th className="text-left px-5 py-3 text-brun-light font-medium">Téléphone</th>
              <th className="text-left px-5 py-3 text-brun-light font-medium">Rôle</th>
              <th className="text-left px-5 py-3 text-brun-light font-medium">Statut</th>
              <th className="text-right px-5 py-3 text-brun-light font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b border-creme-dark/30 last:border-0 hover:bg-creme/50">
                <td className="px-5 py-3 text-brun font-medium">
                  {m.first_name} {m.last_name}
                </td>
                <td className="px-5 py-3 text-brun-light">{m.email}</td>
                <td className="px-5 py-3 text-brun-light">{m.phone || "—"}</td>
                <td className="px-5 py-3">
                  {m.roles
                    .filter((r) => ["contributeur", "traiteur", "team manager"].includes(r.name.toLowerCase()))
                    .map((r) => (
                    <span
                      key={r.id}
                      className="text-xs px-2 py-0.5 rounded-full bg-vert-eau/15 text-vert-eau font-medium mr-1"
                    >
                      {r.name.charAt(0).toUpperCase() + r.name.slice(1)}
                    </span>
                  ))}
                </td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    m.active
                      ? "bg-vert-eau/15 text-vert-eau"
                      : "bg-rose/10 text-rose"
                  }`}>
                    {m.active ? "Actif" : "Inactif"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right space-x-2">
                  <Link
                    href={`/admin/equipe/${m.id}`}
                    className="text-xs text-orange hover:text-orange-light"
                  >
                    Modifier
                  </Link>
                  <RemoveMemberButton userId={m.id} name={`${m.first_name} ${m.last_name}`} />
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-brun-light">
                  Aucun membre dans l&apos;équipe
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
