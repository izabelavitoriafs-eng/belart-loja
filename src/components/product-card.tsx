import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import type { ProductCardData } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";

export function ProductCard({ product, priority = false }: { product: ProductCardData; priority?: boolean }) {
  const { image } = product;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-[0_12px_32px_-18px_rgb(62_10_71/0.35)] ring-1 ring-lilas-200 transition-shadow hover:shadow-[0_18px_40px_-16px_rgb(62_10_71/0.45)]">
      {/* Quadrado fixo + object-cover: a foto nunca é esticada (só recortada nas bordas) */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-lilas-100 to-lilas-50">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt || product.name}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 300px, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-lilas-300">
            <ImageOff aria-hidden className="size-10" />
            <span className="sr-only">Produto sem foto</span>
          </div>
        )}
        {!product.available ? (
          <span className="absolute top-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-tinta-suave">
            Indisponível
          </span>
        ) : product.bestseller ? (
          <span className="absolute top-3 left-3 rounded-full bg-sol-500 px-3 py-1 text-xs font-bold text-ameixa-950">
            Mais vendido
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-sm text-tinta-suave">{product.category.name}</p>
        <h3 className="mt-0.5 font-sans text-base leading-snug font-semibold tracking-normal">
          <Link href={`/produto/${product.slug}`} className="after:absolute after:inset-0">
            {product.name}
          </Link>
        </h3>
        <p className="mt-auto pt-2 font-display text-xl font-bold text-ameixa-800">{formatPrice(product.price)}</p>
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: ProductCardData[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
      {products.map((product, index) => (
        <li key={product.id}>
          {/* As 4 primeiras fotos carregam com prioridade; as demais só quando aparecem na tela */}
          <ProductCard product={product} priority={index < 4} />
        </li>
      ))}
    </ul>
  );
}
