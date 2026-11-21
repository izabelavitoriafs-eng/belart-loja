// Gera o endereço da imagem otimizada pelo Next.js (/_next/image) para uso
// fora do componente <Image>, como no visualizador 360° (canvas) e no
// pré-carregamento. O Next converte para WEBP/AVIF e redimensiona sob demanda.
//
// As larguras precisam ser uma das configuradas no Next (padrão):
// 640, 750, 828, 1080, 1200, 1920, 2048, 3840.
export type OptimizedWidth = 640 | 750 | 828 | 1080 | 1200 | 1920 | 2048;

export function optimizedImageUrl(src: string, width: OptimizedWidth, quality = 75) {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}
