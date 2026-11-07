import type { ReactNode } from "react";

type PageHeaderProps = {
  kicker: string;
  titulo: string;
  /** Palavra final em serif itálico verde. */
  destaque?: string;
  descricao?: string;
  acoes?: ReactNode;
};

export function PageHeader({ kicker, titulo, destaque, descricao, acoes }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-6">
      <div className="flex flex-col gap-3.5">
        <span className="kicker">{kicker}</span>
        <h1 className="text-[clamp(36px,4.4vw,56px)] leading-none font-semibold tracking-[-.045em]">
          {titulo}
          {destaque && (
            <>
              {" "}
              <span className="destaque text-[1.08em] text-verde">{destaque}</span>
            </>
          )}
        </h1>
        {descricao && <p className="max-w-[620px] text-[15px] text-musgo">{descricao}</p>}
      </div>
      {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
    </header>
  );
}
