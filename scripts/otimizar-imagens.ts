// Otimiza e PADRONIZA as fotos dos produtos para a web.
//
// Uso:
//   1. Coloque as fotos originais (JPG, PNG ou WEBP, do celular ou câmera) em
//      imagens-originais/<categoria>/  — ex.: imagens-originais/canecas/caneca-floral-1.jpg
//   2. Rode:  npm run imagens:otimizar
//      (para refazer fotos que já foram otimizadas:  npm run imagens:otimizar -- --forcar)
//   3. As versões padronizadas são criadas em public/produtos/<categoria>/<nome>.webp
//
// Padronização das fotos da galeria (todas ficam iguais em formato e tamanho):
//   - QUADRADAS, 1600×1600 px, com o produto inteiro centralizado — sem cortar
//     e sem esticar (a proporção do produto é sempre mantida);
//   - o espaço que sobra é preenchido com o FUNDO da própria foto:
//       · fundo liso (branco, preto, cor única) → completa com a mesma cor, e o
//         produto é reenquadrado para ocupar sempre a mesma área (84% do quadro),
//         com a mesma margem em todas as fotos;
//       · fundo de cenário (mesa, parede…) → completa com a própria foto desfocada;
//     para forçar um fundo, use:  npm run imagens:otimizar -- --fundo=#ffffff
//   - corrige a rotação de fotos de celular (EXIF) e converte para WEBP.
//
// Giro 360°: coloque a sequência numa pasta terminada em "-360", ex.:
//   imagens-originais/canecas/caneca-floral-360/01.jpg … 36.jpg
// Esses quadros não são enquadrados em quadrado (precisam ficar idênticos entre si
// para o giro não "pular"): só ficam com até 1200 px e mantêm a numeração do nome.
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, extname, join, relative } from "node:path";
import sharp from "sharp";

const INPUT = "imagens-originais";
const OUTPUT = join("public", "produtos");
const SIZE = 1600; // lado das fotos padronizadas da galeria
const PRODUCT_AREA = 0.84; // em fundo liso, o produto ocupa 84% do lado do quadro
const MAX_SIZE_SPIN = 1200;
const MIN_RECOMMENDED = 1000;
const MIN_RECOMMENDED_SPIN = 800;
const EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const args = process.argv.slice(2);
const FORCE = args.includes("--forcar");
const forcedBackground = args.find((a) => a.startsWith("--fundo="))?.split("=")[1];

/** "Caneca Floral 1.JPG" → "caneca-floral-1" */
function slugify(name: string) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function listFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? listFiles(full) : [full];
  });
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? [...h].map((c) => c + c).join("") : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/**
 * Analisa a borda da foto: devolve a cor média e se o fundo é "liso"
 * (pouca variação de cor na borda) ou um cenário.
 */
async function analyzeBorder(input: Buffer) {
  const N = 48;
  const { data } = await sharp(input).resize(N, N, { fit: "fill" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const px: [number, number, number][] = [];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (x > 1 && x < N - 2 && y > 1 && y < N - 2) continue; // só as 2 linhas da borda
      const i = (y * N + x) * 3;
      px.push([data[i], data[i + 1], data[i + 2]]);
    }
  }
  const mean = [0, 1, 2].map((c) => px.reduce((s, p) => s + p[c], 0) / px.length);
  const deviation = Math.sqrt(
    px.reduce((s, p) => s + [0, 1, 2].reduce((t, c) => t + (p[c] - mean[c]) ** 2, 0), 0) / (px.length * 3),
  );
  return { color: { r: Math.round(mean[0]), g: Math.round(mean[1]), b: Math.round(mean[2]) }, plain: deviation < 18 };
}

/** Enquadra a foto num quadrado SIZE×SIZE, centralizada, sem cortar nem esticar. */
async function standardize(file: string) {
  const input = await sharp(file).rotate().toBuffer(); // aplica a rotação EXIF
  const border = await analyzeBorder(input);
  const plain = Boolean(forcedBackground) || border.plain;

  // Fundo liso: remove o fundo em excesso ao redor do produto (trim) para
  // reenquadrar todas as fotos com o produto do mesmo tamanho.
  let source = input;
  if (plain) {
    try {
      source = await sharp(input).trim({ background: border.color, threshold: 24 }).toBuffer();
    } catch {
      source = input; // nada para recortar
    }
  }
  const box = plain ? Math.round(SIZE * PRODUCT_AREA) : SIZE;
  const product = await sharp(source).resize({ width: box, height: box, fit: "inside" }).toBuffer();

  let background: Buffer;
  let mode: string;
  if (plain) {
    const color = forcedBackground ? hexToRgb(forcedBackground) : border.color;
    background = await sharp({ create: { width: SIZE, height: SIZE, channels: 3, background: color } }).png().toBuffer();
    mode = forcedBackground ? `fundo ${forcedBackground}` : "fundo liso";
  } else {
    // Cenário: a própria foto ampliada e bem desfocada preenche as laterais
    background = await sharp(input).resize(SIZE, SIZE, { fit: "cover" }).blur(40).modulate({ brightness: 1.03 }).toBuffer();
    mode = "fundo desfocado";
  }

  const output = sharp(background).composite([{ input: product, gravity: "center" }]).flatten();
  return { output, mode };
}

async function main() {
  const files = listFiles(INPUT).filter((f) => EXTENSIONS.has(extname(f).toLowerCase()));
  if (files.length === 0) {
    console.log(`Nenhuma foto encontrada em ${INPUT}/. Coloque as fotos em ${INPUT}/<categoria>/ e rode de novo.`);
    return;
  }

  let created = 0;
  let skipped = 0;
  const warnings: string[] = [];

  for (const file of files) {
    const rel = relative(INPUT, file);
    const subdir = dirname(rel) === "." ? "" : dirname(rel).split(/[\\/]/).map(slugify).join("/");
    const name = slugify(basename(file, extname(file)));
    const outDir = join(OUTPUT, subdir);
    const outFile = join(outDir, `${name}.webp`);
    const webPath = `${subdir ? `${subdir}/` : ""}${name}.webp`;
    const isSpin = /-360(\/|$)/.test(subdir);

    // Pula fotos que já foram otimizadas e não mudaram (use --forcar para refazer)
    if (!FORCE && existsSync(outFile) && statSync(outFile).mtimeMs >= statSync(file).mtimeMs) {
      skipped++;
      continue;
    }

    const meta = await sharp(file).metadata();
    // metadata() traz as dimensões antes da rotação; para fotos em pé (orientação 5–8) inverte
    const rotated = (meta.orientation ?? 1) >= 5;
    const width = (rotated ? meta.height : meta.width) ?? 0;
    const height = (rotated ? meta.width : meta.height) ?? 0;

    if (Math.min(width, height) < (isSpin ? MIN_RECOMMENDED_SPIN : MIN_RECOMMENDED)) {
      warnings.push(
        `${rel}: ${width}×${height}px — pequena; ${isSpin ? "pode ficar pixelizada" : "foi ampliada para 1600×1600 e vai ficar sem nitidez no zoom"}. Ideal: 1600×1600px ou maior.`,
      );
    }

    mkdirSync(outDir, { recursive: true });
    let mode = "";
    if (isSpin) {
      await sharp(file)
        .rotate()
        .resize({ width: MAX_SIZE_SPIN, height: MAX_SIZE_SPIN, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 78 })
        .toFile(outFile);
      mode = "quadro 360°";
    } else {
      const result = await standardize(file);
      await result.output.webp({ quality: 82 }).toFile(outFile);
      mode = `${SIZE}×${SIZE}, ${result.mode}`;
    }

    const before = statSync(file).size / 1024;
    const after = statSync(outFile).size / 1024;
    console.log(`✔ ${rel} → produtos/${webPath}  (${mode}; ${before.toFixed(0)} KB → ${after.toFixed(0)} KB)`);
    created++;
  }

  console.log(`\n${created} foto(s) otimizada(s), ${skipped} sem alteração.`);
  if (warnings.length) {
    console.log("\nAtenção:");
    for (const w of warnings) console.log(`  ⚠ ${w}`);
  }
  console.log('\nNo catalogo.json, use o caminho depois de "produtos/", ex.: "canecas/caneca-floral-1.webp".');
  console.log('Para o giro 360°, use a pasta: "giro360": "canecas/caneca-floral-360".');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
