import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import "./globals.css";
import { site } from "@/config/site";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { getActiveCategories } from "@/lib/catalog";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} | ${site.tagline} em Belo Horizonte`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: site.name,
    images: [{ url: "/belart-logo.png", width: 1024, height: 1024, alt: "Logo da Belart" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#5a0f66",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const categories = await getActiveCategories();
  const nav = categories.map(({ slug, name }) => ({ slug, name }));

  return (
    <html lang="pt-BR" className={`${bricolage.variable} ${figtree.variable}`}>
      <body className="flex min-h-dvh flex-col antialiased">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-sol-500 focus:px-4 focus:py-2 focus:font-semibold"
        >
          Pular para o conteúdo
        </a>
        <Header categories={nav} />
        <main id="conteudo" className="flex-1">
          {children}
        </main>
        <Footer categories={nav} />
        <WhatsAppButton />
      </body>
    </html>
  );
}
