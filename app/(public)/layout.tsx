import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { fetchSiteConfig } from "@/lib/api";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = await fetchSiteConfig();

  return (
    <>
      <Header config={config} />
      <main className="flex-1">{children}</main>
      <Footer config={config} />
    </>
  );
}
