// Otimiza e PADRONIZA as fotos dos produtos para a web (pelo VS Code).
// (O painel administrativo faz a mesma padronização ao enviar fotos pelo navegador.)
//
// Uso:
//   1. Coloque as fotos originais (JPG, PNG ou WEBP) em imagens-originais/<categoria>/
//   2. Rode:  npm run imagens:otimizar
//      (para refazer fotos já otimizadas:  npm run imagens:otimizar -- --forcar)
//      (para forçar um fundo:              npm run imagens:otimizar -- --fundo=#ffffff)
//   3. As versões padronizadas são criadas em public/produtos/<categoria>/<nome>.webp
//
// As regras de padronização estão em src/lib/image-processing.ts.
// Giro 360°: sequência numa pasta terminada em "-360" (01.jpg, 02.jpg…).
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, relative } from "node:path";
import { processSpinFrame, standardizeGalleryImage } from "../src/lib/image-processing";

const INPUT = "imagens-originais";
const OUTPUT = join("public", "produtos");
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

    if (!FORCE && existsSync(outFile) && statSync(outFile).mtimeMs >= statSync(file).mtimeMs) {
      skipped++;
      continue;
    }

    const source = readFileSync(file);
    const result = isSpin ? await processSpinFrame(source) : await standardizeGalleryImage(source, forcedBackground);

    if (Math.min(result.width, result.height) < (isSpin ? MIN_RECOMMENDED_SPIN : MIN_RECOMMENDED)) {
      warnings.push(
        `${rel}: ${result.width}×${result.height}px — pequena; ${
          isSpin ? "pode ficar pixelizada" : "foi ampliada para 1600×1600 e vai ficar sem nitidez no zoom"
        }. Ideal: 1600×1600px ou maior.`,
      );
    }

    mkdirSync(outDir, { recursive: true });
    writeFileSync(outFile, result.buffer);
    const before = statSync(file).size / 1024;
    const after = result.buffer.length / 1024;
    console.log(`✔ ${rel} → produtos/${webPath}  (${result.mode}; ${before.toFixed(0)} KB → ${after.toFixed(0)} KB)`);
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
