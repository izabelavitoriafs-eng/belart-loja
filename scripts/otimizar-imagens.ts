// Otimiza as fotos dos produtos para a web.
//
// Uso:
//   1. Coloque as fotos originais (JPG, PNG ou WEBP, do celular ou câmera) em
//      imagens-originais/<categoria>/  — ex.: imagens-originais/canecas/caneca-floral-1.jpg
//   2. Rode:  npm run imagens:otimizar
//   3. As versões otimizadas são criadas em public/produtos/<categoria>/<nome>.webp
//
// O que o script faz em cada foto:
//   - corrige a rotação de fotos de celular (EXIF);
//   - reduz para no máximo 1600 px no lado maior, SEM esticar nem distorcer
//     (a proporção original é mantida e fotos menores não são ampliadas);
//   - converte para WEBP (qualidade 82), que pesa bem menos que JPG/PNG;
//   - avisa se a foto é pequena demais (vai ficar pixelizada) ou muito longe do quadrado.
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, extname, join, relative } from "node:path";
import sharp from "sharp";

const INPUT = "imagens-originais";
const OUTPUT = join("public", "produtos");
const MAX_SIZE = 1600;
const MIN_RECOMMENDED = 1000;
const EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

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

    // Pula fotos que já foram otimizadas e não mudaram
    if (existsSync(outFile) && statSync(outFile).mtimeMs >= statSync(file).mtimeMs) {
      skipped++;
      continue;
    }

    const image = sharp(file).rotate();
    const meta = await image.metadata();
    // metadata() traz as dimensões antes da rotação; para fotos em pé (orientação 5–8) inverte
    const rotated = (meta.orientation ?? 1) >= 5;
    const width = (rotated ? meta.height : meta.width) ?? 0;
    const height = (rotated ? meta.width : meta.height) ?? 0;

    if (Math.min(width, height) < MIN_RECOMMENDED) {
      warnings.push(`${rel}: ${width}×${height}px — pequena; pode ficar pixelizada. Ideal: 1200×1200px ou maior.`);
    }
    const ratio = Math.max(width, height) / Math.max(1, Math.min(width, height));
    if (ratio > 1.25) {
      warnings.push(`${rel}: proporção ${width}×${height} — nas vitrines a foto aparece em quadrado e as bordas serão cortadas.`);
    }

    mkdirSync(outDir, { recursive: true });
    await image
      .resize({ width: MAX_SIZE, height: MAX_SIZE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(outFile);

    const before = statSync(file).size / 1024;
    const after = statSync(outFile).size / 1024;
    console.log(`✔ ${rel} → produtos/${webPath}  (${before.toFixed(0)} KB → ${after.toFixed(0)} KB)`);
    created++;
  }

  console.log(`\n${created} foto(s) otimizada(s), ${skipped} sem alteração.`);
  if (warnings.length) {
    console.log("\nAtenção:");
    for (const w of warnings) console.log(`  ⚠ ${w}`);
  }
  console.log('\nNo catalogo.json, use o caminho depois de "produtos/", ex.: "canecas/caneca-floral-1.webp".');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
