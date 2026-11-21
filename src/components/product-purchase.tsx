"use client";

// Escolhas do cliente na página do produto: variações (cor, tamanho…),
// personalização, quantidade e pedido pelo WhatsApp com tudo preenchido.
// Só aparecem as variações e personalizações cadastradas para o produto.
// (O botão "Adicionar ao carrinho" entra na etapa 4, junto com o carrinho.)
import { useId, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import type { CustomizationData, ProductOptionData } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { whatsappLink } from "@/config/site";
import { WhatsAppIcon } from "@/components/brand-icons";

type Props = {
  name: string;
  basePrice: number;
  available: boolean;
  productUrl: string;
  options: ProductOptionData[];
  customizations: CustomizationData[];
};

const MAX_QTY = 99;

export function ProductPurchase({ name, basePrice, available, productUrl, options, customizations }: Props) {
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);

  // Variações: começa com a primeira opção disponível de cada uma
  const [selected, setSelected] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      options.map((o) => [o.id, (o.values.find((v) => v.available) ?? o.values[0])?.id ?? ""]),
    ),
  );
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const chosenValues = options.map((o) => ({ option: o, value: o.values.find((v) => v.id === selected[o.id]) }));
  const filledCustomizations = customizations.filter((c) => (texts[c.id] ?? "").trim() !== "");
  const unitPrice =
    basePrice +
    chosenValues.reduce((sum, { value }) => sum + (value?.priceDelta ?? 0), 0) +
    filledCustomizations.reduce((sum, c) => sum + c.priceDelta, 0);
  const total = unitPrice * quantity;

  const validate = () => {
    const found: Record<string, string> = {};
    for (const c of customizations) {
      const value = (texts[c.id] ?? "").trim();
      if (c.required && !value) found[c.id] = "Preencha este campo.";
      else if (c.maxLength && value.length > c.maxLength) found[c.id] = `Use no máximo ${c.maxLength} caracteres.`;
      else if (c.type === "IMAGE_LINK" && value && !/^https?:\/\/\S+$/i.test(value))
        found[c.id] = "Informe um link começando com http:// ou https://.";
    }
    setErrors(found);
    return found;
  };

  const sendToWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate();
    const firstInvalid = Object.keys(found)[0];
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`[data-field="${firstInvalid}"]`)?.focus();
      return;
    }
    const lines = [
      "Olá, Belart! Quero fazer um pedido:",
      "",
      `*${name}*`,
      ...chosenValues.filter(({ value }) => value).map(({ option, value }) => `${option.name}: ${value!.label}`),
      ...filledCustomizations.map((c) => `${c.label}: ${texts[c.id].trim()}`),
      `Quantidade: ${quantity}`,
      `Valor estimado: ${formatPrice(total)}`,
      "",
      productUrl,
    ];
    window.open(whatsappLink(lines.join("\n")), "_blank", "noopener,noreferrer");
  };

  return (
    <form ref={formRef} onSubmit={sendToWhatsApp} noValidate className="grid gap-6" aria-describedby={`${formId}-total`}>
      {/* Variações */}
      {options.map((option) => (
        <fieldset key={option.id}>
          <legend className="mb-2 text-sm font-semibold">
            {option.name}:{" "}
            <span className="font-normal text-tinta-suave">
              {option.values.find((v) => v.id === selected[option.id])?.label}
            </span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => {
              const checked = selected[option.id] === value.id;
              return (
                <label
                  key={value.id}
                  className={`relative cursor-pointer rounded-full border-2 px-4 py-2 text-sm font-medium transition has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-sol-500 ${
                    !value.available
                      ? "cursor-not-allowed border-dashed border-lilas-300 text-tinta-suave line-through"
                      : checked
                        ? "border-ameixa-800 bg-ameixa-800 text-white"
                        : "border-lilas-300 bg-white hover:border-ameixa-600"
                  }`}
                >
                  <input
                    type="radio"
                    name={`${formId}-${option.id}`}
                    value={value.id}
                    checked={checked}
                    disabled={!value.available || !available}
                    onChange={() => setSelected((s) => ({ ...s, [option.id]: value.id }))}
                    className="sr-only"
                  />
                  {value.label}
                  {value.priceDelta > 0 && <span className="ml-1 opacity-80">+{formatPrice(value.priceDelta)}</span>}
                  {!value.available && <span className="sr-only"> (indisponível)</span>}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}

      {/* Personalização */}
      {customizations.length > 0 && (
        <div className="grid gap-4 rounded-3xl bg-lilas-50 p-5 ring-1 ring-lilas-200">
          <p className="font-display text-lg font-bold text-ameixa-900">Personalização</p>
          {customizations.map((c) => {
            const id = `${formId}-${c.id}`;
            const value = texts[c.id] ?? "";
            const error = errors[c.id];
            const common = {
              id,
              "data-field": c.id,
              value,
              disabled: !available,
              required: c.required,
              "aria-invalid": error ? true : undefined,
              "aria-describedby": error ? `${id}-erro` : c.maxLength ? `${id}-limite` : undefined,
              maxLength: c.maxLength ?? undefined,
              onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
                setTexts((t) => ({ ...t, [c.id]: e.target.value }));
                if (errors[c.id])
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next[c.id];
                    return next;
                  });
              },
              className: `w-full rounded-2xl border bg-white px-4 py-3 text-[0.95rem] focus:outline-none ${
                error ? "border-red-600" : "border-lilas-300 focus:border-ameixa-700"
              }`,
            };
            return (
              <div key={c.id} className="grid gap-1.5">
                <label htmlFor={id} className="text-sm font-semibold">
                  {c.label}
                  {c.required ? <span className="text-red-700"> *</span> : <span className="font-normal text-tinta-suave"> (opcional)</span>}
                  {c.priceDelta > 0 && <span className="font-normal text-tinta-suave"> · +{formatPrice(c.priceDelta)}</span>}
                </label>
                {c.type === "LONG_TEXT" ? (
                  <textarea {...common} rows={4} placeholder="Ex.: nome, frase, cores, tema, ocasião…" />
                ) : c.type === "SELECT" ? (
                  <select {...common}>
                    <option value="">Escolha…</option>
                    {c.choices.map((choice) => (
                      <option key={choice} value={choice}>
                        {choice}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    {...common}
                    type={c.type === "IMAGE_LINK" ? "url" : "text"}
                    placeholder={c.type === "IMAGE_LINK" ? "https://… (Pinterest, Instagram, Google Drive…)" : undefined}
                  />
                )}
                {error ? (
                  <p id={`${id}-erro`} className="text-sm text-red-700">
                    {error}
                  </p>
                ) : (
                  c.maxLength && (
                    <p id={`${id}-limite`} className="text-xs text-tinta-suave">
                      {value.length}/{c.maxLength} caracteres
                    </p>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Quantidade */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span id={`${formId}-qtd`} className="mb-2 block text-sm font-semibold">
            Quantidade
          </span>
          <div className="flex items-center rounded-full border border-lilas-300 bg-white" role="group" aria-labelledby={`${formId}-qtd`}>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1 || !available}
              className="flex size-11 items-center justify-center rounded-full text-ameixa-800 hover:bg-lilas-50 disabled:opacity-40"
              aria-label="Diminuir quantidade"
            >
              <Minus className="size-4" aria-hidden />
            </button>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_QTY}
              value={quantity}
              disabled={!available}
              onChange={(e) => setQuantity(Math.min(MAX_QTY, Math.max(1, Number(e.target.value) || 1)))}
              className="w-12 bg-transparent text-center font-semibold [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
              aria-label="Quantidade"
            />
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(MAX_QTY, q + 1))}
              disabled={quantity >= MAX_QTY || !available}
              className="flex size-11 items-center justify-center rounded-full text-ameixa-800 hover:bg-lilas-50 disabled:opacity-40"
              aria-label="Aumentar quantidade"
            >
              <Plus className="size-4" aria-hidden />
            </button>
          </div>
        </div>
        <p id={`${formId}-total`} className="text-right" aria-live="polite">
          <span className="block text-sm text-tinta-suave">
            {quantity > 1 ? `${quantity} × ${formatPrice(unitPrice)}` : "Total"}
          </span>
          <span className="font-display text-2xl font-extrabold text-ameixa-800">{formatPrice(total)}</span>
        </p>
      </div>

      {available ? (
        <button type="submit" className="btn-sol w-full py-4 text-base">
          <WhatsAppIcon className="size-5" />
          Fazer pedido pelo WhatsApp
        </button>
      ) : (
        <a
          href={whatsappLink(`Olá, Belart! O produto "${name}" vai voltar a ficar disponível? ${productUrl}`)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-roxo w-full py-4 text-base"
        >
          <WhatsAppIcon className="size-5" />
          Perguntar quando volta
        </a>
      )}
      <p className="-mt-3 text-center text-xs text-tinta-suave">
        O pedido é confirmado pela Belart no WhatsApp, com valores e prazo finais.
      </p>
    </form>
  );
}
