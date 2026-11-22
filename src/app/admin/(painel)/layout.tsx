import type { Metadata } from "next";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { signOut } from "@/app/admin/_actions/auth";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = {
  title: { default: "Painel", template: "%s | Painel Belart" },
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  return (
    <div className="min-h-dvh bg-lilas-50 md:grid md:grid-cols-[15rem_1fr]">
      <aside className="fundo-ameixa flex flex-col gap-6 p-4 text-white md:sticky md:top-0 md:h-dvh md:p-5">
        <div className="flex items-center gap-3">
          <Image src="/belart-logo.png" alt="" width={44} height={44} className="size-11" />
          <div className="leading-tight">
            <p className="font-display text-lg font-extrabold">Painel Belart</p>
            <p className="max-w-[10rem] truncate text-xs text-lilas-200" title={user.email}>
              {user.email}
            </p>
          </div>
        </div>
        <AdminNav />
        <form action={signOut} className="md:mt-auto">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold text-lilas-100 hover:bg-white/10"
          >
            <LogOut aria-hidden className="size-5" />
            Sair
          </button>
        </form>
      </aside>
      <main className="min-w-0 p-4 md:p-8">{children}</main>
    </div>
  );
}
