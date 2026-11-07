import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { estiloCampo } from "./estilos";

type CampoValorProps = Omit<ComponentProps<"input">, "value" | "onChange" | "type"> & {
  valor: string;
  aoMudar(texto: string): void;
};

/** Campo de dinheiro: guarda o texto digitado; quem valida é o formulário (lerValorDigitado). */
export function CampoValor({ valor, aoMudar, className, ...props }: CampoValorProps) {
  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 font-mono text-[13px] text-musgo"
      >
        R$
      </span>
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        placeholder="0,00"
        value={valor}
        onChange={(evento) => aoMudar(evento.target.value)}
        className={cn(estiloCampo, "num pl-10 text-right font-mono", className)}
        {...props}
      />
    </div>
  );
}
