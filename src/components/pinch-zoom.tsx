"use client";

// Foto ampliável usada na tela cheia.
// - Pinça (2 dedos) ou roda do mouse: aproxima/afasta.
// - Toque duplo / clique duplo: alterna entre 1× e 2×.
// - Arrastar com a foto ampliada: move a foto.
// - Arrastar para os lados com a foto em 1×: troca de foto (onSwipe).
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";

const MIN = 1;
const MAX = 3; // aproximação máxima: 3×
const STEP = 1.25; // cada clique em + ou − aproxima/afasta 25%
const WHEEL_STEP = 1.1; // cada "clique" da roda do mouse: 10%
const DOUBLE_TAP_ZOOM = 2;

type View = { scale: number; x: number; y: number };

export function PinchZoom({
  src,
  alt,
  onSwipe,
}: {
  src: string;
  alt: string;
  onSwipe?: (direction: 1 | -1) => void;
}) {
  const areaRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>({ scale: 1, x: 0, y: 0 });
  const viewRef = useRef(view);
  viewRef.current = view;

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{
    startDist: number;
    startScale: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    swipeDx: number;
  } | null>(null);
  const lastTap = useRef(0);

  /** Limita o deslocamento para a foto não "sumir" da tela. */
  const clamp = useCallback((v: View): View => {
    const area = areaRef.current;
    const scale = Math.min(MAX, Math.max(MIN, v.scale));
    if (!area || scale === 1) return { scale, x: 0, y: 0 };
    const maxX = ((scale - 1) * area.clientWidth) / 2;
    const maxY = ((scale - 1) * area.clientHeight) / 2;
    return { scale, x: Math.min(maxX, Math.max(-maxX, v.x)), y: Math.min(maxY, Math.max(-maxY, v.y)) };
  }, []);

  /** Amplia mantendo fixo o ponto (px, py) relativo ao centro da área. */
  const zoomAt = useCallback(
    (nextScale: number, px = 0, py = 0) => {
      const v = viewRef.current;
      const s = Math.min(MAX, Math.max(MIN, nextScale));
      const k = s / v.scale;
      setView(clamp({ scale: s, x: px - (px - v.x) * k, y: py - (py - v.y) * k }));
    },
    [clamp],
  );

  const reset = () => setView({ scale: 1, x: 0, y: 0 });

  // Volta ao tamanho normal ao trocar de foto
  useEffect(() => {
    setView({ scale: 1, x: 0, y: 0 });
  }, [src]);

  // Roda do mouse (precisa de listener não passivo para impedir a rolagem)
  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = area.getBoundingClientRect();
      const px = e.clientX - rect.left - rect.width / 2;
      const py = e.clientY - rect.top - rect.height / 2;
      zoomAt(viewRef.current.scale * (e.deltaY < 0 ? WHEEL_STEP : 1 / WHEEL_STEP), px, py);
    };
    area.addEventListener("wheel", onWheel, { passive: false });
    return () => area.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  const relative = (e: { clientX: number; clientY: number }) => {
    const rect = areaRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left - rect.width / 2, y: e.clientY - rect.top - rect.height / 2 };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    const v = viewRef.current;
    if (pts.length === 2) {
      const mid = relative({ clientX: (pts[0].x + pts[1].x) / 2, clientY: (pts[0].y + pts[1].y) / 2 });
      gesture.current = {
        startDist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y),
        startScale: v.scale,
        startX: v.x,
        startY: v.y,
        originX: mid.x,
        originY: mid.y,
        swipeDx: 0,
      };
    } else if (pts.length === 1) {
      gesture.current = {
        startDist: 0,
        startScale: v.scale,
        startX: v.x - e.clientX,
        startY: v.y - e.clientY,
        originX: e.clientX,
        originY: e.clientY,
        swipeDx: 0,
      };
      // Toque/clique duplo
      const now = e.timeStamp;
      if (now - lastTap.current < 300) {
        const p = relative(e);
        if (v.scale > 1) reset();
        else zoomAt(DOUBLE_TAP_ZOOM, p.x, p.y);
        lastTap.current = 0;
      } else {
        lastTap.current = now;
      }
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (!g) return;
    const pts = [...pointers.current.values()];
    if (pts.length === 2 && g.startDist > 0) {
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const s = Math.min(MAX, Math.max(MIN, (g.startScale * dist) / g.startDist));
      const k = s / g.startScale;
      setView(clamp({ scale: s, x: g.originX - (g.originX - g.startX) * k, y: g.originY - (g.originY - g.startY) * k }));
    } else if (pts.length === 1) {
      if (viewRef.current.scale > 1) {
        setView(clamp({ scale: viewRef.current.scale, x: g.startX + e.clientX, y: g.startY + e.clientY }));
      } else {
        g.swipeDx = e.clientX - g.originX;
      }
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    const g = gesture.current;
    if (pointers.current.size === 0) {
      if (g && viewRef.current.scale === 1 && Math.abs(g.swipeDx) > 60) onSwipe?.(g.swipeDx < 0 ? 1 : -1);
      gesture.current = null;
    } else if (pointers.current.size === 1) {
      // Saiu um dos dedos da pinça: continua arrastando com o outro
      const [p] = [...pointers.current.values()];
      const v = viewRef.current;
      gesture.current = { startDist: 0, startScale: v.scale, startX: v.x - p.x, startY: v.y - p.y, originX: p.x, originY: p.y, swipeDx: 0 };
    }
  };

  return (
    <div className="relative h-full w-full">
      <div
        ref={areaRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`relative h-full w-full touch-none overflow-hidden select-none ${
          view.scale > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"
        }`}
      >
        <div
          className="absolute inset-0 will-change-transform"
          style={{
            transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})`,
            transition: pointers.current.size ? "none" : "transform 120ms ease-out",
          }}
        >
          {/* Resolução original (já otimizada pelo script): o máximo de detalhe no zoom */}
          <Image src={src} alt={alt} fill unoptimized className="object-contain" draggable={false} />
        </div>
      </div>

      {/* Controles de zoom */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-white/95 p-1 shadow-lg">
        <button
          type="button"
          onClick={() => zoomAt(viewRef.current.scale / STEP)}
          disabled={view.scale <= MIN}
          className="flex size-10 items-center justify-center rounded-full text-ameixa-800 hover:bg-lilas-100 disabled:opacity-40"
          aria-label="Diminuir zoom"
        >
          <Minus className="size-5" aria-hidden />
        </button>
        <span className="min-w-14 text-center text-sm font-semibold text-tinta" aria-live="polite">
          {Math.round(view.scale * 100)}%
        </span>
        <button
          type="button"
          onClick={() => zoomAt(viewRef.current.scale * STEP)}
          disabled={view.scale >= MAX}
          className="flex size-10 items-center justify-center rounded-full text-ameixa-800 hover:bg-lilas-100 disabled:opacity-40"
          aria-label="Aumentar zoom"
        >
          <Plus className="size-5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={view.scale === 1}
          className="flex size-10 items-center justify-center rounded-full text-ameixa-800 hover:bg-lilas-100 disabled:opacity-40"
          aria-label="Voltar ao tamanho original"
        >
          <RotateCcw className="size-5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
