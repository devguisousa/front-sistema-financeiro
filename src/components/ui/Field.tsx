import { type ReactNode, useId } from "react";
import { cn } from "../../lib/cn";

export type PropsDoCampo = {
  id: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
};

type FieldProps = {
  rotulo: string;
  erro?: string | undefined;
  dica?: ReactNode;
  className?: string;
  /** Recebe id e atributos de acessibilidade para repassar ao campo. */
  children: (props: PropsDoCampo) => ReactNode;
};

/** Rótulo + campo + dica + erro, ligados por id. */
export function Field({ rotulo, erro, dica, className, children }: FieldProps) {
  const id = useId();
  const idDica = `${id}-dica`;
  const idErro = `${id}-erro`;
  const descricao = [dica ? idDica : null, erro ? idErro : null].filter(Boolean).join(" ");

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="rotulo">
        {rotulo}
      </label>
      {children({
        id,
        ...(erro ? { "aria-invalid": true as const } : {}),
        ...(descricao ? { "aria-describedby": descricao } : {}),
      })}
      {dica && (
        <p id={idDica} className="text-[12px] text-musgo">
          {dica}
        </p>
      )}
      {erro && (
        <p id={idErro} role="alert" className="text-[12px] text-coral">
          {erro}
        </p>
      )}
    </div>
  );
}
