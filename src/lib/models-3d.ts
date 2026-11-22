// Modelos 3D disponíveis. Usado pela loja, pelo painel e pelo importador
// (sem dependências do servidor, pode ser importado em qualquer lugar).
// Para criar um novo: acrescente aqui e escreva o modelo em src/components/model-3d-viewer.tsx.
export const MODELOS_3D = ["caneca", "xicara", "garrafa", "taca", "azulejo", "blusa"] as const;

export type Model3D = (typeof MODELOS_3D)[number];

export const MODELOS_3D_NOMES: Record<Model3D, string> = {
  caneca: "Caneca",
  xicara: "Xícara",
  garrafa: "Garrafa",
  taca: "Taça",
  azulejo: "Azulejo 20×20",
  blusa: "Blusa",
};

export function isModel3D(value: string | null | undefined): value is Model3D {
  return !!value && (MODELOS_3D as readonly string[]).includes(value);
}
