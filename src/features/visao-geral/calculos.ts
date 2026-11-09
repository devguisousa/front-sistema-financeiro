import { normalizarPagina, requisicao } from "../../lib/api";
import { diasAteVencimento, mesLocal, nomeDoMes } from "../../lib/datas";
import { paraCentavos } from "../../lib/dinheiro";
import type { ContaPagar, ContaReceber, Transacao } from "../../lib/tipos";

// A rota de resumo da API soma um período por vez. Para o gráfico de 6 meses,
// o painel junta as transações da janela página a página (100 por vez), com
// teto de 10 páginas. Os cartões do período usam a rota de resumo.
const LIMITE = 100;
const TETO_DE_PAGINAS = 10;

/** Primeiro dia (local) do mês, `meses - 1` meses atrás. */
export function inicioDaJanela(agora: Date, meses = 6): Date {
  return new Date(agora.getFullYear(), agora.getMonth() - (meses - 1), 1);
}

export async function buscarTransacoesDaJanela(
  inicio: Date,
): Promise<{ itens: Transacao[]; parcial: boolean }> {
  const itens: Transacao[] = [];

  for (let pagina = 1; pagina <= TETO_DE_PAGINAS; pagina++) {
    const resposta = await requisicao<Record<string, unknown>>("/transacao", {
      query: { page: pagina, limit: LIMITE },
    });
    const pag = normalizarPagina<Transacao>(resposta, "transacao");
    const naJanela = pag.itens.filter((t) => new Date(t.data) >= inicio);
    itens.push(...naJanela);

    // Ordem da API: data desc. Item fora da janela = acabou
    const passouDoInicio = naJanela.length < pag.itens.length;
    if (passouDoInicio || pagina >= pag.totalPaginas) return { itens, parcial: false };
  }

  return { itens, parcial: true };
}

export type ResumoMes = {
  mes: string; // "AAAA-MM"
  rotulo: string; // "nov"
  receitas: number; // centavos
  despesas: number;
  qtdReceitas: number;
  qtdDespesas: number;
};

/**
 * Receitas e despesas por mês local, do mais antigo ao atual. Ignora as
 * transações de transferência: cada uma gera uma despesa e uma receita e
 * dobraria o movimento do mês.
 */
export function resumirMeses(transacoes: Transacao[], agora: Date, meses = 6): ResumoMes[] {
  const resumo = new Map<string, ResumoMes>();

  for (let i = meses - 1; i >= 0; i--) {
    const data = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
    const mes = mesLocal(data.toISOString());
    resumo.set(mes, { mes, rotulo: nomeDoMes(mes), receitas: 0, despesas: 0, qtdReceitas: 0, qtdDespesas: 0 });
  }

  for (const t of transacoes) {
    if (t.transferenciaId !== null) continue;
    const linha = resumo.get(mesLocal(t.data));
    if (!linha) continue;

    if (t.tipo === "RECEITA") {
      linha.receitas += paraCentavos(t.valor);
      linha.qtdReceitas += 1;
    } else {
      linha.despesas += paraCentavos(t.valor);
      linha.qtdDespesas += 1;
    }
  }

  return [...resumo.values()];
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
