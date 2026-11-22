"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteProduct } from "@/app/admin/_actions/products";

export function DeleteProduct({ productId, name }: { productId: string; name: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
      >
        <Trash2 className="size-4" aria-hidden />
        Excluir produto
      </button>
    );
  }

  return (
    <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-900" role="alert">
      <p>
        Excluir <strong>{name}</strong> definitivamente? As fotos enviadas pelo painel também serão apagadas. Isso não
        pode ser desfeito. Se quiser só tirar da loja por um tempo, desmarque &quot;Disponível para venda&quot;.
      </p>
      {error && <p className="mt-2 font-semibold">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await deleteProduct(productId);
              if (!result.ok) return setError(result.error);
              router.push("/admin/produtos");
            })
          }
          className="rounded-full bg-red-600 px-4 py-2 font-bold text-white disabled:opacity-60"
        >
          {pending ? "Excluindo…" : "Excluir definitivamente"}
        </button>
        <button type="button" onClick={() => setConfirming(false)} className="rounded-full bg-white px-4 py-2 font-semibold ring-1 ring-red-200">
          Cancelar
        </button>
      </div>
    </div>
  );
}
