"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { saveSettings } from "@/app/admin/_actions/store";

type Settings = { email: string; horario: string; retirada: string; entregaUber: string };

const input =
  "w-full rounded-2xl border border-lilas-300 bg-white px-4 py-2.5 text-[0.95rem] font-normal focus:border-ameixa-700 focus:outline-none";

export function SettingsForm({ initial }: { initial: Settings }) {
  const [values, setValues] = useState(initial);
  const [message, setMessage] = useState<{ type: "ok" | "erro"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const set = (key: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await saveSettings(values);
          setMessage(result.ok ? { type: "ok", text: "Dados salvos. A loja já foi atualizada." } : { type: "erro", text: result.error });
        });
      }}
      className="grid gap-5 rounded-3xl bg-white p-6 ring-1 ring-lilas-200"
    >
      <label className="grid gap-1.5 text-sm font-semibold">
        E-mail de contato
        <input className={input} type="email" value={values.email} onChange={set("email")} placeholder="contato@exemplo.com" />
      </label>
      <label className="grid gap-1.5 text-sm font-semibold">
        Horário de atendimento
        <input className={input} value={values.horario} onChange={set("horario")} placeholder="Ex.: Segunda a sexta, das 9h às 18h" maxLength={120} />
      </label>
      <label className="grid gap-1.5 text-sm font-semibold">
        Retirada
        <textarea className={input} rows={2} value={values.retirada} onChange={set("retirada")} placeholder="Ex.: Retirada combinada no bairro X, em BH" maxLength={300} />
      </label>
      <label className="grid gap-1.5 text-sm font-semibold">
        Entrega por Uber
        <textarea className={input} rows={3} value={values.entregaUber} onChange={set("entregaUber")} placeholder="Ex.: O valor da corrida é calculado no fechamento do pedido e pago pelo cliente" maxLength={500} />
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className="btn-sol disabled:opacity-60">
          <Check className="size-5" aria-hidden />
          {pending ? "Salvando…" : "Salvar"}
        </button>
        {message && (
          <p role={message.type === "erro" ? "alert" : "status"} className={message.type === "erro" ? "text-sm text-red-700" : "text-sm text-emerald-700"}>
            {message.text}
          </p>
        )}
      </div>
    </form>
  );
}
