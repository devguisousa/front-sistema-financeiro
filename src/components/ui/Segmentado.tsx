import { cn } from "../../lib/cn";

type Opcao<T extends string> = { valor: T; rotulo: string; ponto?: "verde" | "coral" };

type SegmentadoProps<T extends string> = {
  rotulo: string;
  opcoes: Opcao<T>[];
  valor: T;
  aoMudar(valor: T): void;
  className?: string;
};

/** Botões de filtro lado a lado (Todas / Receitas / Despesas). */
export function Segmentado<T extends string>({
  rotulo,
  opcoes,
  valor,
  aoMudar,
  className,
}: SegmentadoProps<T>) {
  return (
    <fieldset
      className={cn(
        "m-0 inline-flex min-w-0 flex-wrap gap-1 rounded-full border border-linha bg-[#0A0E0C] p-1",
        className,
      )}
    >
      <legend className="sr-only">{rotulo}</legend>
      {opcoes.map((opcao) => (
        <button
          key={opcao.valor}
          type="button"
          aria-pressed={opcao.valor === valor}
          onClick={() => aoMudar(opcao.valor)}
          className={cn(
            "inline-flex min-h-8 cursor-pointer items-center justify-center gap-1.5 rounded-full px-3.5 text-[13px] leading-none font-medium text-musgo transition-colors duration-200 hover:text-nevoa",
            opcao.valor === valor && "bg-[#16201B] text-nevoa shadow-[inset_0_0_0_1px_#26342D]",
          )}
        >
          {opcao.ponto && (
            <span
              aria-hidden="true"
              className={cn(
                "size-1.5 rounded-full",
                opcao.ponto === "verde" ? "bg-verde" : "bg-coral",
              )}
            />
          )}
          {opcao.rotulo}
        </button>
      ))}
    </fieldset>
  );
}
