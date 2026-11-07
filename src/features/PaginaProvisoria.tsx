import { useTitulo } from "../lib/titulo";

// Usada só até cada tela ser construída (Tarefas 5 a 10)
export function PaginaProvisoria({ tela }: { tela: string }) {
  useTitulo(tela);
  return (
    <section className="flex flex-col gap-3">
      <span className="kicker">{tela}</span>
      <h1 className="text-4xl font-semibold tracking-[-.04em]">{tela}</h1>
      <p className="text-musgo">Em construção.</p>
    </section>
  );
}
