import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export function Card({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "rounded-[18px] border border-linha bg-[linear-gradient(180deg,#0C110E_0%,#090C0A_100%)] transition-colors duration-300 hover:border-[#27342D]",
        className,
      )}
      {...props}
    />
  );
}
