import { normalizarPagina, requisicao } from "../../lib/api";
import { diaLocalDe, diasAteVencimento, nomeDoMes } from "../../lib/datas";
import { paraCentavos } from "../../lib/dinheiro";
import type {
  ContaPagar,
  ContaReceber,
  ResumoCategoria,
  TipoTransacao,
  Transacao,
} from "../../lib/tipos";
import {
  diasDoPeriodo,
  formatarDia,
  limitesParaApi,
  type Periodo,
  somarDias,
  ultimoDiaDoMes,
} from "../relatorio/periodos";

// Os cartões usam a rota de resumo (soma na API). Os gráficos de fluxo e de
// resultado acumulado precisam das transações do período: o painel busca
// todas, 100 por página, com teto de 20 páginas (acima disso, dados parciais).
const LIMITE = 100;
const TETO_DE_PAGINAS = 20;

type PaginaDoPeriodo = { itens: Transacao[]; totalPaginas: number };

async function paginaDoPeriodo(periodo: Periodo, page: number): Promise<PaginaDoPeriodo> {
  const resposta = await requisicao<Record<string, unknown>>("/transacao", {
    query: { ...limitesParaApi(periodo), page, limit: LIMITE },
  });
  return normalizarPagina<Transacao>(resposta, "transacao");
}

/** Todas as transações do período: a primeira página diz quantas faltam, o resto vem junto. */
export async function buscarTransacoesDoPeriodo(
  periodo: Periodo,
): Promise<{ itens: Transacao[]; parcial: boolean }> {
  const primeira = await paginaDoPeriodo(periodo, 1);
  const ultima = Math.min(primeira.totalPaginas, TETO_DE_PAGINAS);

  const resto = await Promise.all(
    Array.from({ length: Math.max(0, ultima - 1) }, (_, i) => paginaDoPeriodo(periodo, i + 2)),
  );

  return {
    itens: [primeira, ...resto].flatMap((p) => p.itens),
    parcial: primeira.totalPaginas > TETO_DE_PAGINAS,
  };
}

export type Granularidade = "dia" | "semana" | "mes";

/** Tamanho de cada barra do fluxo: dia até 31 dias, semana até 92, mês acima disso. */
export function granularidade(periodo: Periodo): Granularidade {
  const dias = diasDoPeriodo(periodo);
  if (dias <= 31) return "dia";
  if (dias <= 92) return "semana";
  return "mes";
}

export type Balde = {
  inicio: string; // "AAAA-MM-DD", entra
  fim: string; // entra
  rotulo: string; // eixo: "03/11", "nov", "nov/25"
  nome: string; // dica e tabela: "03/11/2026", "03/11 a 09/11", "Novembro de 2026"
  receitas: number; // centavos
  despesas: number;
  qtdReceitas: number;
  qtdDespesas: number;
};

const diaMes = (dia: string) => formatarDia(dia).slice(0, 5); // "03/11"

const mesPorExtenso = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

function nomeDoMesInteiro(dia: string): string {
  const [ano = 0, mes = 1] = dia.split("-").map(Number);
  const texto = mesPorExtenso.format(new Date(ano, mes - 1, 1));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

type Molde = Pick<Balde, "inicio" | "fim" | "rotulo" | "nome">;

/** Baldes vazios que cobrem o período, do primeiro ao último dia. */
function baldesVazios(periodo: Periodo): Molde[] {
  const tipo = granularidade(periodo);
  const lista: Molde[] = [];
  const cruzaAnos = periodo.de.slice(0, 4) !== periodo.ate.slice(0, 4);

  let inicio = periodo.de;
  while (inicio <= periodo.ate) {
    let fim: string;
    if (tipo === "dia") fim = inicio;
    else if (tipo === "semana") fim = somarDias(inicio, 6);
    else fim = ultimoDiaDoMes(inicio);
    if (fim > periodo.ate) fim = periodo.ate;

    if (tipo === "dia") {
      lista.push({ inicio, fim, rotulo: diaMes(inicio), nome: formatarDia(inicio) });
    } else if (tipo === "semana") {
      lista.push({ inicio, fim, rotulo: diaMes(inicio), nome: `${diaMes(inicio)} a ${diaMes(fim)}` });
    } else {
      const mes = nomeDoMes(inicio.slice(0, 7));
      lista.push({
        inicio,
        fim,
        rotulo: cruzaAnos ? `${mes}/${inicio.slice(2, 4)}` : mes,
        nome: nomeDoMesInteiro(inicio),
      });
    }

    inicio = somarDias(fim, 1);
  }

  return lista;
}

/**
 * Receitas e despesas do período em baldes de dia, semana ou mês (dia local).
 * Ignora as transações de transferência: cada uma gera uma despesa e uma
 * receita e dobraria o movimento.
 */
export function agruparFluxo(transacoes: Transacao[], periodo: Periodo): Balde[] {
  const baldes: Balde[] = baldesVazios(periodo).map((b) => ({
    ...b,
    receitas: 0,
    despesas: 0,
    qtdReceitas: 0,
    qtdDespesas: 0,
  }));

  for (const t of transacoes) {
    if (t.transferenciaId !== null) continue;
    const dia = diaLocalDe(t.data);
    const balde = baldes.find((b) => b.inicio <= dia && dia <= b.fim);
    if (!balde) continue;

    if (t.tipo === "RECEITA") {
      balde.receitas += paraCentavos(t.valor);
      balde.qtdReceitas += 1;
    } else {
      balde.despesas += paraCentavos(t.valor);
      balde.qtdDespesas += 1;
    }
  }

  return baldes;
}

/** Balde do gráfico de linhas: sem valor (null) quando ainda não chegou. */
export type PontoFluxo = Omit<Balde, "receitas" | "despesas"> & {
  receitas: number | null;
  despesas: number | null;
};

/**
 * Para o gráfico de linhas: baldes que começam depois de hoje e não têm
 * lançamento ficam sem valor, e a linha para em vez de cair para zero.
 */
export function cortarFuturo(baldes: Balde[], hoje: string): PontoFluxo[] {
  return baldes.map((b) =>
    b.inicio > hoje && b.qtdReceitas + b.qtdDespesas === 0 ? { ...b, receitas: null, despesas: null } : b,
  );
}

export type PontoAcumulado = {
  dia: string; // "AAAA-MM-DD"
  rotulo: string; // "03/11"
  nome: string; // "03/11/2026"
  doDia: number; // receitas menos despesas do dia, em centavos
  acumulado: number; // desde o início do período
  qtd: number; // lançamentos do dia
};

/**
 * Resultado (receitas menos despesas) somado dia a dia desde o início do
 * período. Para em hoje, a não ser que haja lançamento depois; nunca passa
 * do fim do período. Transferências ficam de fora.
 */
export function acumularPorDia(transacoes: Transacao[], periodo: Periodo, hoje: string): PontoAcumulado[] {
  const porDia = new Map<string, { doDia: number; qtd: number }>();
  let ultimoLancamento = "";

  for (const t of transacoes) {
    if (t.transferenciaId !== null) continue;
    const dia = diaLocalDe(t.data);
    if (dia < periodo.de || dia > periodo.ate) continue;

    const linha = porDia.get(dia) ?? { doDia: 0, qtd: 0 };
    linha.doDia += (t.tipo === "RECEITA" ? 1 : -1) * paraCentavos(t.valor);
    linha.qtd += 1;
    porDia.set(dia, linha);
    if (dia > ultimoLancamento) ultimoLancamento = dia;
  }

  const ultimoDia = ultimoLancamento > hoje ? ultimoLancamento : hoje;
  const ate = ultimoDia < periodo.ate ? ultimoDia : periodo.ate;
  const pontos: PontoAcumulado[] = [];
  let acumulado = 0;

  for (let dia = periodo.de; dia <= ate; dia = somarDias(dia, 1)) {
    const { doDia, qtd } = porDia.get(dia) ?? { doDia: 0, qtd: 0 };
    acumulado += doDia;
    pontos.push({ dia, rotulo: diaMes(dia), nome: formatarDia(dia), doDia, acumulado, qtd });
  }

  return pontos;
}

export type FatiaCategoria = {
  chave: string; // id da categoria ou "outras"
  nome: string;
  total: number; // centavos
  quantidade: number;
  parte: number; // % do total do tipo
};

/** Até 7 fatias: com mais de 7 categorias, as 6 maiores e o resto junto em "Outras". */
const MAX_FATIAS = 7;

/** Categorias do tipo, da maior para a menor, com a parte de cada uma no total. */
export function fatiasPorCategoria(categorias: ResumoCategoria[], tipo: TipoTransacao): FatiaCategoria[] {
  const doTipo = categorias
    .filter((c) => c.tipo === tipo)
    .map((c) => ({ chave: String(c.categoriaId), nome: c.nome, total: paraCentavos(c.total), quantidade: c.quantidade }))
    .sort((a, b) => b.total - a.total);

  const soma = doTipo.reduce((s, c) => s + c.total, 0);
  const comParte = (c: Omit<FatiaCategoria, "parte">): FatiaCategoria => ({
    ...c,
    parte: soma > 0 ? (c.total / soma) * 100 : 0,
  });

  if (doTipo.length <= MAX_FATIAS) return doTipo.map(comParte);

  const resto = doTipo.slice(MAX_FATIAS - 1);
  return [
    ...doTipo.slice(0, MAX_FATIAS - 1).map(comParte),
    comParte({
      chave: "outras",
      nome: `Outras (${resto.length})`,
      total: resto.reduce((s, c) => s + c.total, 0),
      quantidade: resto.reduce((s, c) => s + c.quantidade, 0),
    }),
  ];
}

/** Variação percentual sobre o período anterior; null quando o anterior é zero. */
export function variacao(atual: number, anterior: number): number | null {
  if (anterior === 0) return null;
  return ((atual - anterior) / Math.abs(anterior)) * 100;
}

export type Vencimento = {
  id: number;
  tipo: "pagar" | "receber";
  descricao: string;
  restante: number; // centavos
  vencimento: string;
  diasAte: number;
};

/** Contas não quitadas que vencem em até `dias` dias (vencidas incluídas). */
export function proximosVencimentos(
  pagar: ContaPagar[],
  receber: ContaReceber[],
  agora: Date,
  dias = 15,
): Vencimento[] {
  const lista: Vencimento[] = [
    ...pagar
      .filter((c) => c.status !== "PAGA")
      .map((c) => ({
        id: c.id,
        tipo: "pagar" as const,
        descricao: c.descricao,
        restante: paraCentavos(c.valorTotal) - paraCentavos(c.valorPago),
        vencimento: c.vencimento,
        diasAte: diasAteVencimento(c.vencimento, agora),
      })),
    ...receber
      .filter((c) => c.status !== "RECEBIDA")
      .map((c) => ({
        id: c.id,
        tipo: "receber" as const,
        descricao: c.descricao,
        restante: paraCentavos(c.valorTotal) - paraCentavos(c.valorRecebido),
        vencimento: c.vencimento,
        diasAte: diasAteVencimento(c.vencimento, agora),
      })),
  ];

  return lista.filter((v) => v.diasAte <= dias).sort((a, b) => a.diasAte - b.diasAte);
}
