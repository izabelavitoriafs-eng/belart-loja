// Versão inicial da página de produto. Na etapa 2 ela ganha a galeria
// completa, a escolha de variações/personalização e produtos relacionados;
// na etapa 4, o botão de adicionar ao carrinho.
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, ImageOff } from "lucide-react";
import { getProductBySlug } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { site, whatsappLink } from "@/config/site";
import { WhatsAppIcon } from "@/components/brand-icons";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.description.slice(0, 160),
    alternates: { canonical: `/produto/${product.slug}` },
    openGraph: product.images[0] ? { images: [{ url: product.images[0].url }] } : undefined,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [cover, ...rest] = product.images;
  const productUrl = `${site.url}/produto/${product.slug}`;

  return (
    <div className="bg-gradient-to-b from-lilas-50 to-white">
    <div className="container-loja pt-8 md:pt-12">
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

      <div className="mt-6 grid gap-10 md:grid-cols-2 md:gap-14">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-[var(--radius-bloco)] bg-lilas-50">
            {cover ? (
              <Image
                src={cover.url}
                alt={cover.alt || product.name}
                fill
                priority
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-lilas-300">
                <ImageOff aria-hidden className="size-14" />
                <span className="sr-only">Produto sem foto</span>
              </div>
            )}
          </div>
          {rest.length > 0 && (
            <ul className="mt-3 grid grid-cols-4 gap-3">
              {rest.map((image) => (
                <li key={image.id} className="relative aspect-square overflow-hidden rounded-2xl bg-lilas-50">
                  <Image src={image.url} alt={image.alt || product.name} fill sizes="12vw" className="object-cover" />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h1 className="text-4xl font-extrabold text-ameixa-900 md:text-5xl">{product.name}</h1>
          <p className="mt-4 font-display text-3xl font-bold text-ameixa-800">{formatPrice(product.price)}</p>

          <dl className="mt-6 grid gap-2 text-[0.95rem]">
            <div className="flex gap-2">
              <dt className="font-semibold">Disponibilidade:</dt>
              <dd className={product.available ? "text-emerald-700" : "text-tinta-suave"}>
                {product.available ? "Disponível para encomenda" : "Indisponível no momento"}
              </dd>
            </div>
            {product.productionTime && (
              <div className="flex items-center gap-2">
                <Clock aria-hidden className="size-4 text-ameixa-700" />
                <dt className="font-semibold">Prazo de produção:</dt>
                <dd>{product.productionTime}</dd>
              </div>
            )}
          </dl>

          <div className="mt-6 whitespace-pre-line text-tinta-suave">{product.description}</div>

          <a
            href={whatsappLink(`Olá, Belart! Quero mais informações sobre: ${product.name} (${productUrl})`)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-sol mt-8"
          >
            <WhatsAppIcon className="size-5" />
            Pedir informações pelo WhatsApp
          </a>
        </div>
      </div>
    </div>
    </div>
  );
}
