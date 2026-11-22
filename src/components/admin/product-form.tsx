"use client";

// Formulário de produto do painel: dados básicos, variações e personalização.
// As fotos são gerenciadas logo abaixo, no gerenciador de imagens (depois de salvar).
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { saveProduct, type ProductInput } from "@/app/admin/_actions/products";
import { MODELOS_3D, MODELOS_3D_NOMES } from "@/lib/models-3d";

type OptionState = { key: string; name: string; values: { key: string; label: string; priceDelta: string; available: boolean }[] };
type CustomizationState = {
  key: string;
  label: string;
  type: "TEXT" | "LONG_TEXT" | "SELECT" | "IMAGE_LINK";
  required: boolean;
  maxLength: string;
  choices: string;
  priceDelta: string;
};

export type ProductFormInitial = {
  name: string;
  slug: string;
  categoryId: string;
  price: string;
  description: string;
  available: boolean;
  featured: boolean;
  bestseller: boolean;
  productionTime: string;
  model3d: string;
  options: { name: string; values: { label: string; priceDelta: number; available: boolean }[] }[];
  customizations: {
    label: string;
    type: CustomizationState["type"];
    required: boolean;
    maxLength: number | null;
    choices: string[];
    priceDelta: number;
  }[];
};

const TYPE_LABELS: Record<CustomizationState["type"], string> = {
  TEXT: "Texto curto",
  LONG_TEXT: "Texto longo",
  SELECT: "Lista de opções",
  IMAGE_LINK: "Link (imagem, inspiração)",
};

let keySeq = 0;
const newKey = () => `k${++keySeq}`;
/** "35,90" → 35.9; vazio → valor padrão; texto inválido → NaN (o servidor mostra a mensagem). */
const toNumber = (text: string, empty: number) => (text.trim() === "" ? empty : Number(text.trim().replace(",", ".")));

const input =
  "h-11 w-full rounded-2xl border border-lilas-300 bg-white px-4 text-[0.95rem] focus:border-ameixa-700 focus:outline-none";
const label = "grid gap-1.5 text-sm font-semibold text-tinta";

export function ProductForm({
  productId,
  categories,
  initial,
}: {
  productId: string | null;
  categories: { id: string; name: string }[];
  initial: ProductFormInitial;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "ok" | "erro"; text: string } | null>(null);

  const [basic, setBasic] = useState({
    name: initial.name,
    slug: initial.slug,
    categoryId: initial.categoryId || categories[0]?.id || "",
    price: initial.price,
    description: initial.description,
    available: initial.available,
    featured: initial.featured,
    bestseller: initial.bestseller,
    productionTime: initial.productionTime,
    model3d: initial.model3d,
  });
  const [options, setOptions] = useState<OptionState[]>(() =>
    initial.options.map((o) => ({
      key: newKey(),
      name: o.name,
      values: o.values.map((v) => ({ key: newKey(), label: v.label, priceDelta: String(v.priceDelta || ""), available: v.available })),
    })),
  );
  const [customizations, setCustomizations] = useState<CustomizationState[]>(() =>
    initial.customizations.map((c) => ({
      key: newKey(),
      label: c.label,
      type: c.type,
      required: c.required,
      maxLength: c.maxLength ? String(c.maxLength) : "",
      choices: c.choices.join(", "),
      priceDelta: String(c.priceDelta || ""),
    })),
  );

  const set = <K extends keyof typeof basic>(field: K, value: (typeof basic)[K]) =>
    setBasic((b) => ({ ...b, [field]: value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const payload: ProductInput = {
      ...basic,
      price: toNumber(basic.price, Number.NaN),
      options: options.map((o) => ({
        name: o.name,
        values: o.values.map((v) => ({ label: v.label, priceDelta: toNumber(v.priceDelta, 0), available: v.available })),
      })),
      customizations: customizations.map((c) => ({
        label: c.label,
        type: c.type,
        required: c.required,
        maxLength: c.maxLength.trim() && c.type !== "SELECT" && c.type !== "IMAGE_LINK" ? toNumber(c.maxLength, 0) : null,
        choices: c.type === "SELECT" ? c.choices.split(",").map((s) => s.trim()).filter(Boolean) : [],
        priceDelta: toNumber(c.priceDelta, 0),
      })),
    };
    startTransition(async () => {
      const result = await saveProduct(productId, payload);
      if (!result.ok) {
        setMessage({ type: "erro", text: result.error });
        return;
      }
      if (!productId) {
        router.push(`/admin/produtos/${result.id}?criado=1`);
      } else {
        setMessage({ type: "ok", text: "Alterações salvas. A loja já foi atualizada." });
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-6" noValidate>
      {/* ---------- Dados básicos ---------- */}
      <section className="grid gap-4 rounded-3xl bg-white p-6 ring-1 ring-lilas-200">
        <h2 className="text-xl font-bold text-ameixa-900">Dados do produto</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className={`${label} md:col-span-2`}>
            Nome
            <input className={input} value={basic.name} onChange={(e) => set("name", e.target.value)} required maxLength={120} />
          </label>
          <label className={label}>
            Categoria
            <select className={input} value={basic.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className={label}>
            Preço (R$)
            <input
              className={input}
              inputMode="decimal"
              value={basic.price}
              onChange={(e) => set("price", e.target.value)}
              placeholder="35,00"
              required
            />
          </label>
          <label className={`${label} md:col-span-2`}>
            Descrição
            <textarea
              className={`${input} h-auto py-3`}
              rows={5}
              value={basic.description}
              onChange={(e) => set("description", e.target.value)}
              maxLength={5000}
            />
          </label>
          <label className={label}>
            Prazo de produção <span className="font-normal text-tinta-suave">(opcional)</span>
            <input
              className={input}
              value={basic.productionTime}
              onChange={(e) => set("productionTime", e.target.value)}
              placeholder="Ex.: 3 a 5 dias úteis"
              maxLength={80}
            />
          </label>
          <label className={label}>
            Visualização 3D
            <select className={input} value={basic.model3d} onChange={(e) => set("model3d", e.target.value)}>
              <option value="">Sem 3D</option>
              {MODELOS_3D.map((m) => (
                <option key={m} value={m}>
                  {MODELOS_3D_NOMES[m]}
                </option>
              ))}
            </select>
          </label>
          <label className={`${label} md:col-span-2`}>
            Endereço da página <span className="font-normal text-tinta-suave">(opcional — gerado a partir do nome)</span>
            <span className="flex items-center gap-2">
              <span className="text-sm font-normal text-tinta-suave">/produto/</span>
              <input
                className={input}
                value={basic.slug}
                onChange={(e) => set("slug", e.target.value)}
                placeholder="caneca-branca-personalizada"
                maxLength={120}
              />
            </span>
          </label>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3 pt-2">
          <Toggle checked={basic.available} onChange={(v) => set("available", v)} label="Disponível para venda" />
          <Toggle checked={basic.featured} onChange={(v) => set("featured", v)} label="Destaque na página inicial" />
          <Toggle checked={basic.bestseller} onChange={(v) => set("bestseller", v)} label="Mais vendido" />
        </div>
      </section>

      {/* ---------- Variações ---------- */}
      <section className="grid gap-4 rounded-3xl bg-white p-6 ring-1 ring-lilas-200">
        <div>
          <h2 className="text-xl font-bold text-ameixa-900">Variações</h2>
          <p className="text-sm text-tinta-suave">
            Escolhas do cliente, como cor, tamanho ou capacidade. Só aparecem na loja as variações cadastradas aqui.
          </p>
        </div>
        {options.map((option, oi) => (
          <div key={option.key} className="grid gap-3 rounded-2xl bg-lilas-50 p-4 ring-1 ring-lilas-200">
            <div className="flex items-end gap-3">
              <label className={`${label} flex-1`}>
                Nome da variação
                <input
                  className={input}
                  value={option.name}
                  placeholder="Ex.: Cor"
                  onChange={(e) =>
                    setOptions((list) => list.map((o, i) => (i === oi ? { ...o, name: e.target.value } : o)))
                  }
                />
              </label>
              <IconButton label="Remover variação" onClick={() => setOptions((list) => list.filter((_, i) => i !== oi))} />
            </div>
            {option.values.map((value, vi) => {
              const update = (patch: Partial<typeof value>) =>
                setOptions((list) =>
                  list.map((o, i) =>
                    i === oi ? { ...o, values: o.values.map((v, j) => (j === vi ? { ...v, ...patch } : v)) } : o,
                  ),
                );
              return (
                <div key={value.key} className="flex flex-wrap items-end gap-3 pl-2">
                  <label className={`${label} min-w-40 flex-1`}>
                    Opção
                    <input className={input} value={value.label} placeholder="Ex.: Branca" onChange={(e) => update({ label: e.target.value })} />
                  </label>
                  <label className={`${label} w-32`}>
                    Acréscimo (R$)
                    <input
                      className={input}
                      inputMode="decimal"
                      value={value.priceDelta}
                      placeholder="0"
                      onChange={(e) => update({ priceDelta: e.target.value })}
                    />
                  </label>
                  <div className="pb-2.5">
                    <Toggle checked={value.available} onChange={(v) => update({ available: v })} label="Disponível" />
                  </div>
                  <IconButton
                    label="Remover opção"
                    onClick={() =>
                      setOptions((list) =>
                        list.map((o, i) => (i === oi ? { ...o, values: o.values.filter((_, j) => j !== vi) } : o)),
                      )
                    }
                  />
                </div>
              );
            })}
            <button
              type="button"
              className="justify-self-start text-sm font-semibold text-ameixa-700 hover:underline"
              onClick={() =>
                setOptions((list) =>
                  list.map((o, i) =>
                    i === oi ? { ...o, values: [...o.values, { key: newKey(), label: "", priceDelta: "", available: true }] } : o,
                  ),
                )
              }
            >
              + Adicionar opção
            </button>
          </div>
        ))}
        <button
          type="button"
          className="btn-contorno justify-self-start text-ameixa-800 hover:bg-lilas-50"
          onClick={() =>
            setOptions((list) => [
              ...list,
              { key: newKey(), name: "", values: [{ key: newKey(), label: "", priceDelta: "", available: true }] },
            ])
          }
        >
          <Plus className="size-4" aria-hidden />
          Adicionar variação
        </button>
      </section>

      {/* ---------- Personalização ---------- */}
      <section className="grid gap-4 rounded-3xl bg-white p-6 ring-1 ring-lilas-200">
        <div>
          <h2 className="text-xl font-bold text-ameixa-900">Personalização</h2>
          <p className="text-sm text-tinta-suave">Campos que o cliente preenche ao pedir (vão na mensagem do WhatsApp).</p>
        </div>
        {customizations.map((c, ci) => {
          const update = (patch: Partial<CustomizationState>) =>
            setCustomizations((list) => list.map((x, i) => (i === ci ? { ...x, ...patch } : x)));
          return (
            <div key={c.key} className="grid gap-3 rounded-2xl bg-lilas-50 p-4 ring-1 ring-lilas-200 md:grid-cols-2">
              <label className={`${label} md:col-span-2`}>
                Título do campo
                <input
                  className={input}
                  value={c.label}
                  placeholder="Ex.: Nos conte o que você está pensando"
                  onChange={(e) => update({ label: e.target.value })}
                />
              </label>
              <label className={label}>
                Tipo
                <select className={input} value={c.type} onChange={(e) => update({ type: e.target.value as CustomizationState["type"] })}>
                  {Object.entries(TYPE_LABELS).map(([value, text]) => (
                    <option key={value} value={value}>
                      {text}
                    </option>
                  ))}
                </select>
              </label>
              {c.type === "SELECT" ? (
                <label className={label}>
                  Opções <span className="font-normal text-tinta-suave">(separadas por vírgula)</span>
                  <input className={input} value={c.choices} placeholder="Ex.: Cursiva, Bastão" onChange={(e) => update({ choices: e.target.value })} />
                </label>
              ) : c.type === "IMAGE_LINK" ? (
                <div />
              ) : (
                <label className={label}>
                  Limite de caracteres <span className="font-normal text-tinta-suave">(opcional)</span>
                  <input className={input} inputMode="numeric" value={c.maxLength} placeholder="Ex.: 500" onChange={(e) => update({ maxLength: e.target.value })} />
                </label>
              )}
              <label className={label}>
                Acréscimo no preço (R$)
                <input className={input} inputMode="decimal" value={c.priceDelta} placeholder="0" onChange={(e) => update({ priceDelta: e.target.value })} />
              </label>
              <div className="flex items-end justify-between gap-3 pb-1">
                <Toggle checked={c.required} onChange={(v) => update({ required: v })} label="Obrigatório" />
                <IconButton label="Remover campo" onClick={() => setCustomizations((list) => list.filter((_, i) => i !== ci))} />
              </div>
            </div>
          );
        })}
        <button
          type="button"
          className="btn-contorno justify-self-start text-ameixa-800 hover:bg-lilas-50"
          onClick={() =>
            setCustomizations((list) => [
              ...list,
              { key: newKey(), label: "", type: "LONG_TEXT", required: false, maxLength: "", choices: "", priceDelta: "" },
            ])
          }
        >
          <Plus className="size-4" aria-hidden />
          Adicionar campo
        </button>
      </section>

      {/* ---------- Salvar ---------- */}
      <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-4 rounded-3xl bg-white/95 p-4 shadow-xl ring-1 ring-lilas-200 backdrop-blur">
        <button type="submit" disabled={pending} className="btn-sol disabled:opacity-60">
          <Check className="size-5" aria-hidden />
          {pending ? "Salvando…" : productId ? "Salvar alterações" : "Criar produto"}
        </button>
        {message && (
          <p role={message.type === "erro" ? "alert" : "status"} className={message.type === "erro" ? "text-sm text-red-700" : "text-sm text-emerald-700"}>
            {message.text}
          </p>
        )}
        {!productId && !message && <p className="text-sm text-tinta-suave">Depois de criar, você poderá enviar as fotos.</p>}
      </div>
    </form>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-5 accent-ameixa-800" />
      {label}
    </label>
  );
}

function IconButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex size-11 shrink-0 items-center justify-center rounded-full text-red-700 hover:bg-red-50"
    >
      <Trash2 className="size-5" aria-hidden />
    </button>
  );
}
