import { AlertTriangle } from "lucide-react";
import { cn } from "../../lib/cn";
import { formatarBRL } from "../../lib/dinheiro";

/** "Saldo atual" → "Depois do lançamento"; avisa se ficaria negativo. */
export function PreviaSaldo({ atual, depois }: { atual: number; depois: number }) {
  const negativo = depois < 0;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-superficie-3 bg-poco p-3.5 text-[13px]">
      <div className="flex justify-between gap-3">
        <span className="text-musgo">Saldo atual</span>
        <span className="num font-mono">{formatarBRL(atual)}</span>
      </div>
      <div className="flex justify-between gap-3">
        <span className="text-musgo">Depois do lançamento</span>
        <span className={cn("num font-mono font-semibold", negativo ? "text-coral" : "text-verde")}>
          {formatarBRL(depois)}
        </span>
      </div>
      {negativo && (
        <p role="alert" className="flex items-start gap-1.5 text-[12px] text-coral">
          <AlertTriangle size={14} className="mt-0.5 flex-none" aria-hidden="true" />
          A conta não pode ficar negativa. Diminua o valor ou escolha outra conta.
        </p>
      )}
    </div>
  );
}
