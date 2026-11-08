// Formatos das respostas da API sistema_financeiro.
// Dinheiro sempre chega como texto com 2 casas ("150.50"); datas como ISO.

export type Papel = "ADMIN" | "USUARIO";
export type TipoTransacao = "RECEITA" | "DESPESA";

export type Usuario = {
  id: number;
  email: string;
  papel: Papel;
  criadoEm: string;
};

export type Tokens = { accessToken: string; refreshToken: string };

export type Conta = {
  id: number;
  nome: string;
  saldoInicial: string;
  criadoEm: string;
  /** Quando a pessoa digitou o saldo na edição (null = nunca). */
  saldoDefinidoEm: string | null;
};

/**
 * Saldo de uma conta. Com saldoDefinidoEm, saldoInicial é o valor digitado e
 * receitas/despesas contam só o que foi lançado depois.
 */
export type Saldo = {
  contaId: number;
  saldoInicial: string;
  totalReceitas: string;
  totalDespesas: string;
  saldoAtual: string;
  saldoDefinidoEm: string | null;
};

/** Pagamento de conta a pagar ou recebimento de conta a receber. */
export type Baixa = {
  id: number;
  valor: string;
  data: string;
  contaId: number;
};

export type Categoria = { id: number; nome: string; tipo: TipoTransacao };

export type Transacao = {
  id: number;
  descricao: string;
  valor: string;
  tipo: TipoTransacao;
  data: string;
  contaId: number;
  categoriaId: number;
  pagamentoContaPagarId: number | null;
  recebimentoId: number | null;
  transferenciaId: number | null;
  conta: { id: number; nome: string };
  categoria: { id: number; nome: string; tipo: TipoTransacao };
};

/** GET /transacao/resumo: totais do período (transferências ficam de fora). */
export type ResumoCategoria = {
  categoriaId: number;
  nome: string;
  tipo: TipoTransacao;
  total: string;
  quantidade: number;
};

export type ResumoPeriodo = {
  inicio: string;
  fim: string;
  receitas: string;
  despesas: string;
  resultado: string;
  qtdReceitas: number;
  qtdDespesas: number;
  porCategoria: ResumoCategoria[];
};

export type Transferencia = {
  id: number;
  valor: string;
  descricao: string;
  data: string;
  contaOrigemId: number;
  contaDestinoId: number;
  transacoes: { id: number; tipo: TipoTransacao; contaId: number }[];
};

export type StatusContaPagar = "PENDENTE" | "PARCIALMENTE_PAGA" | "PAGA";
export type StatusContaReceber =
  | "PENDENTE"
  | "PARCIALMENTE_RECEBIDA"
  | "RECEBIDA";

export type ContaPagar = {
  id: number;
  descricao: string;
  valorTotal: string;
  valorPago: string;
  vencimento: string;
  status: StatusContaPagar;
  criadoEm: string;
};

export type ContaReceber = {
  id: number;
  descricao: string;
  valorTotal: string;
  valorRecebido: string;
  vencimento: string;
  status: StatusContaReceber;
  criadoEm: string;
};

/** Paginação normalizada (a API usa nomes diferentes em cada recurso). */
export type Pagina<T> = {
  itens: T[];
  pagina: number;
  totalPaginas: number;
  total: number;
};
