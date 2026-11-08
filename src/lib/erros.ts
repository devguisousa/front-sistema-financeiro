export type DetalheErro = { path: (string | number)[]; message: string };

/** Erro de uma chamada à API. status 0 = falha de rede. */
export class ErroApi extends Error {
  readonly status: number;
  readonly codigo: string;
  readonly detalhes: DetalheErro[];

  constructor(status: number, codigo: string, detalhes: DetalheErro[] = []) {
    super(codigo);
    this.name = "ErroApi";
    this.status = status;
    this.codigo = codigo;
    this.detalhes = detalhes;
  }
}

const CONFLITO = "CONFLITO DE CONCORRÊNCIA, TENTE NOVAMENTE";
const CATEGORIA_DE_OUTRO_TIPO = "A categoria não combina com o tipo do lançamento.";

// Códigos da API → mensagens para a pessoa (lista completa: grep 'erro: "' no back-end)
const MENSAGENS: Record<string, string> = {
  "SALDO INSUFICIENTE": "Saldo insuficiente nesta conta.",
  "SALDO INSUFICIENTE NA CONTA DE DESTINO": "A conta de destino ficaria negativa.",
  "USUÁRIO OU SENHA INCORRETOS": "E-mail ou senha incorretos.",
  "USUÁRIO JÁ EXISTE": "Já existe um usuário com este e-mail.",
  "JÁ EXISTE UM ADMINISTRADOR": "O administrador já foi criado. Entre com seu e-mail e senha.",
  "SENHA ATUAL INCORRETA": "Senha atual incorreta.",
  "CATEGORIA EM USO": "Esta categoria tem lançamentos e não pode ser apagada.",
  "CATEGORIA EM USO NÃO PODE MUDAR DE TIPO": "Esta categoria tem lançamentos e não pode mudar de tipo.",
  "CATEGORIA JÁ EXISTE": "Já existe uma categoria com esse nome.",
  "NOME DE CATEGORIA RESERVADO PELO SISTEMA": "Esse nome é usado pelo sistema. Escolha outro.",
  "CATEGORIA NÃO É DO TIPO DA TRANSAÇÃO": CATEGORIA_DE_OUTRO_TIPO,
  "CATEGORIA NÃO É DO TIPO DESPESA": CATEGORIA_DE_OUTRO_TIPO,
  "CATEGORIA NÃO É DO TIPO RECEITA": CATEGORIA_DE_OUTRO_TIPO,
  "CONTA POSSUI MOVIMENTAÇÕES": "Esta conta tem movimentações e não pode ser apagada.",
  "CONTA A PAGAR POSSUI PAGAMENTOS": "Já há pagamentos registrados. Apague-os antes pelo histórico.",
  "CONTA A RECEBER POSSUI RECEBIMENTOS": "Já há recebimentos registrados. Apague-os antes pelo histórico.",
  "CONTA JÁ QUITADA": "Esta conta já está quitada.",
  "CONTA JÁ RECEBIDA": "Esta conta já foi recebida.",
  "PAGAMENTO MAIOR QUE O SALDO PENDENTE": "O valor passa do que falta pagar.",
  "RECEBIMENTO MAIOR QUE O SALDO PENDENTE": "O valor passa do que falta receber.",
  "VALOR TOTAL MENOR QUE O JÁ PAGO": "O total não pode ser menor que o já pago.",
  "VALOR TOTAL MENOR QUE O JÁ RECEBIDO": "O total não pode ser menor que o já recebido.",
  "NÃO É POSSÍVEL REMOVER O ÚLTIMO ADMIN": "É preciso manter pelo menos um administrador.",
  "VALOR DEVE SER MAIOR QUE ZERO": "O valor deve ser maior que zero.",
  "REFRESH TOKEN REUTILIZADO": "Sua sessão foi encerrada por segurança. Entre de novo.",
  "ERRO INTERNO DO SERVIDOR": "O servidor teve um problema. Tente de novo em instantes.",
};

/** "CONTA NÃO ENCONTRADA" → "Conta não encontrada" */
function capitalizar(codigo: string): string {
  const minusculo = codigo.toLocaleLowerCase("pt-BR");
  return minusculo.charAt(0).toLocaleUpperCase("pt-BR") + minusculo.slice(1);
}

/** Mensagem amigável para qualquer erro vindo de uma chamada. */
export function mensagemDoErro(erro: unknown): string {
  if (!(erro instanceof ErroApi)) return "Algo deu errado. Tente de novo.";

  if (erro.status === 0) return "Sem conexão com o servidor.";
  if (erro.status === 403) return "Você não tem permissão para isso.";
  if (erro.status === 429) return "Muitas tentativas. Aguarde alguns minutos.";
  if (erro.codigo === CONFLITO) return "Outra pessoa alterou este registro. Tente de novo.";

  return MENSAGENS[erro.codigo] ?? capitalizar(erro.codigo);
}

/** Separa erros de validação (por campo) do erro geral do formulário. */
export function separarErros(erro: unknown): {
  campos: Record<string, string>;
  geral: string | null;
} {
  if (erro instanceof ErroApi && erro.status === 400 && erro.detalhes.length > 0) {
    const campos: Record<string, string> = {};
    for (const detalhe of erro.detalhes) {
      const campo = String(detalhe.path[0] ?? "");
      if (campo && !(campo in campos)) campos[campo] = detalhe.message;
    }
    return { campos, geral: Object.keys(campos).length ? null : mensagemDoErro(erro) };
  }

  return { campos: {}, geral: mensagemDoErro(erro) };
}
