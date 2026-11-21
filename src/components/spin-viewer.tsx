"use client";

// Visualizador 360° de verdade: uma sequência de fotos do produto, tiradas
// girando-o aos poucos, é desenhada num <canvas> conforme o cliente arrasta.
//
// - Mouse: clicar e arrastar na horizontal.
// - Celular: arrastar com o dedo (a rolagem vertical da página continua funcionando).
// - Teclado: setas ← → (com foco no visualizador).
// - Carregamento: o 1º quadro aparece na hora; os demais são baixados só quando o
//   visualizador entra na tela, em paralelo. Os quadros já vêm otimizados pelo
//   script imagens:otimizar (WEBP, até 1200 px), então são usados direto, sem
//   reprocessamento no servidor.
import { useCallback, useEffect, useRef, useState } from "react";
import { Rotate3d } from "lucide-react";
import { REDUCED_MOTION_QUERY, useMediaQuery } from "@/lib/use-media-query";

type Props = {
  frames: string[];
  alt: string;
  className?: string;
};

const CONCURRENCY = 6;
/** Velocidade máxima da inércia, em quadros por milissegundo (~0,03 = 30 quadros/s). */
const MAX_INERTIA = 0.03;

export function SpinViewer({ frames, alt, className = "" }: Props) {
  const total = frames.length;
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);
  const frameRef = useRef(0);
  const drag = useRef<{ startX: number; startFrame: number; lastX: number; lastT: number; velocity: number } | null>(
    null,
  );
  const inertiaRef = useRef<number | null>(null);

  const [frame, setFrame] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const [interacted, setInteracted] = useState(false);
  const [dragging, setDragging] = useState(false);
  const reducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);

  // ---------- Desenho ----------
  const draw = useCallback(
    (index: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      // Se o quadro pedido ainda não carregou, usa o carregado mais próximo
      let img: HTMLImageElement | null = null;
      for (let d = 0; d < total && !img; d++) {
        img = imagesRef.current[(index + d) % total] ?? imagesRef.current[(index - d + total) % total] ?? null;
      }
      if (!img) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // "contain": cabe inteiro, sem distorcer
      const scale = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    },
    [total],
  );

  const goTo = useCallback(
    (index: number) => {
      const next = ((Math.round(index) % total) + total) % total;
      if (next === frameRef.current) return;
      frameRef.current = next;
      setFrame(next);
      draw(next);
    },
    [draw, total],
  );

  // Ajusta o canvas ao tamanho do container (nitidez em telas de alta densidade)
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(container.clientWidth * dpr);
      canvas.height = Math.round(container.clientHeight * dpr);
      draw(frameRef.current);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
  }, [draw]);

  // ---------- Carregamento ----------
  useEffect(() => {
    imagesRef.current = new Array(total).fill(null);
    let cancelled = false;
    let count = 0;

    const load = (i: number) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.decoding = "async";
        img.src = frames[i];
        const done = () => {
          if (cancelled) return resolve();
          if (img.naturalWidth > 0) {
            imagesRef.current[i] = img;
            count++;
            setLoaded(count);
            if (i === frameRef.current || count === 1) draw(frameRef.current);
          }
          resolve();
        };
        img.decode().then(done, done);
      });

    // Quadro inicial imediatamente
    load(0);

    // Os demais quando o visualizador aparecer na tela, em ordem "espalhada"
    // (0°, 180°, 90°, 270°…) para o giro já funcionar antes de baixar tudo.
    const order = spreadOrder(total).filter((i) => i !== 0);
    let started = false;
    const startRest = async () => {
      if (started) return;
      started = true;
      const queue = [...order];
      const workers = Array.from({ length: CONCURRENCY }, async () => {
        while (queue.length && !cancelled) await load(queue.shift()!);
      });
      await Promise.all(workers);
    };

    const container = containerRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          startRest();
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    if (container) observer.observe(container);

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [frames, total, draw]);

  // ---------- Interação ----------
  const stopInertia = () => {
    if (inertiaRef.current) cancelAnimationFrame(inertiaRef.current);
    inertiaRef.current = null;
  };

  const pixelsPerFrame = () => {
    const width = containerRef.current?.clientWidth ?? 400;
    // Arrastar ~ a largura inteira do visualizador = uma volta completa
    return Math.max(3, width / total);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    stopInertia();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { startX: e.clientX, startFrame: frameRef.current, lastX: e.clientX, lastT: e.timeStamp, velocity: 0 };
    setDragging(true);
    setInteracted(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dt = Math.max(1, e.timeStamp - d.lastT);
    d.velocity = (e.clientX - d.lastX) / dt; // px por ms
    d.lastX = e.clientX;
    d.lastT = e.timeStamp;
    // Arrastar para a direita gira o produto para a direita. A sequência deve ser
    // fotografada girando o produto no sentido horário (visto de cima).
    goTo(d.startFrame - (e.clientX - d.startX) / pixelsPerFrame());
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    setDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    if (!d || reducedMotion) return;
    // Inércia: continua girando e desacelera, como um objeto real
    // quadros por ms, limitado para um "peteleco" rápido não virar um giro descontrolado
    let velocity = Math.max(-MAX_INERTIA, Math.min(MAX_INERTIA, -d.velocity / pixelsPerFrame()));
    if (Math.abs(velocity) < 0.005) return;
    let position = frameRef.current;
    let last = performance.now();
    const step = (now: number) => {
      const dt = now - last;
      last = now;
      position += velocity * dt;
      velocity *= Math.pow(0.94, dt / 16);
      goTo(position);
      inertiaRef.current = Math.abs(velocity) > 0.002 ? requestAnimationFrame(step) : null;
    };
    inertiaRef.current = requestAnimationFrame(step);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const keys: Record<string, number> = { ArrowRight: -1, ArrowLeft: 1 };
    if (e.key in keys) {
      e.preventDefault();
      e.stopPropagation();
      stopInertia();
      setInteracted(true);
      goTo(frameRef.current + keys[e.key]);
    } else if (e.key === "Home") {
      e.preventDefault();
      goTo(0);
    }
  };

  // Para a inércia se o componente sair da tela
  useEffect(
    () => () => {
      if (inertiaRef.current) cancelAnimationFrame(inertiaRef.current);
    },
    [],
  );

  const ready = loaded >= total;
  const degrees = Math.round((frame * 360) / total);

  return (
    <div
      ref={containerRef}
      role="slider"
      tabIndex={0}
      aria-label={`${alt} — visualização 360°. Arraste ou use as setas para girar.`}
      aria-valuemin={0}
      aria-valuemax={359}
      aria-valuenow={degrees}
      aria-valuetext={`${degrees} graus`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      className={`relative h-full w-full touch-pan-y select-none ${dragging ? "cursor-grabbing" : "cursor-grab"} ${className}`}
    >
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />

      {/* Indicador de que dá para girar (some depois da primeira interação) */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 bottom-4 flex justify-center transition-opacity duration-300 ${
          interacted ? "opacity-0" : "opacity-100"
        }`}
      >
        <span className="flex items-center gap-2 rounded-full bg-ameixa-900/85 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur">
          <Rotate3d className="size-5 text-sol-400" />
          Arraste para girar
        </span>
      </div>

      {/* Selo 360° fixo */}
      <span
        aria-hidden
        className="pointer-events-none absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-ameixa-800 shadow-sm"
      >
        360°
      </span>

      {/* Progresso do carregamento */}
      {!ready && (
        <div className="pointer-events-none absolute inset-x-6 top-4 ml-14" aria-live="polite">
          <div className="h-1.5 overflow-hidden rounded-full bg-lilas-200">
            <div
              className="h-full rounded-full bg-ameixa-700 transition-[width] duration-200"
              style={{ width: `${(loaded / total) * 100}%` }}
            />
          </div>
          <span className="sr-only">
            Carregando visualização 360°: {loaded} de {total} fotos
          </span>
        </div>
      )}
    </div>
  );
}

/** Ordem de carregamento que cobre o círculo por igual: 0, n/2, n/4, 3n/4, … */
function spreadOrder(n: number) {
  const order: number[] = [];
  const seen = new Set<number>();
  for (let step = n; step >= 1; step = Math.floor(step / 2)) {
    for (let i = 0; i < n; i += step) {
      if (!seen.has(i)) {
        seen.add(i);
        order.push(i);
      }
    }
    if (step === 1) break;
  }
  return order;
}
