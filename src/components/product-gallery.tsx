"use client";

// Galeria do produto: foto principal com zoom, miniaturas, visualização 360°
// (só quando o produto tem a sequência de fotos) e tela cheia.
import { useMemo, useState } from "react";
import { Expand, ImageOff } from "lucide-react";
import { Lightbox, Thumb, type GalleryItem } from "@/components/lightbox";
import { SpinViewer } from "@/components/spin-viewer";
import { ZoomImage } from "@/components/zoom-image";
import type { ProductImageData } from "@/lib/catalog";

type Props = {
  name: string;
  gallery: ProductImageData[];
  /** Quadros do 360° (já filtrados no servidor: vazio se não houver o mínimo). */
  spin: ProductImageData[];
};

export function ProductGallery({ name, gallery, spin }: Props) {
  // Monta a lista uma vez (o array de quadros precisa ser estável para não recarregar o 360°)
  const items = useMemo<GalleryItem[]>(() => {
    const photos: GalleryItem[] = gallery.map((img, i) => ({
      type: "image",
      key: img.id,
      src: img.url,
      alt: img.alt || `${name} — foto ${i + 1}`,
    }));
    if (spin.length === 0) return photos;
    const spinItem: GalleryItem = { type: "spin", key: "spin-360", frames: spin.map((f) => f.url), alt: name };
    // O 360° entra logo depois da capa (ou primeiro, se não houver fotos)
    return photos.length ? [photos[0], spinItem, ...photos.slice(1)] : [spinItem];
  }, [gallery, spin, name]);

  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (items.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-[var(--radius-bloco)] bg-white text-lilas-300 ring-1 ring-lilas-200">
        <ImageOff aria-hidden className="size-14" />
        <span className="sr-only">Produto sem foto</span>
      </div>
    );
  }

  const current = items[active];

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-[var(--radius-bloco)] bg-white shadow-[0_20px_50px_-30px_rgb(62_10_71/0.5)] ring-1 ring-lilas-200">
        {current.type === "image" ? (
          <ZoomImage src={current.src} alt={current.alt} priority={active === 0} onOpen={() => setLightboxOpen(true)} />
        ) : (
          <>
            <SpinViewer frames={current.frames} alt={current.alt} />
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="absolute top-3 right-3 flex size-10 items-center justify-center rounded-full bg-white/90 text-ameixa-800 shadow-sm hover:bg-white"
              aria-label="Abrir visualização 360° em tela cheia"
            >
              <Expand className="size-5" aria-hidden />
            </button>
          </>
        )}
      </div>

      {items.length > 1 && (
        <ul className="mt-4 flex flex-wrap gap-3" aria-label="Fotos do produto">
          {items.map((item, i) => (
            <li key={item.key}>
              <Thumb item={item} active={i === active} onClick={() => setActive(i)} />
            </li>
          ))}
        </ul>
      )}

      {lightboxOpen && (
        <Lightbox items={items} index={active} onIndexChange={setActive} onClose={() => setLightboxOpen(false)} />
      )}
    </div>
  );
}
