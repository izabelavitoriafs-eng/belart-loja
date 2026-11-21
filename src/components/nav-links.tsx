"use client";

// Links das categorias com destaque na categoria aberta no momento.
// (Precisa rodar no navegador para saber em qual página o cliente está.)
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavCategory = { slug: string; name: string };

export function NavLinks({
  categories,
  className,
  linkClassName,
  activeClassName,
}: {
  categories: NavCategory[];
  className: string;
  linkClassName: string;
  activeClassName: string;
}) {
  const pathname = usePathname();

  return (
    <ul className={className}>
      {categories.map((category) => {
        const href = `/categoria/${category.slug}`;
        const active = pathname === href;
        return (
          <li key={category.slug}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={active ? activeClassName : linkClassName}
              // Fecha o menu do celular depois de escolher uma categoria
              onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")}
            >
              {category.name}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
