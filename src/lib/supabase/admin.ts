import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com a chave SECRETA — só existe no servidor.
 * Usado para enviar e apagar fotos no Storage. Nunca importe este arquivo
 * em componentes do navegador ("use client"): o "server-only" impede isso.
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    throw new Error("Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY no .env para enviar fotos.");
  }
  return createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
}
