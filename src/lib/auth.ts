import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** E-mails autorizados no painel (variável ADMIN_EMAILS, separados por vírgula). */
export function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined) {
  return !!email && adminEmails().includes(email.toLowerCase());
}

/** Usuário logado e autorizado, ou null. */
export async function getAdminUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser(); // valida a sessão no Supabase (não confia só no cookie)
  return user && isAdminEmail(user.email) ? user : null;
}

/**
 * Exige um administrador logado. Usado em TODAS as páginas e ações do painel:
 * mesmo que alguém chame uma ação diretamente, ela é recusada sem login válido.
 */
export async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/entrar");
  return user;
}
