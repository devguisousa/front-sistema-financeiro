import { describe, expect, it } from "vitest";
import { ErroApi, mensagemDoErro, separarErros } from "./erros";

describe("mensagemDoErro", () => {
  it.each([
    [new ErroApi(0, "SEM CONEXÃO"), "Sem conexão com o servidor."],
    [new ErroApi(403, "ACESSO NEGADO"), "Você não tem permissão para isso."],
    [
      new ErroApi(429, "MUITAS TENTATIVAS. TENTE NOVAMENTE EM ALGUNS MINUTOS."),
      "Muitas tentativas. Aguarde alguns minutos.",
    ],
    [
      new ErroApi(409, "CONFLITO DE CONCORRÊNCIA, TENTE NOVAMENTE"),
      "Outra pessoa alterou este registro. Tente de novo.",
    ],
    [new ErroApi(409, "SALDO INSUFICIENTE"), "Saldo insuficiente nesta conta."],
    [new ErroApi(404, "CONTA NÃO ENCONTRADA"), "Conta não encontrada"],
    [new Error("qualquer"), "Algo deu errado. Tente de novo."],
  ])("%s → %s", (erro, mensagem) => {
    expect(mensagemDoErro(erro)).toBe(mensagem);
  });
});

describe("separarErros", () => {
  it("400 com detalhes vira erro por campo", () => {
    const erro = new ErroApi(400, "DADOS INVÁLIDOS", [
      { path: ["valor"], message: "Valor inválido" },
      { path: ["valor"], message: "O valor deve ser maior que zero" },
      { path: ["descricao"], message: "Descrição obrigatória" },
    ]);

    expect(separarErros(erro)).toEqual({
      campos: { valor: "Valor inválido", descricao: "Descrição obrigatória" },
      geral: null,
    });
  });

  it("erro de regra vira mensagem geral", () => {
    expect(separarErros(new ErroApi(409, "SALDO INSUFICIENTE"))).toEqual({
      campos: {},
      geral: "Saldo insuficiente nesta conta.",
    });
  });
});
