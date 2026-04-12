import type { Metadata } from "next";
import { fetchSiteConfig } from "@/lib/api";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const config = await fetchSiteConfig();
  const title = config?.home_seo_title ?? `${config?.title ?? "Vivante"} — ${config?.subtitle ?? "Manger les lieux"}`;
  const description = config?.home_seo_desc ?? "Collectif culinaire du Luberon. Cuisine vivante, festive et populaire : banquets de village, ateliers cuisine, produits locaux.";

  return {
    title: { default: title, template: `%s | ${config?.title ?? "Vivante"}` },
    description,
    openGraph: config?.home_seo_image ? { images: [config.home_seo_image] } : undefined,
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
