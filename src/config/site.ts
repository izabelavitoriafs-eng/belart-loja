// Dados públicos da Belart. Altere aqui se algum contato mudar.
// (E-mail, local de retirada, regra do Uber e horário serão editáveis
// pelo painel administrativo a partir da etapa 3.)

export const site = {
  name: "Belart",
  tagline: "Produtos personalizados",
  description:
    "Canecas, garrafas, azulejos, xícaras, taças, blusas e outros produtos personalizados. Atendemos Belo Horizonte e região, com entrega por Uber ou retirada combinada.",
  serviceArea: "Belo Horizonte e região",
  // Número no formato internacional, só dígitos (55 + DDD + número).
  whatsappNumber: "553181144852",
  whatsappDisplay: "(31) 8114-4852",
  instagramUrl: "https://www.instagram.com/belartbhz/",
  instagramHandle: "@belartbhz",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

/** Link do WhatsApp com mensagem já preenchida. */
export function whatsappLink(message?: string) {
  const base = `https://wa.me/${site.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
