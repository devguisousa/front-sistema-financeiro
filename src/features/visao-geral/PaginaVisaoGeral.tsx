import { ArrowRight, WalletCards } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  Badge,
  BadgeVencimento,
  Card,
  Empty,
  ErroCarregar,
  Segmentado,
  Skeleton,
} from "../../components/ui";
import { cn } from "../../lib/cn";
import { formatarDataCurta, formatarVencimento, hojeLocal } from "../../lib/datas";
import { formatarBRL, formatarValor, paraCentavos } from "../../lib/dinheiro";
import { useTitulo } from "../../lib/titulo";
import { FiltroPeriodo } from "../relatorio/FiltroPeriodo";
import { type Periodo, periodoAnterior, periodoDaUrl, rotuloDoPeriodo } from "../relatorio/periodos";
import { useResumo } from "../relatorio/useRelatorio";
import { acumularPorDia, agruparFluxo, granularidade, variacao } from "./calculos";
import { GraficoAcumulado } from "./GraficoAcumulado";
import { GraficoCategorias } from "./GraficoCategorias";
import { type FormaFluxo, GraficoFluxo } from "./GraficoFluxo";
import { usePainel, useTransacoesDoPeriodo } from "./usePainel";

const mesPorExtenso = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

const FORMAS_FLUXO: { valor: FormaFluxo; rotulo: string }[] = [
  { valor: "barras", rotulo: "Barras" },
  { valor: "linhas", rotulo: "Linhas" },
];

const lancamentos = (n: number, de: string) => `${n} ${n === 1 ? "lançamento" : "lançamentos"} de ${de}`;

function capitalizar(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Cartão com título (vira região acessível pelo nome). */
function Bloco({
  id,
  titulo,
  acao,
  className,
  children,
}: {
  id: string;
  titulo: string;
  acao?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card aria-labelledby={id} className={cn("flex min-w-0 flex-col", className)}>
      <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
        <h2 id={id} className="text-[16px] font-semibold tracking-[-.02em]">
          {titulo}
        </h2>
        {acao}
      </div>
      {children}
    </Card>
  );
}

function LinkVerTodas({ para, texto = "Ver todas" }: { para: string; texto?: string }) {
  return (
    <Link
      to={para}
      className="inline-flex min-h-10 items-center gap-1.5 text-[13px] text-verde hover:text-[#8BFFBE]"
    >
      {texto}
      <ArrowRight size={14} aria-hidden="true" />
    </Link>
  );
}

function ListaCarregando({ linhas = 4 }: { linhas?: number }) {
  return (
    <div className="flex flex-col gap-3 px-5 pb-5" aria-hidden="true">
      {Array.from({ length: linhas }, (_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

/** "+12% vs out", na cor do que é bom para aquele número. */
function ChipVariacao({
  atual,
  anterior,
  base,
  subirEhBom,
}: {
  atual: number;
  anterior: number;
  base: string;
  subirEhBom: boolean;
}) {
  const v = variacao(atual, anterior);
  if (v === null) return <Badge>— vs {base}</Badge>;

  const arredondado = Math.round(v);
  const bom = arredondado === 0 ? null : arredondado > 0 === subirEhBom;
  const sinal = arredondado > 0 ? "+" : arredondado < 0 ? "−" : "";

  return (
    <Badge tom={bom === null ? "neutro" : bom ? "verde" : "coral"}>
      {sinal}
      {Math.abs(arredondado)}% vs {base}
    </Badge>
  );
}

function CartaoMes({
  rotulo,
  valor,
  detalhe,
  cor,
  chip,
}: {
  rotulo: string;
  valor: number | undefined;
  detalhe: string;
  cor?: string;
  chip?: ReactNode;
}) {
  return (
    <Card aria-label={rotulo} className="flex flex-col gap-3 p-5">
      <span className="rotulo">{rotulo}</span>
      {valor === undefined ? (
        <Skeleton className="h-8 w-36" />
      ) : (
        <span className={cn("num font-mono text-[26px] leading-none font-medium tracking-[-.02em]", cor)}>
          {formatarBRL(valor)}
        </span>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[13px] text-musgo">{detalhe}</span>
        {chip}
      </div>
    </Card>
  );
}

export function PaginaVisaoGeral() {
  useTitulo("Visão geral");
  const painel = usePainel();
  const { contas, saldos, saldoTotal, vencimentos, ultimas, agora } = painel;

  // O período (?de=&ate=) muda os cartões de receitas, despesas e resultado e
  // os gráficos. Saldos, vencimentos e últimas transações não dependem dele
  const [params, setParams] = useSearchParams();
  const periodo = periodoDaUrl(params, agora);
  const base = periodoAnterior(periodo);
  const resumo = useResumo(periodo);
  const resumoBase = useResumo(base);
  const doPeriodo = useTransacoesDoPeriodo(periodo);
  const [formaFluxo, setFormaFluxo] = useState<FormaFluxo>("barras");

  const qtdContas = contas.data?.length;

  const cabecalho = (
    <header className="flex flex-col gap-4">
      <span className="kicker">01 — Visão geral</span>
      <h1 className="text-[clamp(40px,5vw,68px)] leading-[.98] font-semibold tracking-[-.05em]">
        Seu dinheiro em <span className="destaque text-[1.12em] text-verde">fluxo</span>.
      </h1>
      <p className="text-[15px] text-musgo">
        {capitalizar(mesPorExtenso.format(agora))}
        {qtdContas !== undefined && ` · ${qtdContas} ${qtdContas === 1 ? "conta" : "contas"}`} ·
        valores com 2 casas, sempre
      </p>
    </header>
  );

  if (contas.data?.length === 0) {
    return (
      <>
        {cabecalho}
        <Card>
          <Empty
            icone={WalletCards}
            titulo="Cadastre sua primeira conta"
            texto="Contas são onde o dinheiro fica: banco, carteira, reserva. Os saldos e o fluxo aparecem aqui depois."
            acao={
              (
                <Link
                  to="/contas"
                  className="inline-flex min-h-10 items-center gap-2 rounded-full bg-verde px-4 font-semibold text-tinta transition hover:bg-verde-claro active:scale-[.97]"
                >
                  Cadastrar conta
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              )
            }
          />
        </Card>
      </>
    );
  }

  const totalPorConta = Math.max(saldoTotal ?? 0, 1);

  const rotulo = rotuloDoPeriodo(periodo);
  const comRotulo = (nome: string) => (rotulo ? `${nome} · ${rotulo}` : nome);
  const nomeBase = rotuloDoPeriodo(base) ?? "período anterior";

  const totais = (dados: typeof resumo.data) =>
    dados && {
      receitas: paraCentavos(dados.receitas),
      despesas: paraCentavos(dados.despesas),
      resultado: paraCentavos(dados.resultado),
    };
  const atual = totais(resumo.data);
  const anterior = totais(resumoBase.data);
  const comparar = atual && anterior;

  function escolher(novo: Periodo) {
    setParams({ de: novo.de, ate: novo.ate });
  }

  return (
    <>
      {cabecalho}

      <FiltroPeriodo
        key={`${periodo.de}|${periodo.ate}`}
        periodo={periodo}
        agora={agora}
        aoMudar={escolher}
        descricao="Vale para os cartões de receitas, despesas e resultado e para os gráficos. Saldos, vencimentos e últimas transações não mudam."
      />

      <div className="grid gap-5 lg:grid-cols-[1.1fr_2fr]">
        <Card aria-labelledby="titulo-saldo" className="flex flex-col justify-between gap-6 p-6">
          <h2 id="titulo-saldo" className="rotulo">
            Saldo total
          </h2>
          {contas.isError || saldos.isError ? (
            <ErroCarregar
              erro={contas.error ?? saldos.error}
              aoTentar={() => void (contas.isError ? contas.refetch() : saldos.refetch())}
            />
          ) : saldoTotal === undefined ? (
            <Skeleton className="h-12 w-56" />
          ) : (
            <p className="num font-mono text-[clamp(34px,4vw,48px)] leading-none font-medium tracking-[-.03em]">
              {formatarBRL(saldoTotal)}
            </p>
          )}
          <p className="text-[13px] text-musgo">Soma do saldo atual de todas as contas.</p>
        </Card>

        {resumo.isError || resumoBase.isError ? (
          <Card className="flex items-center">
            <ErroCarregar
              erro={resumo.error ?? resumoBase.error}
              aoTentar={() => {
                if (resumo.isError) void resumo.refetch();
                if (resumoBase.isError) void resumoBase.refetch();
              }}
            />
          </Card>
        ) : (
          <div
            className={cn(
              "grid gap-5 transition-opacity sm:grid-cols-3",
              (resumo.isPlaceholderData || resumoBase.isPlaceholderData) && "opacity-60",
            )}
          >
            <CartaoMes
              rotulo={comRotulo("Receitas")}
              valor={atual?.receitas}
              cor="text-verde"
              detalhe={lancamentos(resumo.data?.qtdReceitas ?? 0, "entrada")}
              chip={
                comparar && (
                  <ChipVariacao atual={atual.receitas} anterior={anterior.receitas} base={nomeBase} subirEhBom />
                )
              }
            />
            <CartaoMes
              rotulo={comRotulo("Despesas")}
              valor={atual?.despesas}
              cor="text-coral"
              detalhe={lancamentos(resumo.data?.qtdDespesas ?? 0, "saída")}
              chip={
                comparar && (
                  <ChipVariacao
                    atual={atual.despesas}
                    anterior={anterior.despesas}
                    base={nomeBase}
                    subirEhBom={false}
                  />
                )
              }
            />
            <CartaoMes
              rotulo={comRotulo("Resultado")}
              valor={atual?.resultado}
              detalhe="Receitas menos despesas"
              chip={
                comparar && (
                  <ChipVariacao atual={atual.resultado} anterior={anterior.resultado} base={nomeBase} subirEhBom />
                )
              }
            />
          </div>
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-[2fr_1fr]">
        <Bloco
          id="titulo-fluxo"
          titulo="Fluxo de caixa"
          acao={
            <Segmentado<FormaFluxo>
              rotulo="Forma do gráfico de fluxo"
              valor={formaFluxo}
              aoMudar={setFormaFluxo}
              opcoes={FORMAS_FLUXO}
            />
          }
        >
          <div className={cn("px-5 pb-5 transition-opacity", doPeriodo.isPlaceholderData && "opacity-60")}>
            {doPeriodo.isError ? (
              <ErroCarregar erro={doPeriodo.error} aoTentar={() => void doPeriodo.refetch()} />
            ) : doPeriodo.data ? (
              <GraficoFluxo
                baldes={agruparFluxo(doPeriodo.data.itens, periodo)}
                granularidade={granularidade(periodo)}
                parcial={doPeriodo.data.parcial}
                forma={formaFluxo}
                hoje={hojeLocal(agora)}
              />
            ) : (
              <Skeleton className="h-[240px] w-full" />
            )}
          </div>
        </Bloco>

        <Bloco id="titulo-por-conta" titulo="Saldo por conta" acao={<LinkVerTodas para="/contas" />}>
          {saldos.isError ? (
            <ErroCarregar erro={saldos.error} aoTentar={() => void saldos.refetch()} />
          ) : !contas.data || !saldos.data ? (
            <ListaCarregando />
          ) : (
            <ul className="flex flex-col gap-4 px-5 pb-5">
              {contas.data.map((c) => {
                const valor = paraCentavos(saldos.data[c.id]?.saldoAtual ?? "0");
                return (
                  <li key={c.id} className="flex flex-col gap-2">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-[14px]">{c.nome}</span>
                      <span className="num font-mono text-[14px]">{formatarBRL(valor)}</span>
                    </span>
                    <span className="h-1.5 overflow-hidden rounded-full bg-superficie-3" aria-hidden="true">
                      <span
                        className="block h-full rounded-full bg-verde"
                        style={{ width: `${Math.max(0, Math.min(100, (valor / totalPorConta) * 100))}%` }}
                      />
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Bloco>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Bloco id="titulo-acumulado" titulo="Resultado acumulado">
          <div className={cn("px-5 pb-5 transition-opacity", doPeriodo.isPlaceholderData && "opacity-60")}>
            {doPeriodo.isError ? (
              <ErroCarregar erro={doPeriodo.error} aoTentar={() => void doPeriodo.refetch()} />
            ) : doPeriodo.data ? (
              <GraficoAcumulado
                pontos={acumularPorDia(doPeriodo.data.itens, periodo, hojeLocal(agora))}
                parcial={doPeriodo.data.parcial}
              />
            ) : (
              <Skeleton className="h-[200px] w-full" />
            )}
          </div>
        </Bloco>

        <Bloco id="titulo-categorias" titulo="Por categoria">
          <div className={cn("px-5 pb-5 transition-opacity", resumo.isPlaceholderData && "opacity-60")}>
            {resumo.isError ? (
              <ErroCarregar erro={resumo.error} aoTentar={() => void resumo.refetch()} />
            ) : resumo.data ? (
              <GraficoCategorias categorias={resumo.data.porCategoria} />
            ) : (
              <ListaCarregando linhas={3} />
            )}
          </div>
        </Bloco>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Bloco id="titulo-vencimentos" titulo="Próximos vencimentos">
          {vencimentos.isError ? (
            <ErroCarregar erro={vencimentos.error} aoTentar={() => void vencimentos.refetch()} />
          ) : !vencimentos.data ? (
            <ListaCarregando />
          ) : vencimentos.data.length === 0 ? (
            <p className="px-5 pb-6 text-[13px] text-musgo">Nada vence nos próximos 15 dias.</p>
          ) : (
            <ul className="flex flex-col pb-2">
              {vencimentos.data.map((v) => (
                <li key={`${v.tipo}-${v.id}`} className="border-t border-superficie-2 first:border-t-0">
                  <Link
                    to={v.tipo === "pagar" ? "/contas-a-pagar" : "/contas-a-receber"}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-[#0C120F]"
                  >
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="truncate">{v.descricao}</span>
                      <span className="font-mono text-[12px] text-musgo">
                        {v.tipo === "pagar" ? "A pagar" : "A receber"} · {formatarVencimento(v.vencimento)}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <BadgeVencimento diasAte={v.diasAte} limite={15} />
                      <span
                        className={cn(
                          "num font-mono text-[14px]",
                          v.tipo === "pagar" ? "text-coral" : "text-verde",
                        )}
                      >
                        {formatarBRL(v.restante)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Bloco>

        <Bloco id="titulo-ultimas" titulo="Últimas transações" acao={<LinkVerTodas para="/transacoes" />}>
          {ultimas.isError ? (
            <ErroCarregar erro={ultimas.error} aoTentar={() => void ultimas.refetch()} />
          ) : !ultimas.data ? (
            <ListaCarregando />
          ) : ultimas.data.length === 0 ? (
            <p className="px-5 pb-6 text-[13px] text-musgo">Nenhum lançamento ainda.</p>
          ) : (
            <ul className="flex flex-col pb-2">
              {ultimas.data.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-3 border-t border-superficie-2 px-5 py-3 first:border-t-0"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="w-12 flex-none font-mono text-[12px] text-musgo">
                      {formatarDataCurta(t.data)}
                    </span>
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate">{t.descricao}</span>
                      <span className="truncate text-[12px] text-musgo">{t.categoria.nome}</span>
                    </span>
                  </span>
                  <span
                    className={cn(
                      "num flex-none font-mono text-[14px]",
                      t.tipo === "RECEITA" ? "text-verde" : "text-coral",
                    )}
                  >
                    {t.tipo === "RECEITA" ? "+ " : "− "}
                    {formatarValor(t.valor)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Bloco>
      </div>
    </>
  );
}
