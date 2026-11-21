// Importa os produtos de prisma/catalogo.json para o banco de dados.
//
// Uso:  npm run catalogo:importar
//
// Regras:
//   - Cada produto é identificado pelo "slug". Se já existir, é ATUALIZADO;
//     se não existir, é CRIADO.
//   - Fotos, variações e personalizações do produto são substituídas pelo que
//     estiver no arquivo (a ordem das fotos no arquivo é a ordem no site; a
//     primeira é a capa).
//   - Produtos que NÃO estão no arquivo não são apagados nem alterados.
//   - O arquivo inteiro é conferido antes: se houver qualquer erro, nada é gravado.
//
// Este importador é a forma de cadastrar pelo VS Code até o painel
// administrativo ficar pronto (etapa 3). O painel grava nas mesmas tabelas.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient, type CustomizationType } from "@prisma/client";
import sharp from "sharp";

try {
  process.loadEnvFile(".env");
} catch {
  // sem .env: as variáveis podem vir do ambiente
}

const CATALOG_FILE = join("prisma", "catalogo.json");
const IMAGES_DIR = join("public", "produtos");
const TYPES: CustomizationType[] = ["TEXT", "LONG_TEXT", "SELECT", "IMAGE_LINK"];

type ImagemEntrada = string | { arquivo: string; alt?: string };
type ProdutoEntrada = {
  slug: string;
  nome: string;
  categoria: string;
  preco: number;
  descricao: string;
  disponivel?: boolean;
  destaque?: boolean;
  maisVendido?: boolean;
  prazoProducao?: string;
  imagens?: ImagemEntrada[];
  variacoes?: { nome: string; opcoes: { valor: string; acrescimo?: number; disponivel?: boolean }[] }[];
  personalizacoes?: {
    rotulo: string;
    tipo?: string;
    obrigatorio?: boolean;
    maxCaracteres?: number;
    opcoes?: string[];
    acrescimo?: number;
  }[];
};

// Usa a conexão direta (DIRECT_URL) quando existir: mais adequada para gravações em lote.
const prisma = new PrismaClient({ datasourceUrl: process.env.DIRECT_URL ?? process.env.DATABASE_URL });

function imageUrl(file: string) {
  return /^https?:\/\//.test(file) ? file : `/produtos/${file.replace(/^\/?(produtos\/)?/, "")}`;
}

async function validate(list: ProdutoEntrada[], categorySlugs: Set<string>) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const seen = new Set<string>();

  for (const [i, p] of list.entries()) {
    const where = `Produto ${i + 1} (${p.slug || p.nome || "sem nome"})`;
    if (!p.slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.slug))
      errors.push(`${where}: "slug" deve ter só letras minúsculas, números e hífens (ex.: "caneca-floral").`);
    if (seen.has(p.slug)) errors.push(`${where}: slug repetido no arquivo.`);
    seen.add(p.slug);
    if (!p.nome?.trim()) errors.push(`${where}: falta o "nome".`);
    if (!p.descricao?.trim()) errors.push(`${where}: falta a "descricao".`);
    if (typeof p.preco !== "number" || !(p.preco > 0))
      errors.push(`${where}: "preco" deve ser um número maior que zero, com ponto (ex.: 39.9).`);
    if (!categorySlugs.has(p.categoria))
      errors.push(`${where}: categoria "${p.categoria}" não existe. Use: ${[...categorySlugs].join(", ")}.`);

    for (const img of p.imagens ?? []) {
      const file = typeof img === "string" ? img : img.arquivo;
      if (/^https?:\/\//.test(file)) continue;
      const path = join(IMAGES_DIR, file.replace(/^\/?(produtos\/)?/, ""));
      if (!existsSync(path)) {
        errors.push(`${where}: imagem não encontrada em ${path}`);
        continue;
      }
      const meta = await sharp(path).metadata();
      if (Math.min(meta.width ?? 0, meta.height ?? 0) < 800)
        warnings.push(`${where}: ${file} tem ${meta.width}×${meta.height}px — pode ficar pixelizada.`);
    }
    for (const c of p.personalizacoes ?? []) {
      if (c.tipo && !TYPES.includes(c.tipo as CustomizationType))
        errors.push(`${where}: personalização "${c.rotulo}" com tipo inválido. Use: ${TYPES.join(", ")}.`);
      if (c.tipo === "SELECT" && !c.opcoes?.length)
        errors.push(`${where}: personalização "${c.rotulo}" é SELECT e precisa de "opcoes".`);
    }
  }
  return { errors, warnings };
}

async function revalidateSite() {
  const secret = process.env.REVALIDATE_SECRET;
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  if (!secret) {
    console.log("ℹ REVALIDATE_SECRET não definido no .env: o site mostra as mudanças em até 30 s (dev) ou 10 min (produção).");
    return;
  }
  try {
    const res = await fetch(`${base}/api/revalidar`, { method: "POST", headers: { "x-revalidate-secret": secret } });
    console.log(res.ok ? `✔ Cache do site renovado (${base}).` : `⚠ Não foi possível renovar o cache: HTTP ${res.status}.`);
  } catch {
    console.log(`ℹ O site não está rodando em ${base}; as mudanças aparecem quando ele for iniciado.`);
  }
}

async function main() {
  if (!existsSync(CATALOG_FILE)) throw new Error(`Arquivo ${CATALOG_FILE} não encontrado.`);
  let data: { produtos?: ProdutoEntrada[] };
  try {
    data = JSON.parse(readFileSync(CATALOG_FILE, "utf8"));
  } catch (e) {
    throw new Error(`${CATALOG_FILE} não é um JSON válido: ${(e as Error).message}`);
  }
  const list = data.produtos ?? [];
  if (list.length === 0) {
    console.log(`Nenhum produto em ${CATALOG_FILE}. Veja o modelo em prisma/catalogo.exemplo.json.`);
    return;
  }

  const categories = await prisma.category.findMany({ select: { id: true, slug: true } });
  const categoryId = new Map(categories.map((c) => [c.slug, c.id]));
  const { errors, warnings } = await validate(list, new Set(categoryId.keys()));

  for (const w of warnings) console.log(`⚠ ${w}`);
  if (errors.length) {
    console.error("\nNada foi gravado. Corrija os erros abaixo e rode de novo:\n");
    for (const e of errors) console.error(`  ✖ ${e}`);
    process.exitCode = 1;
    return;
  }

  for (const p of list) {
    // Cada produto é gravado numa transação própria (ou grava tudo do produto, ou nada dele).
    await prisma.$transaction(
      async (tx) => {
        const fields = {
          name: p.nome.trim(),
          description: p.descricao.trim(),
          price: p.preco,
          categoryId: categoryId.get(p.categoria)!,
          available: p.disponivel ?? true,
          featured: p.destaque ?? false,
          bestseller: p.maisVendido ?? false,
          productionTime: p.prazoProducao?.trim() || null,
        };
        const product = await tx.product.upsert({
          where: { slug: p.slug },
          update: fields,
          create: { slug: p.slug, ...fields },
          select: { id: true },
        });

        await tx.productImage.deleteMany({ where: { productId: product.id } });
        await tx.productOption.deleteMany({ where: { productId: product.id } });
        await tx.customization.deleteMany({ where: { productId: product.id } });

        const images = (p.imagens ?? []).map((img, i) => {
          const file = typeof img === "string" ? img : img.arquivo;
          const alt = typeof img === "string" ? "" : (img.alt ?? "");
          return { productId: product.id, url: imageUrl(file), alt: alt || `${p.nome} — foto ${i + 1}`, sortOrder: i };
        });
        if (images.length) await tx.productImage.createMany({ data: images });

        for (const [i, v] of (p.variacoes ?? []).entries()) {
          await tx.productOption.create({
            data: {
              productId: product.id,
              name: v.nome,
              sortOrder: i,
              values: {
                create: v.opcoes.map((o, j) => ({
                  label: o.valor,
                  priceDelta: o.acrescimo ?? 0,
                  available: o.disponivel ?? true,
                  sortOrder: j,
                })),
              },
            },
          });
        }

        const customizations = (p.personalizacoes ?? []).map((c, i) => ({
          productId: product.id,
          label: c.rotulo,
          type: (c.tipo ?? "TEXT") as CustomizationType,
          required: c.obrigatorio ?? false,
          maxLength: c.maxCaracteres ?? null,
          choices: c.opcoes ?? [],
          priceDelta: c.acrescimo ?? 0,
          sortOrder: i,
        }));
        if (customizations.length) await tx.customization.createMany({ data: customizations });

        console.log(`✔ ${p.nome} (${p.slug}) — ${images.length} foto(s)`);
      },
      { timeout: 30_000, maxWait: 10_000 },
    );
  }

  console.log(`\n${list.length} produto(s) importado(s).`);
  await revalidateSite();
}

main()
  .catch((error) => {
    console.error(`\n✖ ${(error as Error).message}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
