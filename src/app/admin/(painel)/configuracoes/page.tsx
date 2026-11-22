import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getStoreSettings } from "@/lib/catalog";
import { SettingsForm } from "@/components/admin/settings-form";
import { site } from "@/config/site";

export const metadata: Metadata = { title: "Dados da loja" };

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getStoreSettings();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-extrabold text-ameixa-900">Dados da loja</h1>
      <p className="mt-2 mb-6 text-sm text-tinta-suave">
        Aparecem no rodapé da loja e serão usados no fechamento do pedido. Deixe em branco o que ainda não estiver
        definido. WhatsApp ({site.whatsappDisplay}) e Instagram ({site.instagramHandle}) ficam em{" "}
        <code>src/config/site.ts</code>.
      </p>
      <SettingsForm initial={settings} />
    </div>
  );
}
