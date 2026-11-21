"use client";

// Visualização 3D de verdade: um modelo tridimensional do produto, desenhado
// no navegador com Three.js (WebGL). O cliente gira em qualquer direção e aproxima.
//
// - Mouse: arrastar gira; roda do mouse aproxima/afasta.
// - Celular: um dedo gira; pinça aproxima/afasta.
// - Teclado (com foco no visualizador): setas giram.
// - Desempenho: a biblioteca 3D só é baixada quando este componente aparece
//   (o cliente escolhe a miniatura "3D"); a animação pausa fora da tela.
//
// Os modelos são gerados por código a partir das medidas do produto (sem arquivo
// 3D externo). Para acrescentar outro produto (xícara, taça, garrafa, azulejo),
// crie uma função em MODELS e libere o nome em MODELOS_3D (importador).
import { useEffect, useRef, useState } from "react";
import { Loader2, Rotate3d } from "lucide-react";
import type * as THREE_NS from "three";
import { REDUCED_MOTION_QUERY, useMediaQuery } from "@/lib/use-media-query";

export type Model3DKind = "caneca";

type Three = typeof THREE_NS;

/** Cerâmica branca esmaltada (brilhante, com verniz). */
function ceramic(THREE: Three) {
  return new THREE.MeshPhysicalMaterial({
    color: 0xf7f7f9,
    roughness: 0.2,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    side: THREE.DoubleSide,
  });
}

/** Caneca padrão de 325 ml: ~9,5 cm de altura e ~8,2 cm de diâmetro (1 unidade = 1 cm). */
function buildMug(THREE: Three) {
  const group = new THREE.Group();
  const material = ceramic(THREE);

  // Corpo: perfil (raio, altura) girado em torno do eixo vertical — base, parede externa,
  // borda arredondada, parede interna e fundo interno.
  const profile = [
    [0, 0],
    [3.6, 0],
    [3.9, 0.12],
    [4.05, 0.45],
    [4.1, 1],
    [4.1, 9.25],
    [4.07, 9.42],
    [3.98, 9.5],
    [3.88, 9.47],
    [3.82, 9.3],
    [3.82, 0.9],
    [3.7, 0.7],
    [3.3, 0.62],
    [0, 0.6],
  ].map(([r, h]) => new THREE.Vector2(r, h));
  const body = new THREE.Mesh(new THREE.LatheGeometry(profile, 128), material);
  group.add(body);

  // Alça em "C", presa na parede (as pontas ficam escondidas dentro dela)
  const curve = new THREE.CatmullRomCurve3(
    [
      [3.85, 7.9],
      [5.2, 8.15],
      [6.45, 7.4],
      [6.9, 5.6],
      [6.6, 3.7],
      [5.35, 2.55],
      [3.85, 2.7],
    ].map(([x, y]) => new THREE.Vector3(x, y, 0)),
  );
  const handle = new THREE.Mesh(new THREE.TubeGeometry(curve, 96, 0.5, 24, false), material);
  group.add(handle);

  // Centraliza o conjunto (corpo + alça) no ponto de giro
  group.position.set(-1.4, -4.75, 0);
  const pivot = new THREE.Group();
  pivot.add(group);
  return { object: pivot, floorY: -4.75 };
}

const MODELS: Record<Model3DKind, (THREE: Three) => { object: THREE_NS.Object3D; floorY: number }> = {
  caneca: buildMug,
};

/** Sombra suave no "chão", feita com um gradiente (leve e sem custo de processamento). */
function softShadow(THREE: Three, y: number) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(42,7,49,0.32)");
  gradient.addColorStop(0.55, "rgba(42,7,49,0.12)");
  gradient.addColorStop(1, "rgba(42,7,49,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(15, 11),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y - 0.01;
  return mesh;
}

type Props = { kind: Model3DKind; alt: string; className?: string };

export function Model3DViewer({ kind, alt, className = "" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const objectRef = useRef<THREE_NS.Object3D | null>(null);
  const reducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);
  const reducedMotionRef = useRef(reducedMotion);
  reducedMotionRef.current = reducedMotion;

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [interacted, setInteracted] = useState(false);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      try {
        // Baixa a biblioteca 3D só agora (não pesa nas outras páginas)
        const THREE = await import("three");
        const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
        const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
        const container = containerRef.current;
        if (disposed || !container) return;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        renderer.domElement.style.display = "block";
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        container.prepend(renderer.domElement);

        const scene = new THREE.Scene();
        // Reflexos realistas de um ambiente iluminado (sem baixar imagens)
        const pmrem = new THREE.PMREMGenerator(renderer);
        const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        scene.environment = environment;
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
        keyLight.position.set(6, 12, 8);
        scene.add(keyLight);

        const { object, floorY } = MODELS[kind](THREE);
        scene.add(object);
        scene.add(softShadow(THREE, floorY));
        objectRef.current = object;

        const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
        camera.position.set(0, 5.5, 31);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 0, 0);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.enablePan = false;
        controls.minDistance = 22; // aproximação máxima
        controls.maxDistance = 42;
        controls.minPolarAngle = 0.12; // quase de cima
        controls.maxPolarAngle = Math.PI - 0.35; // até ver um pouco por baixo
        controls.rotateSpeed = 0.8;
        controls.zoomSpeed = 0.6;
        // Giro lento automático só até a primeira interação (e nunca com "reduzir movimento")
        controls.autoRotate = !reducedMotionRef.current;
        controls.autoRotateSpeed = 1.2;
        const onStart = () => {
          controls.autoRotate = false;
          setInteracted(true);
        };
        controls.addEventListener("start", onStart);

        const resize = () => {
          const { clientWidth: w, clientHeight: h } = container;
          if (!w || !h) return;
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
        };
        resize();
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(container);

        // Só desenha enquanto o visualizador está na tela
        let visible = true;
        const intersection = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
        });
        intersection.observe(container);

        let frame = 0;
        const loop = () => {
          frame = requestAnimationFrame(loop);
          if (!visible || document.hidden) return;
          controls.update();
          renderer.render(scene, camera);
        };
        loop();
        setStatus("ready");

        cleanup = () => {
          cancelAnimationFrame(frame);
          resizeObserver.disconnect();
          intersection.disconnect();
          controls.removeEventListener("start", onStart);
          controls.dispose();
          scene.traverse((node) => {
            const mesh = node as THREE_NS.Mesh;
            mesh.geometry?.dispose();
            const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
            for (const m of materials) {
              (m as THREE_NS.MeshBasicMaterial).map?.dispose();
              m.dispose();
            }
          });
          environment.dispose();
          pmrem.dispose();
          renderer.dispose();
          renderer.domElement.remove();
          objectRef.current = null;
        };
      } catch (error) {
        console.error("Visualização 3D indisponível:", error);
        if (!disposed) setStatus("error");
      }
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [kind]);

  // Teclado: setas giram o modelo
  const onKeyDown = (e: React.KeyboardEvent) => {
    const object = objectRef.current;
    if (!object) return;
    const step = 0.2;
    if (e.key === "ArrowLeft") object.rotation.y -= step;
    else if (e.key === "ArrowRight") object.rotation.y += step;
    else if (e.key === "ArrowUp") object.rotation.x = Math.max(-0.8, object.rotation.x - step);
    else if (e.key === "ArrowDown") object.rotation.x = Math.min(0.8, object.rotation.x + step);
    else return;
    e.preventDefault();
    e.stopPropagation();
    setInteracted(true);
  };

  return (
    <div
      ref={containerRef}
      role="img"
      tabIndex={0}
      aria-label={`${alt} em 3D. Arraste para girar, use a roda do mouse ou pinça para aproximar, ou as setas do teclado.`}
      onKeyDown={onKeyDown}
      onPointerDown={() => setInteracted(true)}
      className={`relative h-full w-full cursor-grab touch-none select-none active:cursor-grabbing ${className}`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-ameixa-800 shadow-sm"
      >
        3D
      </span>

      {status === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-ameixa-800" role="status">
          <Loader2 aria-hidden className="size-8 animate-spin" />
          <span className="text-sm font-medium">Carregando visualização 3D…</span>
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center p-8 text-center text-sm text-tinta-suave" role="alert">
          Não foi possível abrir a visualização 3D neste navegador. As fotos do produto continuam disponíveis nas
          miniaturas.
        </div>
      )}

      {status === "ready" && (
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4 transition-opacity duration-300 ${
            interacted ? "opacity-0" : "opacity-100"
          }`}
        >
          <span className="flex items-center gap-2 rounded-full bg-ameixa-900/85 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur">
            <Rotate3d className="size-5 shrink-0 text-sol-400" />
            Arraste para girar · aproxime com a roda ou pinça
          </span>
        </div>
      )}
    </div>
  );
}
