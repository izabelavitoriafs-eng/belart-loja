"use server";

// Ações do painel para produtos e fotos. Todas exigem administrador logado,
// validam os dados no servidor e renovam o cache da loja ao terminar.
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { CATALOG_TAG, MODELOS_3D } from "@/lib/catalog";
import { processSpinFrame, standardizeGalleryImage } from "@/lib/image-processing";
import { deleteStoredImages, uploadProductImage } from "@/lib/storage";

export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const money = z
  .number({ invalid_type_error: "Informe valores numéricos nos acréscimos (ex.: 5 ou 5,50)." })
  .min(0, "Valor não pode ser negativo.")
  .max(100000, "Valor muito alto.");

const productSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do produto.").max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Endereço inválido: use só letras minúsculas, números e hífens.")
    .max(120)
    .or(z.literal("")),
  categoryId: z.string().min(1, "Escolha a categoria."),
  price: z
    .number({ invalid_type_error: "Informe um preço válido (ex.: 35 ou 35,90)." })
    .positive("Informe um preço maior que zero.")
    .max(100000),
  description: z.string().trim().min(1, "Escreva a descrição.").max(5000),
  available: z.boolean(),
  featured: z.boolean(),
  bestseller: z.boolean(),
  productionTime: z.string().trim().max(80),
  model3d: z
    .string()
    .refine((v) => v === "" || (MODELOS_3D as readonly string[]).includes(v), "Modelo 3D inválido."),
  options: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Dê um nome à variação (ex.: Cor).").max(40),
        values: z
          .array(
            z.object({
              label: z.string().trim().min(1, "Preencha todas as opções da variação.").max(60),
              priceDelta: money,
              available: z.boolean(),
            }),
          )
          .min(1, "Cada variação precisa de pelo menos uma opção."),
      }),
    )
    .max(10),
  customizations: z
    .array(
      z
        .object({
          label: z.string().trim().min(1, "Dê um título a cada campo de personalização.").max(120),
          type: z.enum(["TEXT", "LONG_TEXT", "SELECT", "IMAGE_LINK"]),
          required: z.boolean(),
          maxLength: z
            .number({ invalid_type_error: "O limite de caracteres precisa ser um número." })
            .int()
            .min(1)
            .max(2000)
            .nullable(),
          choices: z.array(z.string().trim().min(1).max(60)).max(30),
          priceDelta: money,
        })
        .refine((c) => c.type !== "SELECT" || c.choices.length > 0, {
          message: "Campos do tipo lista precisam de opções.",
        }),
    )
    .max(10),
});

export type ProductInput = z.input<typeof productSchema>;

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

async function uniqueSlug(base: string, ignoreId: string | null) {
  let slug = base || "produto";
  for (let n = 2; ; n++) {
    const existing = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
    if (!existing || existing.id === ignoreId) return slug;
    slug = `${base}-${n}`;
  }
}

function refresh(productId?: string) {
  revalidateTag(CATALOG_TAG);
  revalidatePath("/admin/produtos");
  if (productId) revalidatePath(`/admin/produtos/${productId}`);
}

export async function saveProduct(id: string | null, input: ProductInput): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const data = parsed.data;

  const category = await prisma.category.findUnique({ where: { id: data.categoryId }, select: { id: true } });
  if (!category) return { ok: false, error: "Categoria não encontrada." };

  const slug = await uniqueSlug(data.slug || slugify(data.name), id);
  const fields = {
    name: data.name,
    slug,
    categoryId: data.categoryId,
    price: data.price,
    description: data.description,
    available: data.available,
    featured: data.featured,
    bestseller: data.bestseller,
    productionTime: data.productionTime || null,
    model3d: data.model3d || null,
  };

  try {
    const saved = await prisma.$transaction(
      async (tx) => {
        const product = id
          ? await tx.product.update({ where: { id }, data: fields, select: { id: true } })
          : await tx.product.create({ data: fields, select: { id: true } });

        await tx.productOption.deleteMany({ where: { productId: product.id } });
        await tx.customization.deleteMany({ where: { productId: product.id } });

        for (const [i, option] of data.options.entries()) {
          await tx.productOption.create({
            data: {
              productId: product.id,
              name: option.name,
              sortOrder: i,
              values: {
                create: option.values.map((v, j) => ({
                  label: v.label,
                  priceDelta: v.priceDelta,
                  available: v.available,
                  sortOrder: j,
                })),
              },
            },
          });
        }
        if (data.customizations.length) {
          await tx.customization.createMany({
            data: data.customizations.map((c, i) => ({
              productId: product.id,
              label: c.label,
              type: c.type,
              required: c.required,
              maxLength: c.maxLength,
              choices: c.type === "SELECT" ? c.choices : [],
              priceDelta: c.priceDelta,
              sortOrder: i,
            })),
          });
        }
        return product;
      },
      { timeout: 30_000, maxWait: 10_000 },
    );
    refresh(saved.id);
    return { ok: true, id: saved.id };
  } catch (error) {
    console.error(error);
    return { ok: false, error: "Não foi possível salvar o produto. Tente novamente." };
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  await requireAdmin();
  const images = await prisma.productImage.findMany({ where: { productId: id }, select: { url: true } });
  try {
    await prisma.product.delete({ where: { id } });
  } catch (error) {
    console.error(error);
    return { ok: false, error: "Não foi possível excluir o produto." };
  }
  await deleteStoredImages(images.map((i) => i.url));
  refresh();
  return { ok: true };
}

// ---------- Fotos ----------

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

export async function uploadImage(
  productId: string,
  kind: "GALLERY" | "SPIN",
  formData: FormData,
): Promise<ActionResult<{ image: { id: string; url: string; alt: string } }>> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Nenhum arquivo recebido." };
  if (!file.type.startsWith("image/")) return { ok: false, error: `${file.name}: o arquivo não é uma imagem.` };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: `${file.name}: arquivo maior que 12 MB.` };

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { name: true } });
  if (!product) return { ok: false, error: "Produto não encontrado." };

  try {
    const source = Buffer.from(await file.arrayBuffer());
    const processed = kind === "GALLERY" ? await standardizeGalleryImage(source) : await processSpinFrame(source);
    const url = await uploadProductImage(productId, kind === "GALLERY" ? "galeria" : "360", processed.buffer);

    const sortOrderInput = Number(formData.get("sortOrder"));
    const last = await prisma.productImage.findFirst({
      where: { productId, kind },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const sortOrder = Number.isFinite(sortOrderInput) && formData.has("sortOrder") ? sortOrderInput : (last?.sortOrder ?? -1) + 1;
    const count = await prisma.productImage.count({ where: { productId, kind } });
    const alt = kind === "GALLERY" ? `${product.name} — foto ${count + 1}` : `${product.name} — quadro ${sortOrder + 1}`;

    const image = await prisma.productImage.create({
      data: { productId, kind, url, alt, sortOrder },
      select: { id: true, url: true, alt: true },
    });
    refresh(productId);
    return { ok: true, image };
  } catch (error) {
    console.error(error);
    return { ok: false, error: `${file.name}: ${(error as Error).message || "falha ao processar a foto."}` };
  }
}

export async function deleteImage(imageId: string): Promise<ActionResult> {
  await requireAdmin();
  const image = await prisma.productImage.findUnique({ where: { id: imageId }, select: { url: true, productId: true } });
  if (!image) return { ok: true };
  await prisma.productImage.delete({ where: { id: imageId } });
  await deleteStoredImages([image.url]);
  refresh(image.productId);
  return { ok: true };
}

export async function reorderGallery(productId: string, orderedIds: string[]): Promise<ActionResult> {
  await requireAdmin();
  const ids = z.array(z.string()).max(100).parse(orderedIds);
  await prisma.$transaction(
    ids.map((id, i) => prisma.productImage.update({ where: { id, productId }, data: { sortOrder: i } })),
  );
  refresh(productId);
  return { ok: true };
}

export async function updateImageAlt(imageId: string, alt: string): Promise<ActionResult> {
  await requireAdmin();
  const value = z.string().trim().max(200).parse(alt);
  const image = await prisma.productImage.update({ where: { id: imageId }, data: { alt: value }, select: { productId: true } });
  refresh(image.productId);
  return { ok: true };
}

export async function clearSpin(productId: string): Promise<ActionResult> {
  await requireAdmin();
  const frames = await prisma.productImage.findMany({ where: { productId, kind: "SPIN" }, select: { url: true } });
  await prisma.productImage.deleteMany({ where: { productId, kind: "SPIN" } });
  await deleteStoredImages(frames.map((f) => f.url));
  refresh(productId);
  return { ok: true };
}
