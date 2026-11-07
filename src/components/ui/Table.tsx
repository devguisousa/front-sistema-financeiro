import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

/** Tabela com rolagem horizontal própria (a página nunca rola de lado). */
export function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full min-w-[720px] border-collapse text-left", className)} {...props} />
    </div>
  );
}

export function THead({ className, ...props }: ComponentProps<"thead">) {
  return (
    <thead
      className={cn("border-y border-superficie-3 bg-[#080B09]", className)}
      {...props}
    />
  );
}

export function TBody(props: ComponentProps<"tbody">) {
  return <tbody {...props} />;
}

export function Tr({ className, ...props }: ComponentProps<"tr">) {
  return (
    <tr
      className={cn(
        "border-b border-superficie-2 transition-colors duration-200 hover:bg-[#0C120F]",
        className,
      )}
      {...props}
    />
  );
}

export function Th({
  className,
  numero = false,
  ...props
}: ComponentProps<"th"> & { numero?: boolean }) {
  return (
    <th
      scope="col"
      className={cn("rotulo px-5 py-2.5 font-medium", numero && "text-right", className)}
      {...props}
    />
  );
}

export function Td({
  className,
  numero = false,
  ...props
}: ComponentProps<"td"> & { numero?: boolean }) {
  return (
    <td
      className={cn(
        "px-5 py-3.5 align-middle",
        numero && "num text-right font-mono whitespace-nowrap",
        className,
      )}
      {...props}
    />
  );
}
