import { Eye, EyeOff } from "lucide-react";
import { type ComponentProps, useState } from "react";
import { cn } from "../../lib/cn";
import { estiloCampo } from "./estilos";

/** Campo de senha com botão para mostrar/esconder. */
export function CampoSenha({ className, ...props }: Omit<ComponentProps<"input">, "type">) {
  const [mostrando, setMostrando] = useState(false);

  return (
    <div className="relative">
      <input
        type={mostrando ? "text" : "password"}
        className={cn(estiloCampo, "pr-12", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setMostrando((atual) => !atual)}
        aria-label={mostrando ? "Esconder senha" : "Mostrar senha"}
        aria-pressed={mostrando}
        className="absolute top-1/2 right-1.5 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-musgo transition-colors hover:bg-[#0F1512] hover:text-nevoa"
      >
        {mostrando ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
      </button>
    </div>
  );
}
