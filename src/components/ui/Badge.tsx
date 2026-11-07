import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

const TONS = {
  verde: "border-verde/30 bg-verde/10 text-verde",
  coral: "border-coral/35 bg-coral/10 text-coral",
  neutro: "border-[#26302B] bg-noite-2 text-nevoa-2",
} as const;

type BadgeProps = {
  tom?: keyof typeof TONS;
  ponto?: boolean;
  className?: string;
  children: ReactNode;
};

export function Badge({ tom = "neutro", ponto = false, className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 max-w-full items-center gap-1.5 rounded-full border px-2.5 font-mono text-[11px] leading-none font-medium tracking-[.04em] whitespace-nowrap",
        TONS[tom],
        className,
      )}
    >
      {ponto && <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />}
      <span className="truncate">{children}</span>
    </span>
  );
}
