import { chaves } from "../../lib/queryClient";
import type { ContaPagar, ContaReceber, TipoTransacao } from "../../lib/tipos";

export type Situacao = "pendente" | "parcial" | "quitado";

/** Conta a pagar ou a receber num formato só. */
export type Compromisso = {
  id: number;
  descricao: string;
  valorTotal: string;
  valorQuitado: string; // valorPago | valorRecebido
  vencimento: string;
  situacao: Situacao;
};

export type ConfigCompromisso = {
  tela: "Contas a pagar" | "Contas a receber";
  kicker: string;
  descricao: string;
  recurso: "/contaPagar" | "/contaReceber";
  chaveLista: "contaPagar" | "contaReceber";
  /** contaPagar usa page/limit; contaReceber usa pagina/limite */
  paginacao: "page" | "pagina";
  statusApi: Record<Situacao, string>;
  rotuloSituacao: Record<Situacao, string>;
  rotaBaixa(id: number): string;
  /** Pagamentos/recebimentos já feitos de um compromisso (usa pagina/limite) */
  rotaBaixas(id: number): string;
  chaveBaixas: "pagamentoContaPagar" | "recebimentos";
  /** Apaga um pagamento/recebimento e desfaz o efeito dele */
  rotaApagarBaixa(id: number): string;
  tipoCategoria: TipoTransacao;
  maxDescricao: number;
  textos: {
    novo: string; // "Nova conta a pagar"
    editar: string;
    salvo: string;
    apagado: string;
    baixa: string; // "Registrar pagamento"
    baixaFeita: string;
    quitado: string; // "Pago" (coluna)
    contaDaBaixa: string; // "Sai da conta"
    categoriaDaBaixa: string;
    vazio: string;
    historico: string; // "Pagamentos feitos"
    semBaixas: string;
    apagarBaixa: string; // "Apagar pagamento"
    baixaApagada: string;
    /** O que acontece ao apagar (texto da confirmação) */
    efeitoApagar: string;
    /** Idem, quando o saldo da conta foi digitado depois da baixa */
    efeitoApagarSemSaldo: string;
  };
  chaveQuery: readonly string[];
  normalizar(item: unknown): Compromisso;
};

function situacaoDe(status: string, statusApi: Record<Situacao, string>): Situacao {
  if (status === statusApi.quitado) return "quitado";
  if (status === statusApi.parcial) return "parcial";
  return "pendente";
}

const STATUS_PAGAR = { pendente: "PENDENTE", parcial: "PARCIALMENTE_PAGA", quitado: "PAGA" };
const STATUS_RECEBER = { pendente: "PENDENTE", parcial: "PARCIALMENTE_RECEBIDA", quitado: "RECEBIDA" };

export const configPagar: ConfigCompromisso = {
  tela: "Contas a pagar",
  kicker: "04 — Compromissos",
  descricao: "Pague de uma vez ou em partes. O status se atualiza sozinho a cada pagamento.",
  recurso: "/contaPagar",
  chaveLista: "contaPagar",
  paginacao: "page",
  statusApi: STATUS_PAGAR,
  rotuloSituacao: { pendente: "Pendente", parcial: "Parcial", quitado: "Paga" },
  rotaBaixa: (id) => `/pagamentoPagar/contaPagar/${id}`,
  rotaBaixas: (id) => `/pagamentoPagar/contaPagar/${id}`,
  chaveBaixas: "pagamentoContaPagar",
  rotaApagarBaixa: (id) => `/pagamentoPagar/${id}`,
  tipoCategoria: "DESPESA",
  maxDescricao: 150,
  textos: {
    novo: "Nova conta a pagar",
    editar: "Editar conta a pagar",
    salvo: "Conta a pagar salva",
    apagado: "Conta a pagar apagada",
    baixa: "Registrar pagamento",
    baixaFeita: "Pagamento registrado",
    quitado: "Pago",
    contaDaBaixa: "Sai da conta",
    categoriaDaBaixa: "Categoria (despesa)",
    vazio: "Nenhuma conta a pagar",
    historico: "Pagamentos feitos",
    semBaixas: "Nenhum pagamento registrado.",
    apagarBaixa: "Apagar pagamento",
    baixaApagada: "Pagamento apagado",
    efeitoApagar: "O valor volta para a conta de onde saiu e a conta a pagar fica em aberto de novo.",
    efeitoApagarSemSaldo:
      "A conta a pagar fica em aberto de novo. O saldo da conta não muda, porque você o definiu depois deste pagamento.",
  },
  chaveQuery: chaves.contasPagar,
  normalizar: (item) => {
    const c = item as ContaPagar;
    return {
      id: c.id,
      descricao: c.descricao,
      valorTotal: c.valorTotal,
      valorQuitado: c.valorPago,
      vencimento: c.vencimento,
      situacao: situacaoDe(c.status, STATUS_PAGAR),
    };
  },
};

export const configReceber: ConfigCompromisso = {
  tela: "Contas a receber",
  kicker: "05 — Compromissos",
  descricao: "Receba de uma vez ou em partes. O status se atualiza sozinho a cada recebimento.",
  recurso: "/contaReceber",
  chaveLista: "contaReceber",
  paginacao: "pagina",
  statusApi: STATUS_RECEBER,
  rotuloSituacao: { pendente: "Pendente", parcial: "Parcial", quitado: "Recebida" },
  rotaBaixa: (id) => `/contaReceber/${id}/recebimentos`,
  rotaBaixas: (id) => `/contaReceber/${id}/recebimentos`,
  chaveBaixas: "recebimentos",
  rotaApagarBaixa: (id) => `/recebimentos/${id}`,
  tipoCategoria: "RECEITA",
  maxDescricao: 200,
  textos: {
    novo: "Nova conta a receber",
    editar: "Editar conta a receber",
    salvo: "Conta a receber salva",
    apagado: "Conta a receber apagada",
    baixa: "Registrar recebimento",
    baixaFeita: "Recebimento registrado",
    quitado: "Recebido",
    contaDaBaixa: "Entra na conta",
    categoriaDaBaixa: "Categoria (receita)",
    vazio: "Nenhuma conta a receber",
    historico: "Recebimentos feitos",
    semBaixas: "Nenhum recebimento registrado.",
    apagarBaixa: "Apagar recebimento",
    baixaApagada: "Recebimento apagado",
    efeitoApagar: "O valor sai da conta onde entrou e a conta a receber fica em aberto de novo.",
    efeitoApagarSemSaldo:
      "A conta a receber fica em aberto de novo. O saldo da conta não muda, porque você o definiu depois deste recebimento.",
  },
  chaveQuery: chaves.contasReceber,
  normalizar: (item) => {
    const c = item as ContaReceber;
    return {
      id: c.id,
      descricao: c.descricao,
      valorTotal: c.valorTotal,
      valorQuitado: c.valorRecebido,
      vencimento: c.vencimento,
      situacao: situacaoDe(c.status, STATUS_RECEBER),
    };
  },
};
