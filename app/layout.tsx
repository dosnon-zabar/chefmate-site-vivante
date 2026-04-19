import type { Metadata } from "next";
import { fetchSiteConfig } from "@/lib/api";
import { ADMIN_ROOT_URL } from "@/lib/admin-url";
import "./globals.css";

/**
 * Resolves a possibly-relative URL against the admin origin so
 * `<link rel="icon" href="...">` works when site-vivante and admin
 * are on different domains. Favicon URLs come from the DB as
 * `/api/images/...` (admin-relative) or absolute already.
 */
function absoluteAdminUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${ADMIN_ROOT_URL}${url}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const config = await fetchSiteConfig();
  const title = config?.home_seo_title ?? `${config?.title ?? "Vivante"} — ${config?.subtitle ?? "Manger les lieux"}`;
  const description = config?.home_seo_desc ?? "Collectif culinaire du Luberon. Cuisine vivante, festive et populaire : banquets de village, ateliers cuisine, produits locaux.";

  // Build the icon set from the site's favicon_urls, if configured.
  // Modern browsers prefer the sized PNG entries; the .ico is kept as a
  // fallback for older clients. Entries with undefined url are filtered.
  const fav = config?.favicon_urls ?? null;
  const iconEntries = fav
    ? [
        { rel: "icon", size: "16x16", url: absoluteAdminUrl(fav["16"]) },
        { rel: "icon", size: "32x32", url: absoluteAdminUrl(fav["32"]) },
        { rel: "icon", size: "48x48", url: absoluteAdminUrl(fav["48"]) },
        { rel: "icon", size: "192x192", url: absoluteAdminUrl(fav["192"]) },
        { rel: "icon", size: "512x512", url: absoluteAdminUrl(fav["512"]) },
      ].filter((e): e is { rel: string; size: string; url: string } => !!e.url)
    : [];

  const icons: Metadata["icons"] = fav
    ? {
        icon: [
          ...iconEntries.map((e) => ({
            url: e.url,
            sizes: e.size,
            type: "image/png",
          })),
          ...(fav.ico && absoluteAdminUrl(fav.ico)
            ? [{ url: absoluteAdminUrl(fav.ico)!, sizes: "any" }]
            : []),
        ],
        apple: fav["180"] && absoluteAdminUrl(fav["180"])
          ? { url: absoluteAdminUrl(fav["180"])!, sizes: "180x180" }
          : undefined,
        shortcut: absoluteAdminUrl(fav.ico),
      }
    : undefined;

  return {
    title: { default: title, template: `%s | ${config?.title ?? "Vivante"}` },
    description,
    openGraph: config?.home_seo_image ? { images: [config.home_seo_image] } : undefined,
    icons,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
