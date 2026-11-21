import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-loja flex flex-col items-start py-24 md:py-32">
      <p className="font-display text-7xl font-extrabold text-lilas-300">404</p>
      <h1 className="mt-4 text-4xl font-extrabold text-ameixa-900">Página não encontrada</h1>
      <p className="mt-3 max-w-md text-tinta-suave">
        O endereço pode ter mudado ou o produto não está mais no catálogo.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className="btn-sol">
          Voltar para o início
        </Link>
        <Link href="/busca" className="btn-contorno text-ameixa-800 hover:bg-lilas-50">
          Buscar produtos
        </Link>
      </div>
    </div>
  );
}
