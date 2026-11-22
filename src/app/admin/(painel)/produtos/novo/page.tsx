import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "Novo produto" };

export default async function NewProductPage() {
  await requireAdmin();
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/admin/produtos" className="inline-flex items-center gap-1 text-sm font-semibold text-ameixa-700 hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> Produtos
      </Link>
      <h1 className="mt-2 mb-6 text-3xl font-extrabold text-ameixa-900">Novo produto</h1>
      <ProductForm
        productId={null}
        categories={categories}
        initial={{
          name: "",
          slug: "",
          categoryId: categories[0]?.id ?? "",
          price: "",
          description: "",
          available: true,
          featured: false,
          bestseller: false,
          productionTime: "",
          model3d: "",
          options: [],
          customizations: [
            { label: "Nos conte o que você está pensando", type: "LONG_TEXT", required: true, maxLength: 500, choices: [], priceDelta: 0 },
            { label: "Link de inspirações", type: "IMAGE_LINK", required: false, maxLength: null, choices: [], priceDelta: 0 },
          ],
        }}
      />
    </div>
  );
}
