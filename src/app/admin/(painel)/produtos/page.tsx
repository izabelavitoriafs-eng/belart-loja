import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ImageOff, Plus, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Produtos" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminProductsPage({ searchParams }: Props) {
  await requireAdmin();
  const query = await searchParams;
  const term = typeof query.q === "string" ? query.q.trim() : "";
  const categoryId = typeof query.categoria === "string" ? query.categoria : "";

  const [categories, products] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    prisma.product.findMany({
      where: {
        ...(categoryId ? { categoryId } : {}),
        ...(term ? { name: { contains: term, mode: "insensitive" as const } } : {}),
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        price: true,
        available: true,
        featured: true,
        bestseller: true,
        model3d: true,
        category: { select: { name: true } },
        images: { where: { kind: "GALLERY" }, orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
        _count: { select: { images: { where: { kind: "SPIN" } } } },
      },
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold text-ameixa-900">Produtos</h1>
        <Link href="/admin/produtos/novo" className="btn-sol">
          <Plus className="size-5" aria-hidden />
          Novo produto
        </Link>
      </div>

      <form method="get" className="mt-6 flex flex-wrap gap-3" role="search">
        <label className="relative min-w-60 flex-1">
          <span className="sr-only">Buscar pelo nome</span>
          <Search aria-hidden className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-tinta-suave" />
          <input
            name="q"
            defaultValue={term}
            placeholder="Buscar pelo nome"
            className="h-11 w-full rounded-full border border-lilas-300 bg-white pr-4 pl-10 focus:border-ameixa-700 focus:outline-none"
          />
        </label>
        <label>
          <span className="sr-only">Categoria</span>
          <select
            name="categoria"
            defaultValue={categoryId}
            className="h-11 rounded-full border border-lilas-300 bg-white px-4 focus:border-ameixa-700 focus:outline-none"
          >
            <option value="">Todas as categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn-roxo h-11 py-0">
          Filtrar
        </button>
      </form>

      {products.length === 0 ? (
        <div className="mt-10 rounded-3xl bg-white p-10 text-center ring-1 ring-lilas-200">
          <p className="text-lg font-semibold text-ameixa-900">
            {term || categoryId ? "Nenhum produto encontrado com esse filtro." : "Nenhum produto cadastrado ainda."}
          </p>
          <Link href="/admin/produtos/novo" className="btn-sol mt-5">
            Cadastrar o primeiro produto
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid gap-3">
          {products.map((p) => (
            <li key={p.id}>
              <Link
                href={`/admin/produtos/${p.id}`}
                className="flex items-center gap-4 rounded-3xl bg-white p-3 ring-1 ring-lilas-200 transition hover:ring-ameixa-600/50"
              >
                <span className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-lilas-50">
                  {p.images[0] ? (
                    <Image src={p.images[0].url} alt="" fill sizes="64px" className="object-cover" />
                  ) : (
                    <ImageOff aria-hidden className="absolute inset-0 m-auto size-6 text-lilas-300" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-tinta">{p.name}</span>
                  <span className="text-sm text-tinta-suave">{p.category.name}</span>
                </span>
                <span className="hidden flex-wrap justify-end gap-1.5 sm:flex">
                  {!p.available && <Badge tone="cinza">Indisponível</Badge>}
                  {p.featured && <Badge tone="roxo">Destaque</Badge>}
                  {p.bestseller && <Badge tone="sol">Mais vendido</Badge>}
                  {p.model3d && <Badge tone="roxo">3D</Badge>}
                  {p._count.images > 0 && <Badge tone="roxo">360°</Badge>}
                </span>
                <span className="w-24 text-right font-display font-bold text-ameixa-800">{formatPrice(p.price)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Badge({ tone, children }: { tone: "roxo" | "sol" | "cinza"; children: React.ReactNode }) {
  const tones = {
    roxo: "bg-lilas-100 text-ameixa-800",
    sol: "bg-sol-100 text-ameixa-950",
    cinza: "bg-gray-100 text-gray-600",
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}
