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
// 3D externo). Para acrescentar outro produto, crie uma função em BUILDERS e
// inclua o nome em src/lib/models-3d.ts.
import { useEffect, useRef, useState } from "react";
import { Loader2, Rotate3d } from "lucide-react";
import type * as THREE_NS from "three";
import { REDUCED_MOTION_QUERY, useMediaQuery } from "@/lib/use-media-query";

import type { Model3D } from "@/lib/models-3d";

export type Model3DKind = Model3D;

type Three = typeof THREE_NS;
type V2 = [number, number];

// ---------- Materiais ----------

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

/** Acrílico/plástico branco liso. */
function whitePlastic(THREE: Three) {
  return new THREE.MeshPhysicalMaterial({
    color: 0xfafafa,
    roughness: 0.28,
    metalness: 0,
    clearcoat: 0.6,
    clearcoatRoughness: 0.15,
    side: THREE.DoubleSide,
  });
}

// ---------- Peças reutilizáveis ----------

/** Sólido de revolução: perfil (raio, altura) em cm girado em torno do eixo vertical. */
function lathe(THREE: Three, profile: V2[], segments = 128) {
  return new THREE.LatheGeometry(
    profile.map(([r, h]) => new THREE.Vector2(r, h)),
    segments,
  );
}

/** Alça em "C" a partir de pontos (x, y) no plano lateral. */
function handle(THREE: Three, points: V2[], radius: number) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y]) => new THREE.Vector3(x, y, 0)));
  return new THREE.TubeGeometry(curve, 96, radius, 24, false);
}

// ---------- Modelos (medidas aproximadas em cm) ----------

/** Caneca de 325 ml: ~9,5 cm de altura e ~8,2 cm de diâmetro. */
function buildMug(THREE: Three) {
  const group = new THREE.Group();
  const material = ceramic(THREE);
  group.add(
    new THREE.Mesh(
      lathe(THREE, [
        [0, 0], [3.6, 0], [3.9, 0.12], [4.05, 0.45], [4.1, 1], [4.1, 9.25], [4.07, 9.42], [3.98, 9.5],
        [3.88, 9.47], [3.82, 9.3], [3.82, 0.9], [3.7, 0.7], [3.3, 0.62], [0, 0.6],
      ]),
      material,
    ),
  );
  group.add(
    new THREE.Mesh(
      handle(THREE, [[3.85, 7.9], [5.2, 8.15], [6.45, 7.4], [6.9, 5.6], [6.6, 3.7], [5.35, 2.55], [3.85, 2.7]], 0.5),
      material,
    ),
  );
  return group;
}

/** Xícara de café empilhável: corpo baixo, pé estreito e alça pequena. */
function buildCup(THREE: Three) {
  const group = new THREE.Group();
  const material = ceramic(THREE);
  group.add(
    new THREE.Mesh(
      lathe(THREE, [
        [0, 0], [2.6, 0], [2.75, 0.2], [2.85, 0.55], [3.2, 0.7], [3.9, 1.2], [4.2, 2], [4.3, 5.8], [4.28, 6.05],
        [4.18, 6.15], [4.06, 6.08], [4.02, 5.8], [3.95, 2], [3.6, 1.35], [3.1, 1.05], [0, 1],
      ]),
      material,
    ),
  );
  group.add(new THREE.Mesh(handle(THREE, [[4.1, 5.3], [5.3, 5.45], [6, 4.4], [5.65, 3.05], [4.15, 2.9]], 0.36), material));
  return group;
}

/** Taça de gin em acrílico: base, haste fina e bojo arredondado. */
function buildGoblet(THREE: Three) {
  const group = new THREE.Group();
  group.add(
    new THREE.Mesh(
      lathe(THREE, [
        [0, 0], [3.7, 0], [3.75, 0.15], [3.5, 0.4], [0.75, 0.65], [0.45, 1.1], [0.42, 8], [0.6, 8.5], [2.2, 9.3],
        [3.7, 11], [4.4, 13.4], [4.55, 15.4], [4.45, 17.4], [4.3, 18.5], [4.15, 18.5], [4.28, 17.4], [4.38, 15.4],
        [4.22, 13.5], [3.5, 11.2], [2.1, 9.7], [0.6, 9.1], [0, 9.05],
      ]),
      whitePlastic(THREE),
    ),
  );
  return group;
}

/** Garrafa/copo com tampa: corpo fosco com degradê de cor na parte de baixo e tampa colorida. */
function buildBottle(THREE: Three) {
  const group = new THREE.Group();
  const color = new THREE.Color(0x2f55d4); // azul (como a garrafa em destaque na foto)
  const body = lathe(THREE, [
    [0, 0], [3.1, 0], [3.25, 0.25], [3.3, 0.6], [3.62, 16.5], [3.62, 17], [3.5, 17], [3.2, 0.9], [0, 0.85],
  ]);
  // Degradê: cor sólida embaixo, fosco claro em cima
  const positions = body.getAttribute("position");
  const colors: number[] = [];
  const frosted = new THREE.Color(0xeef0f4);
  const mixed = new THREE.Color();
  for (let i = 0; i < positions.count; i++) {
    const t = positions.getY(i) / 17;
    const k = t < 0.25 ? 0 : t > 0.55 ? 1 : (t - 0.25) / 0.3;
    mixed.copy(color).lerp(frosted, k);
    colors.push(mixed.r, mixed.g, mixed.b);
  }
  body.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  group.add(
    new THREE.Mesh(
      body,
      new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.55, metalness: 0, side: THREE.DoubleSide }),
    ),
  );
  // Tampa: anel rosqueado + tampa inclinada (flip)
  const lidMaterial = new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.25,
    clearcoat: 0.8,
    transparent: true,
    opacity: 0.92,
  });
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(3.85, 3.85, 1.6, 96), lidMaterial);
  ring.position.y = 17.6;
  group.add(ring);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(3.75, 3.85, 1.4, 96), lidMaterial);
  cap.position.set(0, 19.05, 0);
  cap.rotation.z = -0.12;
  group.add(cap);
  const tab = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 1.2), lidMaterial);
  tab.position.set(-4.1, 18.9, 0);
  group.add(tab);
  return group;
}

/** Azulejo 20×20 cm em pé, com o suporte preto. */
function buildTile(THREE: Three) {
  const group = new THREE.Group();
  // Face esmaltada branca (um leve brilho próprio para não parecer cinza de frente)
  const face = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.12,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    emissive: 0xffffff,
    emissiveIntensity: 0.22,
  });
  const edge = new THREE.MeshStandardMaterial({ color: 0xc8a57a, roughness: 0.9 }); // borda de cerâmica crua
  const tile = new THREE.Mesh(new THREE.BoxGeometry(20, 20, 0.65), [edge, edge, edge, edge, face, face]);
  const tilt = 0.12; // levemente inclinado para trás, apoiado no suporte
  tile.position.set(0, 10.6, 0);
  tile.rotation.x = -tilt;
  group.add(tile);
  const black = new THREE.MeshStandardMaterial({ color: 0x1d1d1f, roughness: 0.6 });
  for (const x of [-7.5, 7.5]) {
    const front = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.6, 0.8), black);
    front.position.set(x, 0.8, 0.95);
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 3.6), black);
    base.position.set(x, 0.3, -0.4);
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.4, 0.8), black);
    back.position.set(x, 0.9, -1.8);
    group.add(front, base, back);
  }
  return group;
}

/** Blusa (camiseta) branca: silhueta com volume e bordas arredondadas. */
function buildShirt(THREE: Three) {
  const shape = new THREE.Shape();
  shape.moveTo(-8, 34);
  shape.lineTo(-17.5, 31.5);
  shape.lineTo(-27, 24);
  shape.lineTo(-23, 17);
  shape.lineTo(-18, 20.5);
  shape.lineTo(-18, 1);
  shape.quadraticCurveTo(-18, 0, -17, 0);
  shape.lineTo(17, 0);
  shape.quadraticCurveTo(18, 0, 18, 1);
  shape.lineTo(18, 20.5);
  shape.lineTo(23, 17);
  shape.lineTo(27, 24);
  shape.lineTo(17.5, 31.5);
  shape.lineTo(8, 34);
  shape.bezierCurveTo(6, 29.5, -6, 29.5, -8, 34); // gola
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 4,
    bevelEnabled: true,
    bevelThickness: 2,
    bevelSize: 1.4,
    bevelSegments: 8,
    curveSegments: 32,
  });
  geometry.translate(0, 0, -2);
  const fabric = new THREE.MeshPhysicalMaterial({
    color: 0xf6f6f6,
    roughness: 0.92,
    metalness: 0,
    sheen: 1,
    sheenRoughness: 0.6,
    sheenColor: new THREE.Color(0xffffff),
  });
  const group = new THREE.Group();
  group.add(new THREE.Mesh(geometry, fabric));
  return group;
}

const BUILDERS: Record<Model3DKind, (THREE: Three) => THREE_NS.Object3D> = {
  caneca: buildMug,
  xicara: buildCup,
  taca: buildGoblet,
  garrafa: buildBottle,
  azulejo: buildTile,
  blusa: buildShirt,
};

/** Monta o modelo, centraliza no ponto de giro e ajusta a escala para todos aparecerem do mesmo tamanho. */
function buildModel(THREE: Three, kind: Model3DKind) {
  const inner = BUILDERS[kind](THREE);
  const box = new THREE.Box3().setFromObject(inner);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  inner.position.sub(center);
  const scale = 11 / Math.max(size.x, size.y, size.z);
  const pivot = new THREE.Group();
  pivot.add(inner);
  pivot.scale.setScalar(scale);
  return {
    object: pivot,
    floorY: (-size.y / 2) * scale,
    footprint: Math.max(size.x, size.z) * scale,
  };
}

/** Sombra suave no "chão", feita com um gradiente (leve e sem custo de processamento). */
function softShadow(THREE: Three, y: number, footprint: number) {
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
    new THREE.PlaneGeometry(footprint * 1.45, footprint * 1.05),
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

        const { object, floorY, footprint } = buildModel(THREE, kind);
        scene.add(object);
        scene.add(softShadow(THREE, floorY, footprint));
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
