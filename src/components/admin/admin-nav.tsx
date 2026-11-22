"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderTree, Package, Settings, Store } from "lucide-react";

const links = [
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  { href: "/admin/categorias", label: "Categorias", icon: FolderTree },
  { href: "/admin/configuracoes", label: "Dados da loja", icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Painel" className="flex gap-1 overflow-x-auto md:flex-col">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition ${
              active ? "bg-white text-ameixa-900" : "text-lilas-100 hover:bg-white/10"
            }`}
          >
            <Icon aria-hidden className="size-5" />
            {label}
          </Link>
        );
      })}
      <Link
        href="/"
        target="_blank"
        className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap text-lilas-100 hover:bg-white/10"
      >
        <Store aria-hidden className="size-5" />
        Ver a loja
      </Link>
    </nav>
  );
}
