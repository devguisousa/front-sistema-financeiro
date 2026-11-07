import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { estiloCard } from "./estilos";

export function Card({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn(estiloCard, className)} {...props} />;
}

/** Cartão lateral (formulário ao lado da lista): vira região "complementary". */
export function CardLateral({ className, ...props }: ComponentProps<"aside">) {
  return <aside className={cn(estiloCard, className)} {...props} />;
}
