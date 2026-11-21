// Cria as categorias da Belart (as 6 principais + "Outros"). Não cria produtos de exemplo:
// os produtos reais serão cadastrados pelo painel administrativo (etapa 3).
// Pode ser executado várias vezes sem duplicar nada: categorias que já
// existem não são alteradas, só as que faltam são criadas.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { slug: "canecas", name: "Canecas", description: "Canecas personalizadas com a sua arte, nome ou foto." },
  { slug: "garrafas", name: "Garrafas", description: "Garrafas personalizadas em diferentes modelos e capacidades." },
  { slug: "azulejos", name: "Azulejos", description: "Azulejos decorativos com artes personalizadas." },
  { slug: "xicaras", name: "Xícaras", description: "Xícaras personalizadas para presentear ou usar no dia a dia." },
  { slug: "tacas", name: "Taças", description: "Taças com gravação ou personalização." },
  { slug: "blusas", name: "Blusas", description: "Blusas com estampas personalizadas." },
  {
    slug: "outros",
    name: "Outros",
    description: "Outros produtos personalizados. Não encontrou o que procura? Fale com a gente.",
  },
];

async function main() {
  for (const [index, category] of categories.entries()) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: { ...category, sortOrder: index },
    });
  }
  console.log(`✔ ${categories.length} categorias conferidas.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
