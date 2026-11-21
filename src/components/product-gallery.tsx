"use client";

// Galeria do produto: foto principal, miniaturas, visualização 3D (quando o
// produto tem modelo 3D), visualização 360° (quando tem a sequência de fotos)
// e tela cheia com zoom.
import { useMemo, useState } from "react";
import { Expand, ImageOff } from "lucide-react";
import { Lightbox, Thumb, type GalleryItem } from "@/components/lightbox";
import { SpinViewer } from "@/components/spin-viewer";
import { ZoomImage } from "@/components/zoom-image";
import { Model3DViewer } from "@/components/model-3d-viewer";
import type { Model3D, ProductImageData } from "@/lib/catalog";

type Props = {
  name: string;
  gallery: ProductImageData[];
  /** Quadros do 360° (já filtrados no servidor: vazio se não houver o mínimo). */
  spin: ProductImageData[];
  /** Modelo 3D do produto (ou null). */
  model3d?: Model3D | null;
};

export function ProductGallery({ name, gallery, spin, model3d = null }: Props) {
  // Monta a lista uma vez (o array de quadros precisa ser estável para não recarregar o 360°)
  const items = useMemo<GalleryItem[]>(() => {
    const photos: GalleryItem[] = gallery.map((img, i) => ({
      type: "image",
      key: img.id,
      src: img.url,
      alt: img.alt || `${name} — foto ${i + 1}`,
    }));
    const extras: GalleryItem[] = [];
    if (model3d) extras.push({ type: "model3d", key: "modelo-3d", model: model3d, poster: gallery[0]?.url ?? null, alt: name });
    if (spin.length) extras.push({ type: "spin", key: "spin-360", frames: spin.map((f) => f.url), alt: name });
    // 3D e 360° entram logo depois da capa (ou primeiro, se não houver fotos)
    return photos.length ? [photos[0], ...extras, ...photos.slice(1)] : extras;
  }, [gallery, spin, model3d, name]);

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
            {current.type === "spin" ? (
              <SpinViewer frames={current.frames} alt={current.alt} />
            ) : (
              <Model3DViewer kind={current.model} alt={current.alt} />
            )}
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="absolute top-3 right-3 flex size-10 items-center justify-center rounded-full bg-white/90 text-ameixa-800 shadow-sm hover:bg-white"
              aria-label={`Abrir visualização ${current.type === "spin" ? "360°" : "3D"} em tela cheia`}
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
