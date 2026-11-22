"use server";

// Ações do painel para categorias e dados da loja.
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { CATALOG_TAG, SETTINGS_TAG, STORE_SETTING_KEYS } from "@/lib/catalog";
import type { ActionResult } from "./products";

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function refreshCatalog() {
  revalidateTag(CATALOG_TAG);
  revalidatePath("/admin/categorias");
  revalidatePath("/", "layout"); // menu e rodapé listam as categorias
}

// ---------- Categorias ----------

const categorySchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da categoria.").max(40),
  description: z.string().trim().max(300),
  active: z.boolean(),
});

export async function createCategory(input: z.input<typeof categorySchema>): Promise<ActionResult> {
  await requireAdmin();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const base = slugify(parsed.data.name) || "categoria";
  let slug = base;
  for (let n = 2; await prisma.category.findUnique({ where: { slug }, select: { id: true } }); n++) slug = `${base}-${n}`;
  const last = await prisma.category.findFirst({ orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
  await prisma.category.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      active: parsed.data.active,
      slug,
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
  });
  refreshCatalog();
  return { ok: true };
}

export async function updateCategory(id: string, input: z.input<typeof categorySchema>): Promise<ActionResult> {
  await requireAdmin();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  // O endereço (slug) não muda ao renomear, para não quebrar links já compartilhados
  await prisma.category.update({
    where: { id },
    data: { name: parsed.data.name, description: parsed.data.description || null, active: parsed.data.active },
  });
  refreshCatalog();
  return { ok: true };
}

export async function moveCategory(id: string, direction: -1 | 1): Promise<ActionResult> {
  await requireAdmin();
  const list = await prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true } });
  const index = list.findIndex((c) => c.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= list.length) return { ok: true };
  [list[index], list[target]] = [list[target], list[index]];
  await prisma.$transaction(list.map((c, i) => prisma.category.update({ where: { id: c.id }, data: { sortOrder: i } })));
  refreshCatalog();
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  await requireAdmin();
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) {
    return { ok: false, error: `Esta categoria tem ${count} produto(s). Mova ou exclua os produtos antes, ou apenas desative a categoria.` };
  }
  await prisma.category.delete({ where: { id } });
  refreshCatalog();
  return { ok: true };
}

// ---------- Dados da loja ----------

const settingsSchema = z.object({
  email: z.string().trim().email("E-mail inválido.").or(z.literal("")),
  horario: z.string().trim().max(120),
  retirada: z.string().trim().max(300),
  entregaUber: z.string().trim().max(500),
});

export async function saveSettings(input: z.input<typeof settingsSchema>): Promise<ActionResult> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  await prisma.$transaction(
    STORE_SETTING_KEYS.map((key) =>
      prisma.storeSetting.upsert({
        where: { key },
        update: { value: parsed.data[key] },
        create: { key, value: parsed.data[key] },
      }),
    ),
  );
  revalidateTag(SETTINGS_TAG);
  revalidatePath("/", "layout");
  return { ok: true };
}
