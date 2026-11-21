// Leitura do catálogo com cache.
//
// Por que cache? Cada consulta ao Supabase leva centenas de milissegundos.
// Sem cache, cada troca de página fazia de 4 a 6 consultas (≈2 s de espera).
// Agora o catálogo é lido do banco uma vez e guardado; as páginas seguintes
// usam a cópia em memória/disco do Next.js.
//
// Quando o catálogo muda (importador, painel admin), o cache é renovado
// chamando revalidateTag(CATALOG_TAG) — veja src/app/api/revalidar/route.ts.
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const CATALOG_TAG = "catalogo";

// Em desenvolvimento o cache expira rápido para facilitar os testes;
// em produção, a renovação acontece por revalidateTag (e a cada 10 min por segurança).
const REVALIDATE_SECONDS = process.env.NODE_ENV === "development" ? 30 : 600;

const cached = <T,>(fn: () => Promise<T>, key: string) =>
  unstable_cache(fn, [key], { tags: [CATALOG_TAG], revalidate: REVALIDATE_SECONDS });

// ---------- Tipos simples (serializáveis) usados pelas páginas ----------

export type CategoryData = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
};

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  featured: boolean;
  bestseller: boolean;
  createdAt: string;
  category: { slug: string; name: string };
  image: { url: string; alt: string } | null;
};

export type ProductDetail = ProductCardData & {
  productionTime: string | null;
  images: { id: string; url: string; alt: string }[];
};

// ---------- Consultas (cada uma vai ao banco só quando o cache expira) ----------

export const getActiveCategories = cached(async (): Promise<CategoryData[]> => {
  return prisma.category.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, slug: true, name: true, description: true },
  });
}, "categorias-ativas");

/** Todos os produtos visíveis, já no formato de card. Base para vitrines, busca e ordenação. */
export const getAllProducts = cached(async (): Promise<ProductCardData[]> => {
  const rows = await prisma.product.findMany({
    where: { category: { active: true } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      price: true,
      available: true,
      featured: true,
      bestseller: true,
      createdAt: true,
      category: { select: { slug: true, name: true } },
      images: { select: { url: true, alt: true }, orderBy: { sortOrder: "asc" }, take: 1 },
    },
  });
  return rows.map(({ images, price, createdAt, ...rest }) => ({
    ...rest,
    price: Number(price),
    createdAt: createdAt.toISOString(),
    image: images[0] ?? null,
  }));
}, "produtos-todos");

export const getProductBySlug = (slug: string) =>
  cached(async (): Promise<ProductDetail | null> => {
    const p = await prisma.product.findFirst({
      where: { slug, category: { active: true } },
      include: {
        category: { select: { slug: true, name: true } },
        images: { orderBy: { sortOrder: "asc" }, select: { id: true, url: true, alt: true } },
      },
    });
    if (!p) return null;
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      price: Number(p.price),
      available: p.available,
      featured: p.featured,
      bestseller: p.bestseller,
      createdAt: p.createdAt.toISOString(),
      category: p.category,
      image: p.images[0] ? { url: p.images[0].url, alt: p.images[0].alt } : null,
      productionTime: p.productionTime,
      images: p.images,
    };
  }, `produto:${slug}`)();

export const getTestimonials = cached(async () => {
  return prisma.testimonial.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: { id: true, name: true, text: true },
  });
}, "depoimentos");

// ---------- Ajudantes em memória (sem ir ao banco) ----------

export async function getCategoryBySlug(slug: string) {
  const categories = await getActiveCategories();
  return categories.find((c) => c.slug === slug) ?? null;
}

export async function getHomeData() {
  const [categories, products, testimonials] = await Promise.all([
    getActiveCategories(),
    getAllProducts(),
    getTestimonials(),
  ]);
  return {
    categories,
    featured: products.filter((p) => p.featured).slice(0, 8),
    bestsellers: products.filter((p) => p.bestseller).slice(0, 8),
    newest: products.slice(0, 8), // já vem ordenado do mais novo para o mais antigo
    testimonials,
    productCountBySlug: Object.fromEntries(
      categories.map((c) => [c.slug, products.filter((p) => p.category.slug === c.slug).length]),
    ) as Record<string, number>,
  };
}

/** Remove acentos e deixa minúsculo: "Xícara" → "xicara". */
export function normalize(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}
