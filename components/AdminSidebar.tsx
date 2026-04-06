"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/admin/login/actions";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { href: "/admin/recettes", label: "Recettes", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
  { href: "/admin/evenements", label: "Événements", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { href: "/admin/equipe", label: "Équipe", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
];

type Props = {
  user: { first_name: string; last_name: string; email: string; roles: string[] };
};

export default function AdminSidebar({ user }: Props) {
  const isTeamManager = user.roles.some(
    (r) => ["team manager", "admin global", "admin_plateforme"].includes(r.toLowerCase())
  );

  const visibleLinks = adminLinks.filter(
    (link) => link.href !== "/admin/equipe" || isTeamManager
  );
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-brun min-h-screen p-6 flex-shrink-0 flex flex-col">
      <Link href="/" className="block mb-8">
        <span className="font-serif text-xl text-white">Vivante</span>
        <span className="block text-[10px] uppercase tracking-[0.2em] text-white/40">
          Administration
        </span>
      </Link>

      <nav className="space-y-1 flex-1">
        {visibleLinks.map((link) => {
          const isActive =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-orange text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
              </svg>
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="pt-6 border-t border-white/10 space-y-3">
        <div className="px-1">
          <p className="text-sm text-white font-medium truncate">
            {user.first_name} {user.last_name}
          </p>
          <p className="text-xs text-white/40 truncate">{user.email}</p>
        </div>

        <form action={logoutAction}>
          <button
            type="submit"
            className="flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors w-full px-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            Déconnexion
          </button>
        </form>

        <Link
          href="/"
          className="flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors px-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour au site
        </Link>
      </div>
    </aside>
  );
}
