// Página de TESTE dos componentes de produto (galeria, tela cheia com zoom, 3D e 360°).
// Só existe em desenvolvimento (npm run dev); no site publicado responde 404.
//
// - Fotos: fotos de caneca enviadas para teste (public/produtos/canecas).
// - Giro 360°: sequência de DEMONSTRAÇÃO gerada por computador (public/demo-360),
//   apenas para testar o visualizador. Não é foto de produto real.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/product-gallery";
import { ProductPurchase } from "@/components/product-purchase";
import { isModel3D } from "@/lib/models-3d";

export const metadata: Metadata = { title: "Teste do visualizador", robots: { index: false, follow: false } };

const gallery = [1, 2].map((n) => ({
  id: `foto-${n}`,
  url: `/produtos/canecas/caneca-branca-${n}.webp`,
  alt: `Caneca branca — foto ${n}`,
}));

const spin = Array.from({ length: 36 }, (_, i) => ({
  id: `quadro-${i + 1}`,
  url: `/demo-360/${String(i + 1).padStart(2, "0")}.webp`,
  alt: `Ângulo ${i * 10}°`,
}));

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// Para testar outro modelo 3D: /dev/visualizador?modelo=taca (caneca, xicara, garrafa, taca, azulejo, blusa)
export default async function VisualizadorTeste({ searchParams }: Props) {
  if (process.env.NODE_ENV === "production") notFound();
  const { modelo } = await searchParams;
  const model3d = typeof modelo === "string" && isModel3D(modelo) ? modelo : "caneca";

  return (
    <div className="container-loja py-10">
      <p className="rounded-2xl bg-sol-100 px-4 py-3 text-sm text-ameixa-950">
        <strong>Página de teste (só aparece em desenvolvimento).</strong> O giro 360° usa uma sequência de
        demonstração gerada por computador.
      </p>

      <div className="mt-8 grid gap-10 md:grid-cols-2 md:gap-12">
        <ProductGallery name="Caneca branca personalizada" gallery={gallery} spin={spin} model3d={model3d} />

        <div>
          <h1 className="text-4xl font-extrabold text-ameixa-900">Caneca branca personalizada</h1>
          <p className="mt-3 mb-8 font-display text-3xl font-bold text-ameixa-800">R$ 35,00</p>
          <ProductPurchase
            name="Caneca branca personalizada"
            basePrice={35}
            available
            productUrl="http://localhost:3000/dev/visualizador"
            options={[]}
            customizations={[
              {
                id: "ideia",
                label: "Nos conte o que você está pensando",
                type: "LONG_TEXT",
                required: true,
                maxLength: 500,
                choices: [],
                priceDelta: 0,
              },
              {
                id: "inspiracoes",
                label: "Link de inspirações",
                type: "IMAGE_LINK",
                required: false,
                maxLength: null,
                choices: [],
                priceDelta: 0,
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
