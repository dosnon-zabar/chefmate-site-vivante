"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import type { SiteConfig } from "@/lib/types";

export default function Header({ config }: { config: SiteConfig | null }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = useMemo(() => {
    const links = [
      { href: "/", label: "Accueil" },
      { href: "/recettes", label: "Recettes" },
    ];
    if (config?.events_page_enabled !== false) {
      links.push({ href: "/evenements", label: "Événements" });
    }
    if (config?.about_page_enabled !== false) {
      links.push({ href: "/a-propos", label: "À propos" });
    }
    return links;
  }, [config]);

  const title = config?.title ?? "Vivante";
  const subtitle = config?.subtitle ?? "Manger les lieux";

  return (
    <header className="bg-creme/90 backdrop-blur-sm border-b border-brun/5 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3">
            <div className="leading-tight">
              <span className="font-serif text-2xl text-brun font-bold tracking-wide">
                {title}
              </span>
              <span className="block text-[9px] uppercase tracking-[0.25em] text-brun-light/70">
                {subtitle}
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-orange ${
                  pathname === link.href
                    ? "text-orange"
                    : "text-brun-light"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-brun"
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {menuOpen ? (
                <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <nav className="md:hidden pb-4 border-t border-brun/5 pt-4 flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`text-sm font-medium px-2 py-1 ${
                  pathname === link.href ? "text-orange" : "text-brun-light"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
