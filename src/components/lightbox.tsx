"use client";

// Visualização em tela cheia das fotos (com zoom) e do giro 360° (em alta resolução).
import Image from "next/image";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { PinchZoom } from "@/components/pinch-zoom";
import { SpinViewer } from "@/components/spin-viewer";

export type GalleryItem =
  | { type: "image"; key: string; src: string; alt: string }
  | { type: "spin"; key: string; frames: string[]; alt: string };

type Props = {
  items: GalleryItem[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

export function Lightbox({ items, index, onIndexChange, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const item = items[index];
  const go = (dir: 1 | -1) => onIndexChange((index + dir + items.length) % items.length);

  // Trava a rolagem da página, foca o botão fechar e devolve o foco ao sair
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  // Teclado: Esc fecha; ← → trocam de foto (no 360°, as setas giram o produto)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.defaultPrevented) return;
      if (e.key === "ArrowRight") onIndexChange((index + 1) % items.length);
      if (e.key === "ArrowLeft") onIndexChange((index - 1 + items.length) % items.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, items.length, onClose, onIndexChange]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Fotos do produto em tela cheia"
      className="fixed inset-0 z-[60] flex flex-col bg-ameixa-950/95 text-white backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <p className="text-sm text-lilas-200" aria-live="polite">
          {item.type === "spin" ? "Visualização 360°" : `Foto ${index + 1} de ${items.length}`}
        </p>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="flex size-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
          aria-label="Fechar tela cheia"
        >
          <X className="size-6" aria-hidden />
        </button>
      </div>

      <div className="relative min-h-0 flex-1 px-2 md:px-16">
        <div className="h-full rounded-3xl bg-white">
          {item.type === "image" ? (
            <PinchZoom src={item.src} alt={item.alt} onSwipe={go} />
          ) : (
            <SpinViewer frames={item.frames} alt={item.alt} />
          )}
        </div>

        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute top-1/2 left-3 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 md:flex"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="size-7" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute top-1/2 right-3 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 md:flex"
              aria-label="Próxima foto"
            >
              <ChevronRight className="size-7" aria-hidden />
            </button>
          </>
        )}
      </div>

      {items.length > 1 && (
        <ul className="flex justify-center gap-2 overflow-x-auto px-4 py-3" aria-label="Escolher foto">
          {items.map((it, i) => (
            <li key={it.key}>
              <Thumb item={it} active={i === index} onClick={() => onIndexChange(i)} dark />
            </li>
          ))}
        </ul>
      )}
    </div>,
    document.body,
  );
}

/** Miniatura usada na galeria e na tela cheia. */
export function Thumb({
  item,
  active,
  onClick,
  dark = false,
}: {
  item: GalleryItem;
  active: boolean;
  onClick: () => void;
  dark?: boolean;
}) {
  const src = item.type === "image" ? item.src : item.frames[0];
  const label = item.type === "spin" ? "Ver em 360°" : item.alt;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-current={active ? "true" : undefined}
      className={`relative block size-16 overflow-hidden rounded-2xl bg-white ring-2 transition md:size-20 ${
        active ? "ring-sol-500" : dark ? "ring-white/20 hover:ring-white/50" : "ring-lilas-200 hover:ring-ameixa-600/50"
      }`}
    >
      <Image src={src} alt="" fill sizes="80px" className="object-contain" />
      {item.type === "spin" && (
        <span className="absolute inset-0 flex items-center justify-center bg-ameixa-900/55 font-display text-base font-extrabold text-white">
          360°
        </span>
      )}
    </button>
  );
}
