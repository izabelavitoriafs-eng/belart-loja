import type { MetadataRoute } from "next";
import { getActiveCategories, getAllProducts } from "@/lib/catalog";
import { site } from "@/config/site";

export const revalidate = 600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([getActiveCategories(), getAllProducts()]);
  return [
    { url: site.url, changeFrequency: "daily", priority: 1 },
    ...categories.map((c) => ({ url: `${site.url}/categoria/${c.slug}`, priority: 0.8 })),
    ...products.map((p) => ({ url: `${site.url}/produto/${p.slug}`, priority: 0.6 })),
  ];
}
