import { Coffee, CupSoda, GlassWater, Grid2x2, Shirt, Sparkles, Wine, type LucideIcon } from "lucide-react";

const icons: Record<string, LucideIcon> = {
  canecas: Coffee,
  garrafas: GlassWater,
  azulejos: Grid2x2,
  xicaras: CupSoda,
  tacas: Wine,
  blusas: Shirt,
  outros: Sparkles,
};

/** Ícone de cada categoria (categorias novas usam um ícone genérico). */
export function CategoryIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = icons[slug] ?? Sparkles;
  return <Icon aria-hidden className={className} strokeWidth={1.75} />;
}
