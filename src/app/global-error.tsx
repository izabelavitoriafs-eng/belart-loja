"use client";

// Exibida quando o próprio layout falha (por exemplo, banco de dados fora do ar).
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "4rem 1.5rem", color: "#2a1630" }}>
        <h1 style={{ color: "#3e0a47" }}>A loja está temporariamente indisponível</h1>
        <p>Tente novamente em alguns instantes. Se precisar, fale com a Belart pelo WhatsApp: (31) 8114-4852.</p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: "1.5rem",
            padding: "0.8rem 1.5rem",
            borderRadius: 999,
            border: 0,
            background: "#f5b800",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Tentar novamente
        </button>
      </body>
    </html>
  );
}
