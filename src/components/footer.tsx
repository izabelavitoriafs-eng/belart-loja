import Image from "next/image";
import Link from "next/link";
import { site, whatsappLink } from "@/config/site";
import { InstagramIcon, WhatsAppIcon } from "@/components/brand-icons";
import type { StoreSettings } from "@/lib/catalog";

type NavCategory = { slug: string; name: string };

export function Footer({ categories, settings }: { categories: NavCategory[]; settings: StoreSettings }) {
  const year = new Date().getFullYear();

  return (
    <footer className="fundo-ameixa text-lilas-100">
      <div className="container-loja grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-sm">
          <div className="flex items-center gap-3">
            <Image src="/belart-logo.png" alt="" width={64} height={64} sizes="64px" className="size-16" />
            <div>
              <p className="font-display text-2xl font-extrabold text-white">Belart</p>
              <p className="text-sm text-sol-400">{site.tagline}</p>
            </div>
          </div>
          <p className="mt-5 text-[0.95rem] text-lilas-200">
            Atendemos {site.serviceArea}. Entrega por Uber ou retirada combinada. O prazo de produção varia
            conforme o produto.
          </p>
        </div>

        <nav aria-label="Categorias no rodapé">
          <h2 className="font-display text-lg font-bold text-white">Produtos</h2>
          <ul className="mt-4 grid gap-2 text-[0.95rem]">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link href={`/categoria/${category.slug}`} className="hover:text-sol-400">
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="font-display text-lg font-bold text-white">Atendimento</h2>
          <ul className="mt-4 grid gap-3 text-[0.95rem]">
            <li>
              <a
                href={whatsappLink("Olá, Belart! Vim pelo site.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-sol-400"
              >
                <WhatsAppIcon className="size-5" />
                WhatsApp {site.whatsappDisplay}
              </a>
            </li>
            <li>
              <a
                href={site.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-sol-400"
              >
                <InstagramIcon className="size-5" />
                Instagram {site.instagramHandle}
              </a>
            </li>
            {settings.email && (
              <li>
                <a href={`mailto:${settings.email}`} className="hover:text-sol-400">
                  {settings.email}
                </a>
              </li>
            )}
            <li className="text-lilas-200">{settings.horario || "Segunda a sexta"}</li>
            {settings.retirada && <li className="text-lilas-200">Retirada: {settings.retirada}</li>}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-loja flex flex-col gap-2 py-6 text-sm text-lilas-300 sm:flex-row sm:justify-between">
          <p>
            © {year} {site.name}. Todos os direitos reservados.
          </p>
          <p>{site.serviceArea}</p>
        </div>
      </div>
    </footer>
  );
}
