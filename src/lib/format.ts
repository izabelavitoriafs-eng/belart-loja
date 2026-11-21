const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Formata um valor (number, string ou Decimal do Prisma) como R$. */
export function formatPrice(value: number | string | { toString(): string }) {
  return brl.format(Number(value.toString()));
}
