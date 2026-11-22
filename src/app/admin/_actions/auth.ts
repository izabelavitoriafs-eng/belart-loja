"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth";

export type LoginState = { error?: string };

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe a senha."),
});

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return { error: "O login ainda não foi configurado (chaves do Supabase no .env)." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  // Mensagem genérica: não revela se o e-mail existe
  if (error) {
    if (/rate|too many/i.test(error.message)) return { error: "Muitas tentativas. Aguarde alguns minutos e tente de novo." };
    return { error: "E-mail ou senha incorretos." };
  }
  if (!isAdminEmail(parsed.data.email)) {
    await supabase.auth.signOut();
    return { error: "Este e-mail não tem acesso ao painel." };
  }
  redirect("/admin/produtos");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/entrar");
}
