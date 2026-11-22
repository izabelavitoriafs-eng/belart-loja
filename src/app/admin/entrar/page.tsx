import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { getAdminUser, isAuthConfigured } from "@/lib/auth";

export const metadata: Metadata = { title: "Entrar no painel", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const configured = isAuthConfigured();
  if (configured && (await getAdminUser())) redirect("/admin/produtos");

  return (
    <div className="fundo-ameixa flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-[var(--radius-bloco)] bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <Image src="/belart-logo.png" alt="" width={56} height={56} className="size-14" />
          <div>
            <h1 className="text-2xl font-extrabold text-ameixa-900">Painel Belart</h1>
            <p className="text-sm text-tinta-suave">Acesso restrito</p>
          </div>
        </div>
        {configured ? (
          <LoginForm />
        ) : (
          <p className="rounded-2xl bg-sol-100 px-4 py-3 text-sm text-ameixa-950">
            O login ainda não foi configurado. Preencha as chaves do Supabase no arquivo <code>.env</code> e reinicie o
            site.
          </p>
        )}
        <p className="mt-6 text-xs text-tinta-suave">
          Esqueceu a senha? No computador do projeto, rode <code>npm run admin:criar</code> para definir uma nova.
        </p>
      </div>
    </div>
  );
}
