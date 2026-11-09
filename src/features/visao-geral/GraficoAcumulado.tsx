import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "../../components/ui";
import { formatarBRL } from "../../lib/dinheiro";
import type { PontoAcumulado } from "./calculos";
import { COR, EIXO_ZERO, GRADE, reaisCurtos, SUPERFICIE, TICK } from "./estiloGrafico";
import { CaixaDica, LinhaDica } from "./PecasGrafico";

function Dica({ active, payload }: TooltipContentProps) {
  const ponto = payload?.[0]?.payload as PontoAcumulado | undefined;
  if (!active || !ponto) return null;

  return (
    <CaixaDica titulo={ponto.nome}>
      <LinhaDica nome="No dia" valor={formatarBRL(ponto.doDia)} />
      <LinhaDica separada nome="Acumulado" valor={formatarBRL(ponto.acumulado)} />
    </CaixaDica>
  );
}

/**
 * Receitas menos despesas somadas dia a dia. Acima de zero a área é verde,
 * abaixo é coral (o corte do degradê cai exatamente no zero).
 */
export function GraficoAcumulado({ pontos, parcial }: { pontos: PontoAcumulado[]; parcial: boolean }) {
  // useId traz caracteres que não valem dentro de url(#...)
  const id = `acumulado-${useId().replace(/[^\w-]/g, "")}`;
  const comMovimento = pontos.filter((p) => p.qtd > 0);
  const final = pontos.at(-1);

  if (!final || comMovimento.length === 0) {
    return <p className="pb-1 text-[13px] text-musgo">Nenhum lançamento no período até agora.</p>;
  }

  const valores = pontos.map((p) => p.acumulado);
  const maior = Math.max(0, ...valores);
  const menor = Math.min(0, ...valores);
  // Degradê só quando cruza o zero: numa linha reta, a caixa do degradê tem
  // altura zero e o SVG não pinta nada
  const cruzaZero = maior > 0 && menor < 0;
  const corte = cruzaZero ? maior / (maior - menor) : 0;
  const corUnica = menor < 0 ? COR.despesas : COR.receitas;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="num font-mono text-[26px] leading-none font-medium tracking-[-.02em]">
          {formatarBRL(final.acumulado)}
        </span>
        <span className="text-[13px] text-musgo">até {final.nome}</span>
        {parcial && (
          <Badge tom="coral" className="ml-auto">
            Dados parciais
          </Badge>
        )}
      </div>

      <div aria-hidden="true">
        <AreaChart
          responsive
          data={pontos}
          margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
          style={{ width: "100%", height: 200 }}
        >
          {cruzaZero && (
            <defs>
              {(["linha", "area"] as const).map((parte) => {
                const opacidade = parte === "linha" ? 1 : 0.16;
                return (
                  <linearGradient key={parte} id={`${id}-${parte}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset={0} stopColor={COR.receitas} stopOpacity={opacidade} />
                    <stop offset={corte} stopColor={COR.receitas} stopOpacity={opacidade} />
                    <stop offset={corte} stopColor={COR.despesas} stopOpacity={opacidade} />
                    <stop offset={1} stopColor={COR.despesas} stopOpacity={opacidade} />
                  </linearGradient>
                );
              })}
            </defs>
          )}
          <CartesianGrid vertical={false} stroke={GRADE} />
          <XAxis
            dataKey="rotulo"
            tickLine={false}
            axisLine={false}
            tick={TICK}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis width={60} tickLine={false} axisLine={false} tick={TICK} tickFormatter={reaisCurtos} />
          <ReferenceLine y={0} stroke={EIXO_ZERO} />
          <Tooltip cursor={{ stroke: EIXO_ZERO, strokeWidth: 1 }} content={(props) => <Dica {...props} />} />
          <Area
            type="linear"
            dataKey="acumulado"
            baseValue={0}
            stroke={cruzaZero ? `url(#${id}-linha)` : corUnica}
            strokeWidth={2}
            fill={cruzaZero ? `url(#${id}-area)` : corUnica}
            fillOpacity={cruzaZero ? 1 : 0.16}
            dot={false}
            activeDot={{ r: 5, fill: "#E9F1EC", stroke: SUPERFICIE, strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </div>

      <details className="text-[13px]">
        <summary className="cursor-pointer text-musgo hover:text-nevoa">Ver dias com movimento</summary>
        <table className="mt-3 w-full text-left">
          <thead>
            <tr className="rotulo">
              <th scope="col" className="py-1.5 font-medium">Dia</th>
              <th scope="col" className="py-1.5 text-right font-medium">No dia</th>
              <th scope="col" className="py-1.5 text-right font-medium">Acumulado</th>
            </tr>
          </thead>
          <tbody className="num font-mono">
            {comMovimento.map((p) => (
              <tr key={p.dia} className="border-t border-superficie-3">
                <th scope="row" className="py-1.5 font-sans font-normal">{p.nome}</th>
                <td className="py-1.5 text-right">{formatarBRL(p.doDia)}</td>
                <td className="py-1.5 text-right">{formatarBRL(p.acumulado)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
