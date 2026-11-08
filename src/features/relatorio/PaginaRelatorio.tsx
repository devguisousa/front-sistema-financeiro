import { CalendarSearch, Lock } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useSearchParams } from "react-router";
import {
  Badge,
  Button,
  Card,
  Empty,
  ErroCarregar,
  Field,
  Input,
  PageHeader,
  Pagination,
  Segmentado,
  Skeleton,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "../../components/ui";
import { cn } from "../../lib/cn";
import { formatarData } from "../../lib/datas";
import { formatarBRL, formatarValor, paraCentavos } from "../../lib/dinheiro";
import { useTitulo } from "../../lib/titulo";
import type { ResumoCategoria, TipoTransacao } from "../../lib/tipos";
import { origemAutomatica } from "../transacoes/useTransacoes";
import {
  ATALHOS,
  type Atalho,
  atalhoDoPeriodo,
  erroDoPeriodo,
  formatarDia,
  type Periodo,
  periodoDaUrl,
  periodoDoAtalho,
} from "./periodos";
import { useLancamentosDoPeriodo, useResumo } from "./useRelatorio";

const numeroOuNada = (texto: string | null) => (texto && /^\d+$/.test(texto) ? Number(texto) : undefined);

const lancamentos = (n: number, de: string) => `${n} ${n === 1 ? "lançamento" : "lançamentos"} de ${de}`;

/** Atalhos + datas livres. As datas só valem ao clicar em "Ver período". */
function FiltroPeriodo({
  periodo,
  agora,
  aoMudar,
}: {
  periodo: Periodo;
  agora: Date;
  aoMudar(periodo: Periodo): void;
}) {
  const [de, setDe] = useState(periodo.de);
  const [ate, setAte] = useState(periodo.ate);
  const [erro, setErro] = useState<string | null>(null);

  function aplicar(evento: FormEvent) {
    evento.preventDefault();
    const escolhido = { de, ate };
    const mensagem = erroDoPeriodo(escolhido);
    setErro(mensagem);
    if (!mensagem) aoMudar(escolhido);
  }

  const atalho: Atalho | "" = atalhoDoPeriodo(periodo, agora) ?? "";

  return (
    <Card aria-labelledby="titulo-periodo" className="flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="titulo-periodo" className="text-[16px] font-semibold tracking-[-.02em]">
          Período
        </h2>
        <span className="font-mono text-[12px] text-musgo">
          {formatarDia(periodo.de)} a {formatarDia(periodo.ate)}
        </span>
      </div>

      <Segmentado<Atalho | "">
        rotulo="Atalhos de período"
        valor={atalho}
        aoMudar={(valor) => valor && aoMudar(periodoDoAtalho(valor, agora))}
        opcoes={ATALHOS}
        className="self-start"
      />

      <form onSubmit={aplicar} noValidate className="flex flex-col gap-2">
        <div className="flex flex-wrap items-end gap-3">
          <Field rotulo="De" className="w-[170px]">
            {(props) => (
              <Input
                {...props}
                {...(erro ? { "aria-invalid": true } : {})}
                type="date"
                value={de}
                onChange={(e) => setDe(e.target.value)}
              />
            )}
          </Field>
          <Field rotulo="Até" className="w-[170px]">
            {(props) => (
              <Input
                {...props}
                {...(erro ? { "aria-invalid": true } : {})}
                type="date"
                value={ate}
                onChange={(e) => setAte(e.target.value)}
              />
            )}
          </Field>
          <Button type="submit">Ver período</Button>
        </div>
        {erro && (
          <p role="alert" className="text-[12px] text-coral">
            {erro}
          </p>
        )}
      </form>
    </Card>
  );
}

function CartaoTotal({
  rotulo,
  valor,
  detalhe,
  cor,
}: {
  rotulo: string;
  valor: number | undefined;
  detalhe: string;
  cor?: string;
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
      <span className="text-[13px] text-musgo">{detalhe}</span>
    </Card>
  );
}

/** Quanto cada categoria pesou no total do tipo, do maior para o menor. */
function PorCategoria({
  id,
  titulo,
  tipo,
  categorias,
  total,
}: {
  id: string;
  titulo: string;
  tipo: TipoTransacao;
  categorias: ResumoCategoria[] | undefined;
  total: number;
}) {
  const doTipo = categorias?.filter((c) => c.tipo === tipo);
  const receita = tipo === "RECEITA";

  return (
    <Card aria-labelledby={id} className="flex min-w-0 flex-col">
      <h2 id={id} className="px-5 pt-5 pb-3 text-[16px] font-semibold tracking-[-.02em]">
        {titulo}
      </h2>
      {!doTipo ? (
        <div className="flex flex-col gap-3 px-5 pb-5" aria-hidden="true">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : doTipo.length === 0 ? (
        <p className="px-5 pb-6 text-[13px] text-musgo">
          {receita ? "Nenhuma receita no período." : "Nenhuma despesa no período."}
        </p>
      ) : (
        <ul className="flex flex-col gap-4 px-5 pb-5">
          {doTipo.map((c) => {
            const valor = paraCentavos(c.total);
            const parte = total > 0 ? Math.round((valor / total) * 100) : 0;
            return (
              <li key={c.categoriaId} className="flex flex-col gap-2">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="truncate text-[14px]">{c.nome}</span>
                    <span className="flex-none font-mono text-[11px] text-musgo-2">
                      {c.quantidade} {c.quantidade === 1 ? "lançamento" : "lançamentos"}
                    </span>
                  </span>
                  <span className="flex flex-none items-baseline gap-2">
                    <span className="font-mono text-[12px] text-musgo">{parte}%</span>
                    <span className={cn("num font-mono text-[14px]", receita ? "text-verde" : "text-coral")}>
                      {formatarBRL(valor)}
                    </span>
                  </span>
                </span>
                <span className="h-1.5 overflow-hidden rounded-full bg-superficie-3" aria-hidden="true">
                  <span
                    className={cn("block h-full rounded-full", receita ? "bg-verde" : "bg-coral")}
                    style={{ width: `${Math.max(0, Math.min(100, parte))}%` }}
                  />
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

export function PaginaRelatorio() {
  useTitulo("Relatório");
  const [params, setParams] = useSearchParams();
  const [agora] = useState(() => new Date());

  const periodo = periodoDaUrl(params, agora);
  const page = numeroOuNada(params.get("pagina")) ?? 1;

  const resumo = useResumo(periodo);
  const lista = useLancamentosDoPeriodo(periodo, page);

  // Período novo volta para a página 1
  function escolher(novo: Periodo) {
    setParams({ de: novo.de, ate: novo.ate });
  }

  function mudarPagina(pagina: number) {
    const proximos = new URLSearchParams(params);
    proximos.set("pagina", String(pagina));
    setParams(proximos);
  }

  const dados = resumo.data;
  const receitas = dados ? paraCentavos(dados.receitas) : undefined;
  const despesas = dados ? paraCentavos(dados.despesas) : undefined;
  const resultado = dados ? paraCentavos(dados.resultado) : undefined;

  return (
    <>
      <PageHeader
        kicker="02 — Relatório"
        titulo="Receitas e despesas"
        destaque="por período"
        descricao="Escolha o período e veja quanto entrou, quanto saiu e em quais categorias. Transferências entre suas contas não entram nos totais: só mudam o dinheiro de lugar."
      />

      <FiltroPeriodo
        key={`${periodo.de}|${periodo.ate}`}
        periodo={periodo}
        agora={agora}
        aoMudar={escolher}
      />

      {resumo.isError ? (
        <Card>
          <ErroCarregar erro={resumo.error} aoTentar={() => void resumo.refetch()} />
        </Card>
      ) : (
        <div
          className={cn(
            "flex flex-col gap-5 transition-opacity",
            resumo.isPlaceholderData && "opacity-60",
          )}
        >
          <div className="grid gap-5 sm:grid-cols-3">
            <CartaoTotal
              rotulo="Receitas"
              valor={receitas}
              cor="text-verde"
              detalhe={lancamentos(dados?.qtdReceitas ?? 0, "entrada")}
            />
            <CartaoTotal
              rotulo="Despesas"
              valor={despesas}
              cor="text-coral"
              detalhe={lancamentos(dados?.qtdDespesas ?? 0, "saída")}
            />
            <CartaoTotal
              rotulo="Resultado"
              valor={resultado}
              cor={resultado !== undefined && resultado < 0 ? "text-coral" : "text-verde"}
              detalhe="Receitas menos despesas"
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <PorCategoria
              id="titulo-despesas-categoria"
              titulo="Despesas por categoria"
              tipo="DESPESA"
              categorias={dados?.porCategoria}
              total={despesas ?? 0}
            />
            <PorCategoria
              id="titulo-receitas-categoria"
              titulo="Receitas por categoria"
              tipo="RECEITA"
              categorias={dados?.porCategoria}
              total={receitas ?? 0}
            />
          </div>
        </div>
      )}

      <Card aria-labelledby="titulo-lancamentos" className="flex min-w-0 flex-col overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <h2 id="titulo-lancamentos" className="text-[16px] font-semibold tracking-[-.02em]">
            Lançamentos do período
          </h2>
          {lista.data && (
            <span className="font-mono text-[12px] text-musgo-2">{lista.data.total} no total</span>
          )}
        </div>

        {lista.isError ? (
          <ErroCarregar erro={lista.error} aoTentar={() => void lista.refetch()} />
        ) : !lista.data ? (
          <div className="flex flex-col gap-2 px-5 pb-5" aria-hidden="true">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        ) : lista.data.itens.length === 0 ? (
          <Empty
            icone={CalendarSearch}
            titulo="Nada lançado nesse período"
            texto="Escolha outro período ou registre lançamentos em Transações."
          />
        ) : (
          <div className={cn("transition-opacity", lista.isPlaceholderData && "opacity-60")}>
            <Table>
              <THead>
                <tr>
                  <Th>Data</Th>
                  <Th>Descrição</Th>
                  <Th>Categoria</Th>
                  <Th>Conta</Th>
                  <Th numero>Valor</Th>
                </tr>
              </THead>
              <TBody>
                {lista.data.itens.map((t) => {
                  const origem = origemAutomatica(t);
                  return (
                    <Tr key={t.id}>
                      <Td className="font-mono text-[12px] whitespace-nowrap text-musgo">
                        {formatarData(t.data)}
                      </Td>
                      <Td className="max-w-[260px]">
                        <span className="flex min-w-0 flex-col gap-1">
                          <span className="truncate">{t.descricao}</span>
                          {origem && (
                            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-musgo-2">
                              <Lock size={12} aria-hidden="true" />
                              {origem}
                              {t.transferenciaId !== null && " · fora dos totais"}
                            </span>
                          )}
                        </span>
                      </Td>
                      <Td>
                        <Badge>{t.categoria.nome}</Badge>
                      </Td>
                      <Td className="text-[13px] whitespace-nowrap text-musgo">{t.conta.nome}</Td>
                      <Td
                        numero
                        className={cn("text-[14px]", t.tipo === "RECEITA" ? "text-verde" : "text-coral")}
                      >
                        {t.tipo === "RECEITA" ? "+ " : "− "}
                        {formatarValor(t.valor)}
                      </Td>
                    </Tr>
                  );
                })}
              </TBody>
            </Table>
            <Pagination
              pagina={lista.data.pagina}
              totalPaginas={lista.data.totalPaginas}
              aoMudar={mudarPagina}
            />
          </div>
        )}
      </Card>
    </>
  );
}
