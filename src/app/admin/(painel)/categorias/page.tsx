import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { CategoryManager } from "@/components/admin/category-manager";

export const metadata: Metadata = { title: "Categorias" };

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-extrabold text-ameixa-900">Categorias</h1>
      <p className="mt-2 mb-6 text-sm text-tinta-suave">
        A ordem aqui é a ordem do menu da loja. Categorias não visíveis somem da loja, mas os produtos continuam salvos.
      </p>
      <CategoryManager
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description ?? "",
          active: c.active,
          slug: c.slug,
          products: c._count.products,
        }))}
      />
    </div>
  );
}
