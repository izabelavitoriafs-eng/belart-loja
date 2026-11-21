"use client";

// Foto principal da galeria: é estática (sem efeito ao passar o mouse).
// O zoom fica para a tela cheia: clicar (ou tocar) abre a foto ampliada,
// onde dá para aproximar com os botões, a roda do mouse, pinça ou toque duplo.
import Image from "next/image";
import { Expand } from "lucide-react";

type Props = {
  src: string;
  alt: string;
  priority?: boolean;
  onOpen: () => void;
};

export function ZoomImage({ src, alt, priority = false, onOpen }: Props) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Ampliar foto: ${alt}`}
      className="group relative block h-full w-full cursor-zoom-in overflow-hidden"
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(min-width: 1024px) 600px, (min-width: 768px) 50vw, 100vw"
        className="object-contain"
        draggable={false}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute right-3 bottom-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-ameixa-800 shadow-sm transition-colors group-hover:bg-white"
      >
        <Expand className="size-4" />
        <span className="pointer-coarse:hidden">Clique para ampliar</span>
        <span className="hidden pointer-coarse:inline">Toque para ampliar</span>
      </span>
    </button>
  );
}
