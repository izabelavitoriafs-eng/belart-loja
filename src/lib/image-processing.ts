// Padronização das fotos dos produtos — usada pelo script imagens:otimizar
// e pelo envio de fotos no painel administrativo (mesmo resultado nos dois).
//
// Fotos da galeria:
//   - QUADRADAS, 1600×1600 px, produto inteiro centralizado, sem cortar nem esticar;
//   - fundo liso → completa com a mesma cor e reenquadra o produto para ocupar
//     sempre 84% do quadro (mesma margem em todas as fotos);
//   - fundo de cenário → completa as laterais com a própria foto desfocada;
//   - WEBP qualidade 82, rotação do celular (EXIF) corrigida.
// Quadros do 360°: só reduzidos (até 1200 px), para ficarem idênticos entre si.
import sharp from "sharp";

export const GALLERY_SIZE = 1600;
export const SPIN_MAX_SIZE = 1200;
const PRODUCT_AREA = 0.84;

type Rgb = { r: number; g: number; b: number };

export function hexToRgb(hex: string): Rgb {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? [...h].map((c) => c + c).join("") : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** Cor média da borda da foto e se o fundo é liso (pouca variação). */
async function analyzeBorder(input: Buffer) {
  const N = 48;
  const { data } = await sharp(input)
    .resize(N, N, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const px: [number, number, number][] = [];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (x > 1 && x < N - 2 && y > 1 && y < N - 2) continue;
      const i = (y * N + x) * 3;
      px.push([data[i], data[i + 1], data[i + 2]]);
    }
  }
  const mean = [0, 1, 2].map((c) => px.reduce((s, p) => s + p[c], 0) / px.length);
  const deviation = Math.sqrt(
    px.reduce((s, p) => s + [0, 1, 2].reduce((t, c) => t + (p[c] - mean[c]) ** 2, 0), 0) / (px.length * 3),
  );
  return {
    color: { r: Math.round(mean[0]), g: Math.round(mean[1]), b: Math.round(mean[2]) },
    // "Liso" = fundo branco de estúdio (quase branco, pouca variação) ou fundo de
    // qualquer cor totalmente uniforme. Fundos cinza com degradê ou sombra usam o
    // preenchimento desfocado, que não deixa uma "caixa" de outro tom visível.
    plain: (Math.min(...mean) >= 248 && deviation < 18) || deviation < 3,
  };
}

export type StandardizeResult = { buffer: Buffer; mode: string; width: number; height: number };

/** Foto da galeria padronizada (WEBP 1600×1600). */
export async function standardizeGalleryImage(source: Buffer, forcedBackground?: string): Promise<StandardizeResult> {
  const meta = await sharp(source).metadata();
  const rotated = (meta.orientation ?? 1) >= 5;
  const width = (rotated ? meta.height : meta.width) ?? 0;
  const height = (rotated ? meta.width : meta.height) ?? 0;

  const input = await sharp(source).rotate().toBuffer();
  const border = await analyzeBorder(input);
  const plain = Boolean(forcedBackground) || border.plain;

  let product = input;
  if (plain) {
    try {
      product = await sharp(input).trim({ background: border.color, threshold: 24 }).toBuffer();
    } catch {
      product = input;
    }
  }
  const box = plain ? Math.round(GALLERY_SIZE * PRODUCT_AREA) : GALLERY_SIZE;
  const resized = await sharp(product).resize({ width: box, height: box, fit: "inside" }).toBuffer();

  let background: Buffer;
  let mode: string;
  if (plain) {
    const color = forcedBackground ? hexToRgb(forcedBackground) : border.color;
    background = await sharp({
      create: { width: GALLERY_SIZE, height: GALLERY_SIZE, channels: 3, background: color },
    })
      .png()
      .toBuffer();
    mode = forcedBackground ? `fundo ${forcedBackground}` : "fundo liso";
  } else {
    background = await sharp(input)
      .resize(GALLERY_SIZE, GALLERY_SIZE, { fit: "cover" })
      .blur(40)
      .modulate({ brightness: 1.03 })
      .toBuffer();
    mode = "fundo desfocado";
  }

  const buffer = await sharp(background)
    .composite([{ input: resized, gravity: "center" }])
    .flatten()
    .webp({ quality: 82 })
    .toBuffer();
  return { buffer, mode, width, height };
}

/** Quadro da sequência 360° (WEBP até 1200 px, sem reenquadrar). */
export async function processSpinFrame(source: Buffer): Promise<StandardizeResult> {
  const meta = await sharp(source).metadata();
  const rotated = (meta.orientation ?? 1) >= 5;
  const buffer = await sharp(source)
    .rotate()
    .resize({ width: SPIN_MAX_SIZE, height: SPIN_MAX_SIZE, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 78 })
    .toBuffer();
  return {
    buffer,
    mode: "quadro 360°",
    width: (rotated ? meta.height : meta.width) ?? 0,
    height: (rotated ? meta.width : meta.height) ?? 0,
  };
}
