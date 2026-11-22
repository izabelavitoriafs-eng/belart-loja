"use client";

// Esconde o cabeçalho, o rodapé e o botão de WhatsApp da loja dentro do painel (/admin).
import { usePathname } from "next/navigation";

export function ChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return <>{children}</>;
}
