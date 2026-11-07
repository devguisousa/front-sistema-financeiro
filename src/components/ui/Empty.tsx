import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type EmptyProps = {
  icone: LucideIcon;
  titulo: string;
  texto?: string;
  acao?: ReactNode;
};

/** Estado vazio com uma ação ("Cadastrar primeira conta"). */
export function Empty({ icone: Icone, titulo, texto, acao }: EmptyProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl border border-linha-2 bg-noite-2 text-verde">
        <Icone size={20} strokeWidth={1.7} aria-hidden="true" />
      </span>
      <p className="text-[16px] font-medium">{titulo}</p>
      {texto && <p className="max-w-sm text-[13px] text-musgo">{texto}</p>}
      {acao && <div className="mt-2">{acao}</div>}
    </div>
  );
}
