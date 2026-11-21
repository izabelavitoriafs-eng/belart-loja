import Image from "next/image";
import Link from "next/link";
import { Menu, Search } from "lucide-react";
import { SearchForm } from "@/components/search-form";
import { NavLinks } from "@/components/nav-links";

type NavCategory = { slug: string; name: string };

// Larguras de tela:
//   celular (< 768px)     → logo + menu ☰ (com busca dentro)
//   tablet (768–1023px)   → logo + busca + menu ☰
//   notebook (1024–1279px)→ logo + categorias + ícone de busca
//   desktop (≥ 1280px)    → logo + categorias + campo de busca
export function Header({ categories }: { categories: NavCategory[] }) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 shadow-[0_6px_24px_-14px_rgb(62_10_71/0.35)] backdrop-blur">
      <div className="container-loja flex h-18 items-center gap-4 lg:gap-6 xl:gap-8">
        <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="Belart — página inicial">
          <Image src="/belart-logo.png" alt="" width={56} height={56} sizes="56px" priority className="size-12 md:size-14" />
          <span className="hidden font-display text-xl font-extrabold text-ameixa-800 sm:block">Belart</span>
        </Link>

        <nav aria-label="Categorias" className="hidden flex-1 lg:block">
          <NavLinks
            categories={categories}
            className="flex items-center gap-1 text-[0.95rem] font-medium"
            linkClassName="rounded-full px-3 py-2 text-tinta transition-colors hover:bg-lilas-50 hover:text-ameixa-700"
            activeClassName="rounded-full bg-lilas-100 px-3 py-2 font-semibold text-ameixa-800"
          />
        </nav>

        <div className="ml-auto hidden w-full max-w-xs md:block lg:hidden xl:block">
          <SearchForm id="busca-topo" />
        </div>

        <Link
          href="/busca"
          aria-label="Buscar produtos"
          className="ml-auto hidden size-11 shrink-0 items-center justify-center rounded-full bg-ameixa-800 text-white hover:bg-ameixa-700 lg:flex xl:hidden"
        >
          <Search aria-hidden className="size-5" />
        </Link>

        {/* Menu mobile: funciona sem JavaScript (details/summary) */}
        <details className="group relative ml-auto md:ml-0 lg:hidden">
          <summary
            className="flex size-11 cursor-pointer list-none items-center justify-center rounded-full text-ameixa-800 hover:bg-lilas-100 [&::-webkit-details-marker]:hidden"
            aria-label="Abrir menu"
          >
            <Menu aria-hidden className="size-6" />
          </summary>
          <div className="absolute right-0 mt-2 w-72 rounded-3xl border border-lilas-200 bg-white p-4 shadow-xl shadow-ameixa-900/10">
            <div className="md:hidden">
              <SearchForm id="busca-menu" />
            </div>
            <NavLinks
              categories={categories}
              className="mt-3 grid gap-1 md:mt-0"
              linkClassName="block rounded-2xl px-3 py-2.5 font-medium hover:bg-lilas-50"
              activeClassName="block rounded-2xl bg-lilas-100 px-3 py-2.5 font-semibold text-ameixa-800"
            />
          </div>
        </details>
      </div>
    </header>
  );
}
