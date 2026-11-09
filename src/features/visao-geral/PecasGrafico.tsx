import type { ReactNode } from "react";

/** Caixa da dica (tooltip) dos gráficos. */
export function CaixaDica({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="flex min-w-48 flex-col gap-2 rounded-xl border border-linha-3 bg-noite-2 p-3 text-[12px] shadow-[0_16px_40px_-12px_#000]">
      <span className="rotulo">{titulo}</span>
      {children}
    </div>
  );
}

/** Linha "● Nome ........ valor" da dica. */
export function LinhaDica({ cor, nome, valor, separada }: { cor?: string; nome: string; valor: string; separada?: boolean }) {
  return (
    <span
      className={
        separada
          ? "flex items-center justify-between gap-4 border-t border-linha pt-2"
          : "flex items-center justify-between gap-4"
      }
    >
      <span className="flex items-center gap-2 text-musgo">
        {cor && <span className="size-2 rounded-[2px]" style={{ background: cor }} aria-hidden="true" />}
        {nome}
      </span>
      <span className="num font-mono text-nevoa">{valor}</span>
    </span>
  );
}

/** Quadradinho de cor da legenda. */
export function Amostra({ cor }: { cor: string }) {
  return <span className="size-2.5 flex-none rounded-[3px]" style={{ background: cor }} aria-hidden="true" />;
}
