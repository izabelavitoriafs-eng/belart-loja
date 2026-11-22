"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { signIn, type LoginState } from "@/app/admin/_actions/auth";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, {});

  return (
    <form action={action} className="grid gap-4" noValidate>
      <label className="grid gap-1.5 text-sm font-semibold">
        E-mail
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          className="h-12 rounded-2xl border border-lilas-300 bg-white px-4 text-base font-normal focus:border-ameixa-700 focus:outline-none"
        />
      </label>
      <label className="grid gap-1.5 text-sm font-semibold">
        Senha
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-12 rounded-2xl border border-lilas-300 bg-white px-4 text-base font-normal focus:border-ameixa-700 focus:outline-none"
        />
      </label>
      {state.error && (
        <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-roxo mt-2 h-12 disabled:opacity-60">
        <LogIn className="size-5" aria-hidden />
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
