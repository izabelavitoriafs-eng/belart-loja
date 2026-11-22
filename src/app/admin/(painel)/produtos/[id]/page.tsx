import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { ProductForm } from "@/components/admin/product-form";
import { ImageManager } from "@/components/admin/image-manager";
import { DeleteProduct } from "@/components/admin/delete-product";

export const metadata: Metadata = { title: "Editar produto" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditProductPage({ params, searchParams }: Props) {
  await requireAdmin();
  const [{ id }, query] = await Promise.all([params, searchParams]);

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        options: { orderBy: { sortOrder: "asc" }, include: { values: { orderBy: { sortOrder: "asc" } } } },
        customizations: { orderBy: { sortOrder: "asc" } },
      },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!product) notFound();

  const strip = (i: { id: string; url: string; alt: string }) => ({ id: i.id, url: i.url, alt: i.alt });

  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <div>
        <Link href="/admin/produtos" className="inline-flex items-center gap-1 text-sm font-semibold text-ameixa-700 hover:underline">
          <ArrowLeft className="size-4" aria-hidden /> Produtos
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-extrabold text-ameixa-900">{product.name}</h1>
          <Link
            href={`/produto/${product.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-ameixa-700 hover:underline"
          >
            Ver na loja <ExternalLink className="size-4" aria-hidden />
          </Link>
        </div>
        {query.criado === "1" && (
          <p role="status" className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Produto criado. Agora envie as fotos logo abaixo.
          </p>
        )}
      </div>

      <ImageManager
        productId={product.id}
        gallery={product.images.filter((i) => i.kind === "GALLERY").map(strip)}
        spin={product.images.filter((i) => i.kind === "SPIN").map(strip)}
      />

      <ProductForm
        productId={product.id}
        categories={categories}
        initial={{
          name: product.name,
          slug: product.slug,
          categoryId: product.categoryId,
          price: Number(product.price).toFixed(2).replace(".", ","),
          description: product.description,
          available: product.available,
          featured: product.featured,
          bestseller: product.bestseller,
          productionTime: product.productionTime ?? "",
          model3d: product.model3d ?? "",
          options: product.options.map((o) => ({
            name: o.name,
            values: o.values.map((v) => ({ label: v.label, priceDelta: Number(v.priceDelta), available: v.available })),
          })),
          customizations: product.customizations.map((c) => ({
            label: c.label,
            type: c.type,
            required: c.required,
            maxLength: c.maxLength,
            choices: c.choices,
            priceDelta: Number(c.priceDelta),
          })),
        }}
      />

      <div className="flex justify-end">
        <DeleteProduct productId={product.id} name={product.name} />
      </div>
    </div>
  );
}
