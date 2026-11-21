import { PrismaClient } from "@prisma/client";

// Reaproveita a mesma conexão durante o desenvolvimento
// (o Next.js recarrega os módulos a cada alteração).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
