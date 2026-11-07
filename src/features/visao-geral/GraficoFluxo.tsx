import { Bar, BarChart, CartesianGrid, Tooltip, type TooltipContentProps, XAxis, YAxis } from "recharts";
import { Badge } from "../../components/ui";
import { formatarBRL } from "../../lib/dinheiro";
import type { ResumoMes } from "./calculos";

// Cores da marca (verde = entrada, coral = saída). Validadas com o script da
// skill dataviz: CVD ΔE 9,4, contraste ≥ 3:1 sobre #0C110E. Identidade também
// vem da legenda, da ordem fixa (receita à esquerda) e da tabela.
const COR = { receitas: "#3DF58F", despesas: "#FF8B66" } as const;
const TICK = { fill: "#76827A", fontSize: 11, fontFamily: "Geist Mono Variable, monospace" };

const compacto = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });

function Dica({ active, payload }: TooltipContentProps) {
  const linha = payload?.[0]?.payload as (ResumoMes & { nome: string }) | undefined;
  if (!active || !linha) return null;
  const resultado = linha.receitas - linha.despesas;

  return (
    <div className="flex min-w-48 flex-col gap-2 rounded-xl border border-linha-3 bg-noite-2 p-3 text-[12px] shadow-[0_16px_40px_-12px_#000]">
      <span className="rotulo">{linha.nome}</span>
      {(["receitas", "despesas"] as const).map((serie) => (
        <span key={serie} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2 text-musgo">
            <span className="size-2 rounded-[2px]" style={{ background: COR[serie] }} aria-hidden="true" />
            {serie === "receitas" ? "Receitas" : "Despesas"}
          </span>
          <span className="num font-mono text-nevoa">{formatarBRL(linha[serie])}</span>
        </span>
      ))}
      <span className="flex items-center justify-between gap-4 border-t border-linha pt-2">
        <span className="text-musgo">Resultado</span>
        <span className="num font-mono text-nevoa">{formatarBRL(resultado)}</span>
      </span>
    </div>
  );
}

const nomeCompleto = (mes: string) => {
  const [ano, m] = mes.split("-").map(Number);
  const texto = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
    new Date(ano ?? 0, (m ?? 1) - 1, 1),
  );
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

export function GraficoFluxo({ meses, parcial }: { meses: ResumoMes[]; parcial: boolean }) {
  const dados = meses.map((m) => ({ ...m, nome: nomeCompleto(m.mes) }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4 text-[12px] text-musgo">
        {(["receitas", "despesas"] as const).map((serie) => (
          <span key={serie} className="flex items-center gap-2">
            <span className="size-2.5 rounded-[3px]" style={{ background: COR[serie] }} aria-hidden="true" />
            {serie === "receitas" ? "Receitas" : "Despesas"}
          </span>
        ))}
        {parcial && (
          <Badge tom="coral" className="ml-auto">
            Dados parciais
          </Badge>
        )}
      </div>

      <div aria-hidden="true">
        <BarChart
          responsive
          data={dados}
          barGap={2}
          barCategoryGap="30%"
          margin={{ top: 8, right: 0, bottom: 0, left: 0 }}
          style={{ width: "100%", height: 240 }}
        >
          <CartesianGrid vertical={false} stroke="#141B17" />
          <XAxis dataKey="rotulo" tickLine={false} axisLine={false} tick={TICK} />
          <YAxis
            width={52}
            tickLine={false}
            axisLine={false}
            tick={TICK}
            tickFormatter={(centavos: number) => compacto.format(centavos / 100)}
          />
          <Tooltip cursor={{ fill: "rgb(233 241 236 / .04)" }} content={(props) => <Dica {...props} />} />
          <Bar dataKey="receitas" fill={COR.receitas} radius={[4, 4, 0, 0]} maxBarSize={18} isAnimationActive={false} />
          <Bar dataKey="despesas" fill={COR.despesas} radius={[4, 4, 0, 0]} maxBarSize={18} isAnimationActive={false} />
        </BarChart>
      </div>

      <details className="text-[13px]">
        <summary className="cursor-pointer text-musgo hover:text-nevoa">Ver dados em tabela</summary>
        <table className="mt-3 w-full text-left">
          <thead>
            <tr className="rotulo">
              <th scope="col" className="py-1.5 font-medium">Mês</th>
              <th scope="col" className="py-1.5 text-right font-medium">Receitas</th>
              <th scope="col" className="py-1.5 text-right font-medium">Despesas</th>
              <th scope="col" className="py-1.5 text-right font-medium">Resultado</th>
            </tr>
          </thead>
          <tbody className="num font-mono">
            {dados.map((m) => (
              <tr key={m.mes} className="border-t border-superficie-3">
                <th scope="row" className="py-1.5 font-sans font-normal">{m.nome}</th>
                <td className="py-1.5 text-right">{formatarBRL(m.receitas)}</td>
                <td className="py-1.5 text-right">{formatarBRL(m.despesas)}</td>
                <td className="py-1.5 text-right">{formatarBRL(m.receitas - m.despesas)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
