import { ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { estiloCampo } from "./estilos";

/** <select> nativo estilizado: melhor no celular e no teclado. */
export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className={cn("relative", className)}>
      <select className={cn(estiloCampo, "cursor-pointer appearance-none pr-10")} {...props}>
        {children}
      </select>
      <ChevronDown
        size={16}
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-musgo"
      />
    </div>
  );
}
