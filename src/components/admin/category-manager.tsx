"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Check, Plus, Trash2 } from "lucide-react";
import { createCategory, deleteCategory, moveCategory, updateCategory } from "@/app/admin/_actions/store";

type Category = { id: string; name: string; description: string; active: boolean; slug: string; products: number };

const input =
  "h-10 w-full rounded-xl border border-lilas-300 bg-white px-3 text-sm focus:border-ameixa-700 focus:outline-none";

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "ok" | "erro"; text: string } | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Pick<Category, "name" | "description" | "active">>>({});
  const [confirm, setConfirm] = useState<string | null>(null);
  const [novo, setNovo] = useState({ name: "", description: "", active: true });

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, success: string) =>
    startTransition(async () => {
      const result = await fn();
      setMessage(result.ok ? { type: "ok", text: success } : { type: "erro", text: result.error ?? "Erro." });
      if (result.ok) router.refresh();
    });

  return (
    <div className="grid gap-6">
      {message && (
        <p role={message.type === "erro" ? "alert" : "status"} className={`rounded-2xl px-4 py-3 text-sm ${message.type === "erro" ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800"}`}>
          {message.text}
        </p>
      )}

      <ul className="grid gap-3">
        {categories.map((c, i) => {
          const draft = drafts[c.id] ?? { name: c.name, description: c.description, active: c.active };
          const changed = draft.name !== c.name || draft.description !== c.description || draft.active !== c.active;
          const setDraft = (patch: Partial<typeof draft>) => setDrafts((d) => ({ ...d, [c.id]: { ...draft, ...patch } }));
          return (
            <li key={c.id} className="grid gap-3 rounded-3xl bg-white p-4 ring-1 ring-lilas-200 md:grid-cols-[auto_1fr_2fr_auto] md:items-center">
              <div className="flex gap-1 md:flex-col">
                <button type="button" aria-label={`Subir ${c.name}`} disabled={pending || i === 0} onClick={() => run(() => moveCategory(c.id, -1), "Ordem atualizada.")} className="flex size-8 items-center justify-center rounded-full text-ameixa-800 hover:bg-lilas-50 disabled:opacity-30">
                  <ArrowUp className="size-4" />
                </button>
                <button type="button" aria-label={`Descer ${c.name}`} disabled={pending || i === categories.length - 1} onClick={() => run(() => moveCategory(c.id, 1), "Ordem atualizada.")} className="flex size-8 items-center justify-center rounded-full text-ameixa-800 hover:bg-lilas-50 disabled:opacity-30">
                  <ArrowDown className="size-4" />
                </button>
              </div>
              <label className="text-xs font-semibold text-tinta-suave">
                Nome · <span className="font-normal">/categoria/{c.slug} · {c.products} produto(s)</span>
                <input className={`${input} mt-1`} value={draft.name} onChange={(e) => setDraft({ name: e.target.value })} maxLength={40} />
              </label>
              <label className="text-xs font-semibold text-tinta-suave">
                Descrição
                <input className={`${input} mt-1`} value={draft.description} onChange={(e) => setDraft({ description: e.target.value })} maxLength={300} />
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ active: e.target.checked })} className="size-5 accent-ameixa-800" />
                  Visível
                </label>
                <button
                  type="button"
                  disabled={!changed || pending}
                  onClick={() => run(() => updateCategory(c.id, draft), "Categoria salva.")}
                  aria-label={`Salvar ${c.name}`}
                  className="flex size-9 items-center justify-center rounded-full bg-ameixa-800 text-white disabled:opacity-30"
                >
                  <Check className="size-4" />
                </button>
                {confirm === c.id ? (
                  <>
                    <button type="button" onClick={() => { setConfirm(null); run(() => deleteCategory(c.id), "Categoria excluída."); }} className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-bold text-white">
                      Excluir
                    </button>
                    <button type="button" onClick={() => setConfirm(null)} className="rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-lilas-300">
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button type="button" aria-label={`Excluir ${c.name}`} disabled={pending} onClick={() => setConfirm(c.id)} className="flex size-9 items-center justify-center rounded-full text-red-700 hover:bg-red-50 disabled:opacity-30">
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => {
            const r = await createCategory(novo);
            if (r.ok) setNovo({ name: "", description: "", active: true });
            return r;
          }, "Categoria criada.");
        }}
        className="grid gap-3 rounded-3xl bg-white p-4 ring-1 ring-lilas-200 md:grid-cols-[1fr_2fr_auto] md:items-end"
      >
        <label className="text-xs font-semibold text-tinta-suave">
          Nova categoria
          <input className={`${input} mt-1`} value={novo.name} onChange={(e) => setNovo({ ...novo, name: e.target.value })} placeholder="Ex.: Chaveiros" maxLength={40} />
        </label>
        <label className="text-xs font-semibold text-tinta-suave">
          Descrição
          <input className={`${input} mt-1`} value={novo.description} onChange={(e) => setNovo({ ...novo, description: e.target.value })} maxLength={300} />
        </label>
        <button type="submit" disabled={pending || !novo.name.trim()} className="btn-sol h-10 py-0 disabled:opacity-50">
          <Plus className="size-4" aria-hidden />
          Criar
        </button>
      </form>
    </div>
  );
}
