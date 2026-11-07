import { LoaderCircle } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

const VARIANTES = {
  primario:
    "border-verde bg-verde font-semibold text-tinta hover:border-verde-claro hover:bg-verde-claro hover:shadow-[0_0_0_4px_rgb(61_245_143/.14),0_10px_32px_-8px_rgb(61_245_143/.6)]",
  secundario:
    "border-linha-3 bg-noite-2 text-nevoa hover:border-linha-forte hover:bg-superficie-2",
  fantasma: "border-transparent bg-transparent text-musgo hover:bg-[#0F1512] hover:text-nevoa",
  perigo:
    "border-coral/40 bg-transparent text-coral hover:border-coral hover:bg-coral/10 hover:text-[#FFB59C]",
} as const;

const TAMANHOS = {
  md: "min-h-10 px-4 text-[14px]",
  sm: "min-h-8 px-3 text-[13px]",
  icone: "size-10 px-0",
} as const;

export type ButtonProps = ComponentProps<"button"> & {
  variante?: keyof typeof VARIANTES;
  tamanho?: keyof typeof TAMANHOS;
  carregando?: boolean;
};

/** Botão em pílula. Só ícone (tamanho="icone") exige aria-label. */
export function Button({
  variante = "secundario",
  tamanho = "md",
  carregando = false,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border leading-none font-medium whitespace-nowrap",
        "transition-[transform,border-color,background-color,box-shadow,color] duration-200 active:scale-[.97]",
        "disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100",
        VARIANTES[variante],
        TAMANHOS[tamanho],
        className,
      )}
      {...props}
    >
      {carregando && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
