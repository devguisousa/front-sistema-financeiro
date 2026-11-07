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
