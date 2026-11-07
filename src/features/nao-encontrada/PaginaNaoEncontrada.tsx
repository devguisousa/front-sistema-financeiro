import { Link } from "react-router";
import { useTitulo } from "../../lib/titulo";

export function PaginaNaoEncontrada() {
  useTitulo("Página não encontrada");

  return (
    <section className="flex flex-col items-start gap-4 py-16">
      <span className="kicker">Erro 404</span>
      <h1 className="text-4xl font-semibold tracking-[-.04em]">
        Página não <span className="destaque text-verde">encontrada</span>
      </h1>
      <p className="max-w-md text-musgo">O endereço não existe ou mudou de lugar.</p>
      <Link
        to="/"
        className="inline-flex min-h-10 items-center rounded-full bg-verde px-4 font-semibold text-tinta transition hover:bg-verde-claro active:scale-[.97]"
      >
        Ir para a visão geral
      </Link>
    </section>
  );
}
