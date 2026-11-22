"use client";

// Gerenciador de fotos do produto no painel.
// - Galeria: enviar várias fotos, reordenar (a primeira é a capa), editar o texto
//   alternativo, substituir e excluir.
// - Giro 360°: enviar a sequência (usa a ordem dos nomes: 01, 02, 03…) ou remover.
// Antes do envio, fotos grandes são reduzidas no próprio navegador (envio rápido);
// no servidor, cada foto é padronizada (quadrado 1600 px, fundo uniforme, WEBP).
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, RefreshCw, Trash2, Upload } from "lucide-react";
import { clearSpin, deleteImage, reorderGallery, updateImageAlt, uploadImage } from "@/app/admin/_actions/products";

type Img = { id: string; url: string; alt: string };

const MIN_SPIN = 8;

/** Reduz a foto para no máximo 2400 px (JPEG) antes de enviar. */
async function prepareFile(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 4_000_000) {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff"; // fundo branco para PNG transparente
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return await new Promise((resolve) => canvas.toBlob((b) => resolve(b ?? file), "image/jpeg", 0.92));
  } catch {
    return file; // formato que o navegador não abre: o servidor tenta processar
  }
}

async function send(productId: string, kind: "GALLERY" | "SPIN", file: File, sortOrder?: number) {
  const fd = new FormData();
  fd.append("file", await prepareFile(file), file.name.replace(/\.\w+$/, ".jpg"));
  if (sortOrder !== undefined) fd.append("sortOrder", String(sortOrder));
  return uploadImage(productId, kind, fd);
}

export function ImageManager({ productId, gallery: initialGallery, spin: initialSpin }: { productId: string; gallery: Img[]; spin: Img[] }) {
  const router = useRouter();
  const [gallery, setGallery] = useState(initialGallery);
  const [spin, setSpin] = useState(initialSpin);
  const [busy, setBusy] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [confirm, setConfirm] = useState<string | null>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const spinInput = useRef<HTMLInputElement>(null);
  const replaceInput = useRef<HTMLInputElement>(null);
  const replacingId = useRef<string | null>(null);

  const done = (errs: string[]) => {
    setErrors(errs);
    setBusy(null);
    router.refresh();
  };

  // ---------- Galeria ----------
  const addPhotos = async (files: File[]) => {
    const errs: string[] = [];
    const added: Img[] = [];
    for (const [i, file] of files.entries()) {
      setBusy(`Enviando foto ${i + 1} de ${files.length}…`);
      const result = await send(productId, "GALLERY", file);
      if (result.ok) added.push(result.image);
      else errs.push(result.error);
    }
    setGallery((g) => [...g, ...added]);
    done(errs);
  };

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= gallery.length) return;
    const next = [...gallery];
    [next[index], next[target]] = [next[target], next[index]];
    setGallery(next);
    setBusy("Salvando a ordem…");
    const result = await reorderGallery(productId, next.map((g) => g.id));
    done(result.ok ? [] : [result.error]);
  };

  const remove = async (id: string) => {
    setConfirm(null);
    setBusy("Excluindo foto…");
    const result = await deleteImage(id);
    if (result.ok) setGallery((g) => g.filter((x) => x.id !== id));
    done(result.ok ? [] : [result.error]);
  };

  const replace = async (file: File) => {
    const oldId = replacingId.current;
    if (!oldId) return;
    setBusy("Substituindo foto…");
    const result = await send(productId, "GALLERY", file);
    if (!result.ok) return done([result.error]);
    const next = gallery.map((g) => (g.id === oldId ? result.image : g));
    setGallery(next);
    await reorderGallery(productId, next.map((g) => g.id));
    await deleteImage(oldId);
    done([]);
  };

  const saveAlt = async (id: string, alt: string) => {
    const current = gallery.find((g) => g.id === id);
    if (!current || current.alt === alt) return;
    setGallery((g) => g.map((x) => (x.id === id ? { ...x, alt } : x)));
    const result = await updateImageAlt(id, alt);
    if (!result.ok) setErrors([result.error]);
  };

  // ---------- 360° ----------
  const uploadSpin = async (files: File[]) => {
    const sorted = [...files].sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { numeric: true }));
    if (sorted.length < MIN_SPIN) {
      setErrors([`A sequência 360° precisa de pelo menos ${MIN_SPIN} fotos (ideal: 24 a 36). Você escolheu ${sorted.length}.`]);
      return;
    }
    if (spin.length) {
      setBusy("Removendo a sequência anterior…");
      await clearSpin(productId);
    }
    const errs: string[] = [];
    const added: Img[] = [];
    for (const [i, file] of sorted.entries()) {
      setBusy(`Enviando quadro ${i + 1} de ${sorted.length}…`);
      const result = await send(productId, "SPIN", file, i);
      if (result.ok) added.push(result.image);
      else errs.push(result.error);
    }
    setSpin(added);
    done(errs);
  };

  const removeSpin = async () => {
    setConfirm(null);
    setBusy("Removendo a sequência 360°…");
    const result = await clearSpin(productId);
    if (result.ok) setSpin([]);
    done(result.ok ? [] : [result.error]);
  };

  const disabled = busy !== null;

  return (
    <section className="grid gap-6 rounded-3xl bg-white p-6 ring-1 ring-lilas-200" aria-busy={disabled}>
      <div>
        <h2 className="text-xl font-bold text-ameixa-900">Fotos</h2>
        <p className="text-sm text-tinta-suave">
          Cada foto é padronizada automaticamente: quadrada, 1600×1600 px, produto centralizado. Para um resultado
          uniforme, fotografe com fundo branco e a mesma luz. A primeira foto é a capa.
        </p>
      </div>

      {(busy || errors.length > 0) && (
        <div aria-live="polite">
          {busy && (
            <p className="flex items-center gap-2 rounded-2xl bg-lilas-50 px-4 py-3 text-sm font-medium text-ameixa-800">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {busy}
            </p>
          )}
          {errors.map((e) => (
            <p key={e} role="alert" className="mt-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
              {e}
            </p>
          ))}
        </div>
      )}

      {/* Galeria */}
      <div>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {gallery.map((img, i) => (
            <li key={img.id} className="grid gap-2 rounded-2xl bg-lilas-50 p-2 ring-1 ring-lilas-200">
              <div className="relative aspect-square overflow-hidden rounded-xl bg-white">
                <Image src={img.url} alt={img.alt} fill sizes="220px" className="object-contain" />
                {i === 0 && (
                  <span className="absolute top-2 left-2 rounded-full bg-sol-500 px-2.5 py-0.5 text-xs font-bold text-ameixa-950">
                    Capa
                  </span>
                )}
              </div>
              <label className="text-xs font-semibold text-tinta-suave">
                Descrição da foto
                <input
                  defaultValue={img.alt}
                  onBlur={(e) => saveAlt(img.id, e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-lilas-300 bg-white px-2 text-sm font-normal text-tinta focus:border-ameixa-700 focus:outline-none"
                />
              </label>
              {confirm === img.id ? (
                <div className="flex gap-2">
                  <button type="button" onClick={() => remove(img.id)} className="flex-1 rounded-xl bg-red-600 py-2 text-xs font-bold text-white">
                    Excluir
                  </button>
                  <button type="button" onClick={() => setConfirm(null)} className="flex-1 rounded-xl bg-white py-2 text-xs font-semibold ring-1 ring-lilas-300">
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex justify-between">
                  <SmallButton label="Mover para a esquerda" disabled={disabled || i === 0} onClick={() => move(i, -1)}>
                    <ArrowLeft className="size-4" />
                  </SmallButton>
                  <SmallButton
                    label="Substituir foto"
                    disabled={disabled}
                    onClick={() => {
                      replacingId.current = img.id;
                      replaceInput.current?.click();
                    }}
                  >
                    <RefreshCw className="size-4" />
                  </SmallButton>
                  <SmallButton label="Excluir foto" disabled={disabled} danger onClick={() => setConfirm(img.id)}>
                    <Trash2 className="size-4" />
                  </SmallButton>
                  <SmallButton label="Mover para a direita" disabled={disabled || i === gallery.length - 1} onClick={() => move(i, 1)}>
                    <ArrowRight className="size-4" />
                  </SmallButton>
                </div>
              )}
            </li>
          ))}
        </ul>
        <button type="button" disabled={disabled} onClick={() => galleryInput.current?.click()} className="btn-roxo mt-4 disabled:opacity-60">
          <Upload className="size-5" aria-hidden />
          Enviar fotos
        </button>
        <input
          ref={galleryInput}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            if (files.length) addPhotos(files);
          }}
        />
        <input
          ref={replaceInput}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) replace(file);
          }}
        />
      </div>

      {/* 360° */}
      <div className="rounded-2xl bg-lilas-50 p-4 ring-1 ring-lilas-200">
        <h3 className="font-bold text-ameixa-900">Giro 360° (opcional)</h3>
        <p className="mt-1 text-sm text-tinta-suave">
          Sequência de 24 a 36 fotos do produto girando no sentido horário, numeradas na ordem (01, 02, 03…). Mínimo de{" "}
          {MIN_SPIN} fotos.
        </p>
        {spin.length > 0 ? (
          <div className="mt-3">
            <p className="text-sm font-semibold">{spin.length} quadros cadastrados</p>
            <div className="mt-2 flex gap-1 overflow-x-auto">
              {spin.slice(0, 12).map((f) => (
                <span key={f.id} className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-white">
                  <Image src={f.url} alt="" fill sizes="48px" className="object-contain" />
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm">Nenhuma sequência cadastrada.</p>
        )}
        <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" disabled={disabled} onClick={() => spinInput.current?.click()} className="btn-contorno text-ameixa-800 hover:bg-white disabled:opacity-60">
            <Upload className="size-4" aria-hidden />
            {spin.length ? "Substituir sequência" : "Enviar sequência"}
          </button>
          {spin.length > 0 &&
            (confirm === "spin" ? (
              <>
                <button type="button" onClick={removeSpin} className="rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white">
                  Confirmar remoção
                </button>
                <button type="button" onClick={() => setConfirm(null)} className="rounded-full bg-white px-4 py-2 text-sm font-semibold ring-1 ring-lilas-300">
                  Cancelar
                </button>
              </>
            ) : (
              <button type="button" disabled={disabled} onClick={() => setConfirm("spin")} className="rounded-full px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">
                Remover 360°
              </button>
            ))}
        </div>
        <input
          ref={spinInput}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            if (files.length) uploadSpin(files);
          }}
        />
      </div>
    </section>
  );
}

function SmallButton({
  label,
  onClick,
  disabled,
  danger = false,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`flex size-9 items-center justify-center rounded-full disabled:opacity-30 ${
        danger ? "text-red-700 hover:bg-red-50" : "text-ameixa-800 hover:bg-white"
      }`}
    >
      {children}
    </button>
  );
}
