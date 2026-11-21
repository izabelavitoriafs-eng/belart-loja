import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { site } from "@/config/site";
import { ProductGallery } from "@/components/product-gallery";
import { ProductPurchase } from "@/components/product-purchase";
import { ProductGrid } from "@/components/product-card";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.description.slice(0, 160),
    alternates: { canonical: `/produto/${product.slug}` },
    openGraph: product.gallery[0] ? { images: [{ url: product.gallery[0].url }] } : undefined,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product);
  const productUrl = `${site.url}/produto/${product.slug}`;

  // Dados estruturados para o Google (preço, disponibilidade, fotos)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.gallery.map((img) => (img.url.startsWith("http") ? img.url : `${site.url}${img.url}`)),
    category: product.category.name,
    brand: { "@type": "Brand", name: site.name },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "BRL",
      price: product.price.toFixed(2),
      availability: product.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="bg-gradient-to-b from-lilas-50 to-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <div className="container-loja pt-6 pb-16 md:pt-10">
        <nav aria-label="Você está em" className="text-sm text-tinta-suave">
          <ol className="flex flex-wrap gap-2">
            <li>
              <Link href="/" className="hover:text-ameixa-700">
                Início
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href={`/categoria/${product.category.slug}`} className="hover:text-ameixa-700">
                {product.category.name}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="font-medium text-tinta">
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="mt-6 grid gap-10 md:grid-cols-2 md:gap-12 lg:gap-16">
          <ProductGallery name={product.name} gallery={product.gallery} spin={product.spin} model3d={product.model3d} />

          <div>
            <p className="text-sm font-semibold text-ameixa-700">{product.category.name}</p>
            <h1 className="mt-1 text-4xl font-extrabold text-ameixa-900 md:text-5xl">{product.name}</h1>
            <p className="mt-4 font-display text-3xl font-bold text-ameixa-800">
              {product.options.some((o) => o.values.some((v) => v.priceDelta > 0)) && (
                <span className="mr-1 text-base font-medium text-tinta-suave">a partir de</span>
              )}
              {formatPrice(product.price)}
            </p>

            <ul className="mt-5 grid gap-2 text-[0.95rem]">
              <li className="flex items-center gap-2">
                {product.available ? (
                  <>
                    <CheckCircle2 aria-hidden className="size-5 text-emerald-600" />
                    <span>Disponível para encomenda</span>
                  </>
                ) : (
                  <>
                    <XCircle aria-hidden className="size-5 text-tinta-suave" />
                    <span className="text-tinta-suave">Indisponível no momento</span>
                  </>
                )}
              </li>
              {product.productionTime && (
                <li className="flex items-center gap-2">
                  <Clock aria-hidden className="size-5 text-ameixa-700" />
                  <span>
                    Prazo de produção: <strong>{product.productionTime}</strong>
                  </span>
                </li>
              )}
            </ul>

            <div className="mt-6 max-w-prose whitespace-pre-line text-tinta-suave">{product.description}</div>

            <div className="mt-8 border-t border-lilas-200 pt-8">
              <ProductPurchase
                name={product.name}
                basePrice={product.price}
                available={product.available}
                productUrl={productUrl}
                options={product.options}
                customizations={product.customizations}
              />
            </div>

            <p className="mt-6 text-sm text-tinta-suave">
              Entrega por Uber em {site.serviceArea} ou retirada combinada.
            </p>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-20" aria-labelledby="relacionados">
            <h2 id="relacionados" className="mb-8 text-3xl font-extrabold text-ameixa-900">
              Você também pode gostar
            </h2>
            <ProductGrid products={related} />
          </section>
        )}
      </div>
    </div>
  );
}
