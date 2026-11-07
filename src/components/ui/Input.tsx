import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { estiloCampo } from "./estilos";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(estiloCampo, className)} {...props} />;
}
