import "server-only";
import { randomUUID } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Fotos enviadas pelo painel ficam no Supabase Storage, no "balde" (bucket)
// público "produtos". O bucket é criado automaticamente no primeiro envio.
export const BUCKET = "produtos";

let bucketChecked = false;

async function ensureBucket() {
  if (bucketChecked) return;
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (!data) {
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: "10MB",
      allowedMimeTypes: ["image/webp"],
    });
    if (error && !/already exists/i.test(error.message)) throw new Error(`Não foi possível criar o armazenamento de fotos: ${error.message}`);
  }
  bucketChecked = true;
}

/** Envia uma foto já processada (WEBP) e devolve o endereço público. */
export async function uploadProductImage(productId: string, folder: "galeria" | "360", buffer: Buffer) {
  await ensureBucket();
  const supabase = createSupabaseAdminClient();
  const path = `${productId}/${folder}/${Date.now()}-${randomUUID().slice(0, 8)}.webp`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: "image/webp",
    cacheControl: "31536000", // 1 ano: cada foto nova tem um nome novo
    upsert: false,
  });
  if (error) throw new Error(`Falha ao enviar a foto: ${error.message}`);
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Caminho dentro do bucket, se a URL for de uma foto enviada pelo painel. */
function storagePath(url: string) {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  return i >= 0 ? decodeURIComponent(url.slice(i + marker.length)) : null;
}

/**
 * Apaga do Storage as fotos enviadas pelo painel. Fotos da pasta public/produtos
 * (cadastradas pelo VS Code) não são apagadas — continuam no projeto.
 */
export async function deleteStoredImages(urls: string[]) {
  const paths = urls.map(storagePath).filter((p): p is string => !!p);
  if (paths.length === 0) return;
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) console.error("Falha ao apagar fotos do Storage:", error.message);
}
