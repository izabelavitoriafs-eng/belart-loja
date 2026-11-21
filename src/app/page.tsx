import Link from "next/link";
import Image from "next/image";
import { getHomeData, type ProductCardData } from "@/lib/catalog";
import { ProductGrid } from "@/components/product-card";
import { CategoryIcon } from "@/components/category-icon";
import { site, whatsappLink } from "@/config/site";
import { InstagramIcon, WhatsAppIcon } from "@/components/brand-icons";

// A página é gerada e guardada em cache; é renovada quando o catálogo muda
// (revalidateTag) ou, no máximo, a cada 10 minutos.
export const revalidate = 600;

export default async function HomePage() {
  const { categories, featured, bestsellers, newest, testimonials, productCountBySlug } = await getHomeData();
  const hasProducts = newest.length > 0;

  return (
    <>
      {/* ---------- Banner principal: degradê roxo com brilhos de lavanda ---------- */}
      <section className="fundo-ameixa relative overflow-hidden rounded-b-[2.5rem] text-white md:rounded-b-[3.5rem]">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -bottom-40 size-[30rem] rounded-full border-[3px] border-sol-500/50"
        />
        <div className="container-loja relative grid items-center gap-10 pt-12 pb-16 md:grid-cols-[1.25fr_1fr] md:pt-16 md:pb-24">
          <div>
            <h1 className="text-[clamp(2.6rem,6.5vw,5rem)] font-extrabold">
              Presentes com a sua cara, feitos em BH.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-lilas-100 md:text-xl">
              Canecas, garrafas, azulejos, xícaras, taças, blusas e muito mais, personalizados com o nome, a
              foto ou a arte que você escolher.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="#categorias" className="btn-sol">
                Ver produtos
              </Link>
              <a
                href={whatsappLink("Olá, Belart! Quero fazer um pedido personalizado.")}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-contorno"
              >
                <WhatsAppIcon className="size-5" />
                Pedir pelo WhatsApp
              </a>
            </div>
            <p className="mt-8 text-sm text-lilas-200">
              Entrega por Uber em {site.serviceArea} ou retirada combinada.
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-[13rem] md:max-w-[22rem]">
            <div
              aria-hidden
              className="absolute inset-[-12%] rounded-full bg-[radial-gradient(circle,rgb(245_184_0/0.35),transparent_65%)]"
            />
            <Image
              src="/belart-logo.png"
              alt="Logo da Belart: caneca amarela com uma lâmpada e o nome Belart"
              width={704}
              height={704}
              sizes="(min-width: 768px) 352px, 208px"
              priority
              className="relative h-auto w-full drop-shadow-[0_30px_40px_rgb(20_0_30/0.45)]"
            />
          </div>
        </div>
      </section>

      {/* ---------- Categorias ---------- */}
      <section id="categorias" className="scroll-mt-24 py-16 md:py-20">
        <div className="container-loja">
          <h2 className="text-3xl font-extrabold text-ameixa-900 md:text-4xl">O que você quer personalizar?</h2>
          <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-7">
            {categories.map((category) => {
              const count = productCountBySlug[category.slug] ?? 0;
              return (
                <li key={category.id}>
                  <Link
                    href={`/categoria/${category.slug}`}
                    className="group flex h-full flex-col items-center gap-3 rounded-3xl bg-white px-4 py-7 text-center shadow-[0_12px_32px_-20px_rgb(62_10_71/0.4)] ring-1 ring-lilas-200 transition hover:-translate-y-1 hover:ring-ameixa-600/40"
                  >
                    <span className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-ameixa-600 to-ameixa-900 text-sol-400 shadow-lg shadow-ameixa-900/25 transition group-hover:rotate-[-4deg]">
                      <CategoryIcon slug={category.slug} className="size-8" />
                    </span>
                    <span className="font-display text-lg font-bold text-tinta">{category.name}</span>
                    <span className="text-xs text-tinta-suave">
                      {count === 0 ? "Em breve" : `${count} ${count === 1 ? "produto" : "produtos"}`}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ---------- Vitrines (faixa lavanda) ---------- */}
      <section className="fundo-lavanda py-16 md:py-20">
        <div className="container-loja">
          {hasProducts ? (
            <div className="grid gap-16 md:gap-20">
              <ProductSection title="Mais vendidos" products={bestsellers} />
              <ProductSection title="Novidades" products={newest} />
              <ProductSection title="Destaques" products={featured} />
            </div>
          ) : (
            <div className="grid items-center gap-8 rounded-[var(--radius-bloco)] bg-white/80 px-6 py-12 shadow-[0_20px_50px_-30px_rgb(62_10_71/0.5)] ring-1 ring-white backdrop-blur md:grid-cols-[1fr_auto] md:px-12">
              <div>
                <h2 className="text-2xl font-extrabold text-ameixa-900 md:text-3xl">Nosso catálogo está sendo montado</h2>
                <p className="mt-3 max-w-lg text-tinta-suave">
                  Enquanto isso, fale com a gente pelo WhatsApp ou veja os trabalhos no Instagram.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a href={whatsappLink("Olá, Belart! Quero ver os produtos.")} target="_blank" rel="noopener noreferrer" className="btn-sol">
                  <WhatsAppIcon className="size-5" />
                  WhatsApp
                </a>
                <a href={site.instagramUrl} target="_blank" rel="noopener noreferrer" className="btn-roxo">
                  <InstagramIcon className="size-5" />
                  Instagram
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ---------- Como funciona (sequência real, por isso numerada) ---------- */}
      <section className="py-16 md:py-24">
        <div className="container-loja">
          <div className="fundo-ameixa relative overflow-hidden rounded-[var(--radius-bloco)] px-6 py-12 text-white md:px-14 md:py-16">
            <div className="grid gap-10 xl:grid-cols-[1fr_1.7fr] xl:gap-14">
              <div>
                <h2 className="text-3xl font-extrabold md:text-4xl">Como funciona a personalização</h2>
                <p className="mt-4 max-w-md text-lilas-100">
                  Cada peça é produzida sob encomenda. O prazo de produção aparece na página de cada produto.
                </p>
              </div>
              <ol className="grid gap-4 sm:grid-cols-3">
                {[
                  ["Escolha o produto", "Selecione o modelo, a cor e as opções disponíveis."],
                  ["Conte o que quer", "Informe o nome, a frase ou envie a arte para personalizar."],
                  ["Receba em BH", "Entrega por Uber em BH e região ou retirada combinada."],
                ].map(([title, text], index) => (
                  <li key={title} className="rounded-3xl bg-white/10 p-6 ring-1 ring-white/15 backdrop-blur-sm">
                    <span className="flex size-11 items-center justify-center rounded-full bg-sol-500 font-display text-xl font-extrabold text-ameixa-950">
                      {index + 1}
                    </span>
                    <h3 className="mt-4 text-xl font-bold">{title}</h3>
                    <p className="mt-2 text-[0.95rem] text-lilas-100">{text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Sobre a Belart (faixa branca) ---------- */}
      <section className="bg-white py-16 md:py-24">
        <div className="container-loja grid items-center gap-10 md:grid-cols-[auto_1fr] md:gap-16">
          <div className="relative mx-auto size-48 md:size-60">
            <div aria-hidden className="absolute inset-0 rotate-6 rounded-[2.5rem] bg-gradient-to-br from-lavanda to-lilas-200" />
            <div className="absolute inset-0 flex items-center justify-center rounded-[2.5rem] bg-gradient-to-br from-ameixa-700 to-ameixa-900 p-6">
              <Image src="/belart-logo.png" alt="" width={192} height={192} sizes="192px" className="h-auto w-full" />
            </div>
          </div>
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold text-ameixa-900 md:text-4xl">Sobre a Belart</h2>
            <p className="mt-4 text-lg text-tinta-suave">
              A Belart é uma loja de produtos personalizados de Belo Horizonte. Transformamos ideias em canecas,
              garrafas, azulejos, xícaras, taças, blusas e outros produtos para presentear, comemorar ou usar no dia a
              dia.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- Depoimentos: só aparecem quando houver depoimentos reais cadastrados ---------- */}
      {testimonials.length > 0 && (
        <section className="fundo-lavanda py-16 md:py-24">
          <div className="container-loja">
            <h2 className="text-3xl font-extrabold text-ameixa-900 md:text-4xl">Quem já comprou</h2>
            <ul className="mt-8 grid gap-4 md:grid-cols-3">
              {testimonials.map((t) => (
                <li key={t.id}>
                  <figure className="h-full rounded-3xl bg-white p-6 shadow-[0_12px_32px_-20px_rgb(62_10_71/0.4)] ring-1 ring-lilas-200">
                    <blockquote className="text-[1.05rem]">“{t.text}”</blockquote>
                    <figcaption className="mt-4 font-semibold text-ameixa-800">{t.name}</figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ---------- Chamada para contato ---------- */}
      <section className="py-16 md:py-24">
        <div className="container-loja">
          <div className="flex flex-col items-start gap-6 rounded-[var(--radius-bloco)] bg-gradient-to-r from-lavanda via-lilas-200 to-lilas-100 px-6 py-12 md:flex-row md:items-center md:justify-between md:px-14">
            <div className="max-w-xl">
              <h2 className="text-3xl font-extrabold text-ameixa-900">Tem uma ideia diferente?</h2>
              <p className="mt-3 text-ameixa-900/80">
                Conte para a gente o que você imaginou. Respondemos pelo WhatsApp com valores e prazos.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={whatsappLink("Olá, Belart! Tenho uma ideia de personalização.")}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-sol"
              >
                <WhatsAppIcon className="size-5" />
                Chamar no WhatsApp
              </a>
              <a href={site.instagramUrl} target="_blank" rel="noopener noreferrer" className="btn-roxo">
                <InstagramIcon className="size-5" />
                Ver o Instagram
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function ProductSection({ title, products }: { title: string; products: ProductCardData[] }) {
  if (products.length === 0) return null;
  return (
    <div>
      <h2 className="mb-8 text-3xl font-extrabold text-ameixa-900 md:text-4xl">{title}</h2>
      <ProductGrid products={products} />
    </div>
  );
}
