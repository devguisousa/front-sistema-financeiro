import { useState } from "react";
import { Cell, Pie, PieChart, Tooltip, type TooltipContentProps } from "recharts";
import { Segmentado } from "../../components/ui";
import { cn } from "../../lib/cn";
import { formatarBRL } from "../../lib/dinheiro";
import type { ResumoCategoria, TipoTransacao } from "../../lib/tipos";
import { type FatiaCategoria, fatiasPorCategoria } from "./calculos";
import { corDaFatia, SUPERFICIE } from "./estiloGrafico";
import { Amostra, CaixaDica, LinhaDica } from "./PecasGrafico";

type Forma = "barras" | "rosca";

const TIPOS: { valor: TipoTransacao; rotulo: string; ponto: "verde" | "coral" }[] = [
  { valor: "DESPESA", rotulo: "Despesas", ponto: "coral" },
  { valor: "RECEITA", rotulo: "Receitas", ponto: "verde" },
];

const FORMAS: { valor: Forma; rotulo: string }[] = [
  { valor: "barras", rotulo: "Barras" },
  { valor: "rosca", rotulo: "Rosca" },
];

/** "75%", ou "<1%" para uma fatia pequena que não é zero. */
function porcento(parte: number): string {
  if (parte > 0 && parte < 1) return "<1%";
  return `${Math.round(parte)}%`;
}

const lancamentos = (n: number) => `${n} ${n === 1 ? "lançamento" : "lançamentos"}`;

/** Barras horizontais da maior para a menor; o comprimento é a parte no total. */
function Barras({ fatias, tipo }: { fatias: FatiaCategoria[]; tipo: TipoTransacao }) {
  return (
    <ul className="flex flex-col gap-4">
      {fatias.map((f) => (
        <li key={f.chave} className="flex flex-col gap-2">
          <span className="flex items-baseline justify-between gap-3">
            <span className="flex min-w-0 items-baseline gap-2">
              <span className="truncate text-[14px]">{f.nome}</span>
              <span className="flex-none font-mono text-[11px] text-musgo-2">{lancamentos(f.quantidade)}</span>
            </span>
            <span className="flex flex-none items-baseline gap-2">
              <span className="font-mono text-[12px] text-musgo">{porcento(f.parte)}</span>
              <span className="num font-mono text-[14px]">{formatarBRL(f.total)}</span>
            </span>
          </span>
          <span className="h-1.5 overflow-hidden rounded-full bg-superficie-3" aria-hidden="true">
            <span
              className={cn("block h-full rounded-full", tipo === "RECEITA" ? "bg-verde" : "bg-coral")}
              style={{ width: `${Math.max(0, Math.min(100, f.parte))}%` }}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}

function DicaFatia({ active, payload }: TooltipContentProps) {
  const fatia = payload?.[0]?.payload as (FatiaCategoria & { cor: string }) | undefined;
  if (!active || !fatia) return null;

  return (
    <CaixaDica titulo={fatia.nome}>
      <LinhaDica cor={fatia.cor} nome={porcento(fatia.parte)} valor={formatarBRL(fatia.total)} />
      <LinhaDica separada nome="Lançamentos" valor={String(fatia.quantidade)} />
    </CaixaDica>
  );
}

/** Rosca com o total no meio e a legenda (nome, parte, valor) ao lado. */
function Rosca({ fatias }: { fatias: FatiaCategoria[] }) {
  const dados = fatias.map((f, i) => ({ ...f, cor: corDaFatia(i) }));
  const total = fatias.reduce((soma, f) => soma + f.total, 0);

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative mx-auto size-[200px] flex-none sm:mx-0">
        <div aria-hidden="true">
          <PieChart width={200} height={200}>
            <Pie
              data={dados}
              dataKey="total"
              nameKey="nome"
              innerRadius={68}
              outerRadius={98}
              startAngle={90}
              endAngle={-270}
              stroke={SUPERFICIE}
              strokeWidth={2}
              isAnimationActive={false}
            >
              {dados.map((f) => (
                <Cell key={f.chave} fill={f.cor} />
              ))}
            </Pie>
            <Tooltip content={(props) => <DicaFatia {...props} />} />
          </PieChart>
        </div>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1">
          <span className="text-[11px] text-musgo">Total</span>
          <span className="num font-mono text-[13px]">{formatarBRL(total)}</span>
        </div>
      </div>

      <ul className="flex min-w-48 flex-1 flex-col gap-2.5">
        {dados.map((f) => (
          <li key={f.chave} className="flex items-center justify-between gap-3 text-[13px]">
            <span className="flex min-w-0 items-center gap-2">
              <Amostra cor={f.cor} />
              <span className="truncate">{f.nome}</span>
            </span>
            <span className="flex flex-none items-baseline gap-2">
              <span className="font-mono text-[12px] text-musgo">{porcento(f.parte)}</span>
              <span className="num font-mono">{formatarBRL(f.total)}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Quanto cada categoria pesou no período: despesas ou receitas, em barras ou rosca. */
export function GraficoCategorias({ categorias }: { categorias: ResumoCategoria[] }) {
  const [tipo, setTipo] = useState<TipoTransacao>("DESPESA");
  const [forma, setForma] = useState<Forma>("barras");
  const fatias = fatiasPorCategoria(categorias, tipo);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Segmentado<TipoTransacao> rotulo="Tipo de lançamento" valor={tipo} aoMudar={setTipo} opcoes={TIPOS} />
        <Segmentado<Forma> rotulo="Forma do gráfico de categorias" valor={forma} aoMudar={setForma} opcoes={FORMAS} />
      </div>

      {fatias.length === 0 ? (
        <p className="pb-1 text-[13px] text-musgo">
          {tipo === "RECEITA" ? "Nenhuma receita no período." : "Nenhuma despesa no período."}
        </p>
      ) : forma === "barras" ? (
        <Barras fatias={fatias} tipo={tipo} />
      ) : (
        <Rosca fatias={fatias} />
      )}
    </div>
  );
}
