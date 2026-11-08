import type {
  Baixa,
  Categoria,
  Conta,
  ContaPagar,
  ContaReceber,
  Saldo,
  Transacao,
  Transferencia,
  Usuario,
} from "../lib/tipos";

export const ADMIN: Usuario = {
  id: 1,
  email: "admin@fluxo.dev",
  papel: "ADMIN",
  criadoEm: "2026-11-01T12:00:00.000Z",
};

export const USUARIO: Usuario = {
  id: 2,
  email: "ana@fluxo.dev",
  papel: "USUARIO",
  criadoEm: "2026-11-02T12:00:00.000Z",
};

// ---- fábricas: um objeto válido da API, com o que o teste quiser trocar


export const conta = (o: Partial<Conta> = {}): Conta => ({
  id: 1,
  nome: "Banco",
  saldoInicial: "0.00",
  criadoEm: "2026-10-01T12:00:00.000Z",
  saldoDefinidoEm: null,
  ...o,
});

export const saldo = (o: Partial<Saldo> = {}): Saldo => ({
  contaId: 1,
  saldoInicial: "0.00",
  totalReceitas: "0.00",
  totalDespesas: "0.00",
  saldoAtual: "0.00",
  saldoDefinidoEm: null,
  ...o,
});

export const baixa = (o: Partial<Baixa> = {}): Baixa => ({
  id: 1,
  valor: "100.00",
  data: "2026-11-03T15:00:00.000Z",
  contaId: 1,
  ...o,
});

export const categoria = (o: Partial<Categoria> = {}): Categoria => ({
  id: 1,
  nome: "Vendas",
  tipo: "RECEITA",
  ...o,
});

export const transacao = (o: Partial<Transacao> = {}): Transacao => ({
  id: 1,
  descricao: "Venda",
  valor: "100.00",
  tipo: "RECEITA",
  data: "2026-11-03T15:00:00.000Z",
  contaId: 1,
  categoriaId: 1,
  pagamentoContaPagarId: null,
  recebimentoId: null,
  transferenciaId: null,
  conta: { id: 1, nome: "Banco" },
  categoria: { id: 1, nome: "Vendas", tipo: "RECEITA" },
  ...o,
});

export const transferencia = (o: Partial<Transferencia> = {}): Transferencia => ({
  id: 1,
  valor: "100.00",
  descricao: "Transferência entre contas",
  data: "2026-11-03T15:00:00.000Z",
  contaOrigemId: 1,
  contaDestinoId: 2,
  transacoes: [],
  ...o,
});

export const contaPagar = (o: Partial<ContaPagar> = {}): ContaPagar => ({
  id: 1,
  descricao: "Aluguel",
  valorTotal: "300.00",
  valorPago: "0.00",
  vencimento: "2026-11-10T00:00:00.000Z",
  status: "PENDENTE",
  criadoEm: "2026-11-01T12:00:00.000Z",
  ...o,
});

export const contaReceber = (o: Partial<ContaReceber> = {}): ContaReceber => ({
  id: 1,
  descricao: "Cliente A",
  valorTotal: "500.00",
  valorRecebido: "0.00",
  vencimento: "2026-11-10T00:00:00.000Z",
  status: "PENDENTE",
  criadoEm: "2026-11-01T12:00:00.000Z",
  ...o,
});

/** Resposta de listagem no formato da API ({ [chave]: itens, pagina, total, totalPaginas }). */
export function listagem<T>(chave: string, itens: T[], extra: Record<string, unknown> = {}) {
  return {
    status: 200,
    corpo: { [chave]: itens, pagina: 1, limite: 20, total: itens.length, totalPaginas: 1, ...extra },
  };
}

/** API sem nenhum dado (para testes que só passam por uma tela). */
export const apiVazia = {
  "GET /contas": () => listagem("contas", []),
  "GET /categoria": () => listagem("categoria", []),
  "GET /contaPagar": () => listagem("contaPagar", []),
  "GET /contaReceber": () => listagem("contaReceber", [], { totalPagina: 1 }),
  "GET /transacao": () => listagem("transacao", []),
  "GET /transferencias": () => listagem("transferencias", []),
};

export const painelVazio = apiVazia;
