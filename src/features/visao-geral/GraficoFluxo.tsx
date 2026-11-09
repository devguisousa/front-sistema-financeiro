import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "../../components/ui";
import { formatarBRL } from "../../lib/dinheiro";
import { type Balde, cortarFuturo, type Granularidade, type PontoFluxo } from "./calculos";
import { COR, EIXO_ZERO, GRADE, reaisCurtos, SUPERFICIE, TICK } from "./estiloGrafico";
import { Amostra, CaixaDica, LinhaDica } from "./PecasGrafico";

export type FormaFluxo = "barras" | "linhas";

const SERIES = ["receitas", "despesas"] as const;
const NOME = { receitas: "Receitas", despesas: "Despesas" } as const;

const POR: Record<Granularidade, { legenda: string; coluna: string }> = {
  dia: { legenda: "Por dia", coluna: "Dia" },
  semana: { legenda: "Por semana", coluna: "Semana" },
  mes: { legenda: "Por mês", coluna: "Mês" },
};

function Dica({ active, payload }: TooltipContentProps) {
  const balde = payload?.[0]?.payload as PontoFluxo | undefined;
  // Sem valor = ainda não chegou (só no gráfico de linhas)
  if (!active || !balde || balde.receitas === null || balde.despesas === null) return null;
  const { receitas, despesas } = balde;

  return (
    <CaixaDica titulo={balde.nome}>
      {SERIES.map((serie) => (
        <LinhaDica
          key={serie}
          cor={COR[serie]}
          nome={NOME[serie]}
          valor={formatarBRL(serie === "receitas" ? receitas : despesas)}
        />
      ))}
      <LinhaDica separada nome="Resultado" valor={formatarBRL(receitas - despesas)} />
    </CaixaDica>
  );
}

// Margem à direita: o último rótulo do eixo X ("30/11") não pode ser cortado
const MARGEM = { top: 8, right: 16, bottom: 0, left: 0 };
const TAMANHO = { width: "100%", height: 240 };

/** Receitas e despesas do período, em barras ou linhas, com a tabela dos mesmos números. */
export function GraficoFluxo({
  baldes,
  granularidade,
  parcial,
  forma,
  hoje,
}: {
  baldes: Balde[];
  granularidade: Granularidade;
  parcial: boolean;
  forma: FormaFluxo;
  hoje: string; // "AAAA-MM-DD"
}) {
  // Marcador em cada ponto só quando são poucos; com muitos, só no ponto sob o mouse
  const poucosPontos = baldes.length <= 12;

  const eixos = [
    <CartesianGrid key="grade" vertical={false} stroke={GRADE} />,
    <XAxis
      key="x"
      dataKey="rotulo"
      tickLine={false}
      axisLine={false}
      tick={TICK}
      interval="preserveStartEnd"
      minTickGap={16}
    />,
    <YAxis key="y" width={60} tickLine={false} axisLine={false} tick={TICK} tickFormatter={reaisCurtos} />,
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4 text-[12px] text-musgo">
        {SERIES.map((serie) => (
          <span key={serie} className="flex items-center gap-2">
            <Amostra cor={COR[serie]} />
            {NOME[serie]}
          </span>
        ))}
        <span className="ml-auto font-mono">{POR[granularidade].legenda}</span>
        {parcial && <Badge tom="coral">Dados parciais</Badge>}
      </div>

      <div aria-hidden="true">
        {forma === "barras" ? (
          <BarChart
            responsive
            data={baldes}
            barGap={2}
            // Com muitos baldes (dias), menos vão entre eles para a barra não virar um fio
            barCategoryGap={baldes.length > 16 ? "12%" : "30%"}
            margin={MARGEM}
            style={TAMANHO}
          >
            {eixos}
            <Tooltip cursor={{ fill: "rgb(233 241 236 / .04)" }} content={(props) => <Dica {...props} />} />
            {SERIES.map((serie) => (
              <Bar
                key={serie}
                dataKey={serie}
                fill={COR[serie]}
                radius={[4, 4, 0, 0]}
                maxBarSize={18}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        ) : (
          <LineChart responsive data={cortarFuturo(baldes, hoje)} margin={MARGEM} style={TAMANHO}>
            {eixos}
            <Tooltip cursor={{ stroke: EIXO_ZERO, strokeWidth: 1 }} content={(props) => <Dica {...props} />} />
            {SERIES.map((serie) => (
              <Line
                key={serie}
                type="linear"
                dataKey={serie}
                stroke={COR[serie]}
                strokeWidth={2}
                dot={poucosPontos ? { r: 4, fill: COR[serie], stroke: SUPERFICIE, strokeWidth: 2 } : false}
                activeDot={{ r: 5, fill: COR[serie], stroke: SUPERFICIE, strokeWidth: 2 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        )}
      </div>

      <details className="text-[13px]">
        <summary className="cursor-pointer text-musgo hover:text-nevoa">Ver dados em tabela</summary>
        <table className="mt-3 w-full text-left">
          <thead>
            <tr className="rotulo">
              <th scope="col" className="py-1.5 font-medium">{POR[granularidade].coluna}</th>
              <th scope="col" className="py-1.5 text-right font-medium">Receitas</th>
              <th scope="col" className="py-1.5 text-right font-medium">Despesas</th>
              <th scope="col" className="py-1.5 text-right font-medium">Resultado</th>
            </tr>
          </thead>
          <tbody className="num font-mono">
            {baldes.map((b) => (
              <tr key={b.inicio} className="border-t border-superficie-3">
                <th scope="row" className="py-1.5 font-sans font-normal">{b.nome}</th>
                <td className="py-1.5 text-right">{formatarBRL(b.receitas)}</td>
                <td className="py-1.5 text-right">{formatarBRL(b.despesas)}</td>
                <td className="py-1.5 text-right">{formatarBRL(b.receitas - b.despesas)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
