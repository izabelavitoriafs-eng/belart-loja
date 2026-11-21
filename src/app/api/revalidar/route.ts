// Renova o cache do catálogo para que alterações no banco apareçam na hora.
// Usado pelo importador de catálogo (npm run catalogo:importar).
// O painel administrativo (etapa 3) chamará revalidateTag diretamente.
//
// Protegido por uma chave secreta: defina REVALIDATE_SECRET no .env.
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { CATALOG_TAG } from "@/lib/catalog";

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "REVALIDATE_SECRET não configurado no servidor." }, { status: 503 });
  }
  if (request.headers.get("x-revalidate-secret") !== secret) {
    return NextResponse.json({ ok: false, error: "Chave inválida." }, { status: 401 });
  }
  revalidateTag(CATALOG_TAG);
  return NextResponse.json({ ok: true, revalidated: CATALOG_TAG });
}
