import { describe, expect, it } from "vitest";
import { mockFetch } from "../../test/fetch";
import { contaPagar, contaReceber, transacao } from "../../test/dados";
import { definirSessao } from "../../lib/api";
import {
  buscarTransacoesDaJanela,
  inicioDaJanela,
  proximosVencimentos,
  resumirMeses,
  variacao,
} from "./calculos";

const AGORA = new Date("2026-11-07T15:00:00.000Z"); // 07/11 12h em Brasília

describe("resumirMeses", () => {
  it("agrupa por mês local e ignora transferências", () => {
    const meses = resumirMeses(
      [
        transacao({ valor: "100.00", data: "2026-11-01T02:00:00.000Z" }), // 31/10 em Brasília
        transacao({ valor: "50.00", data: "2026-11-05T15:00:00.000Z", transferenciaId: 3 }),
        transacao({ tipo: "DESPESA", valor: "30.10", data: "2026-11-06T15:00:00.000Z" }),
        transacao({ tipo: "DESPESA", valor: "0.20", data: "2026-11-06T16:00:00.000Z" }),
      ],
      AGORA,
    );

    const outubro = meses.find((m) => m.mes === "2026-10");
    const novembro = meses.find((m) => m.mes === "2026-11");
    expect(outubro).toMatchObject({ receitas: 10000, qtdReceitas: 1, despesas: 0 });
    expect(novembro).toMatchObject({ receitas: 0, despesas: 3030, qtdDespesas: 2 });
  });

  it("seis meses do mais antigo ao atual, com zeros", () => {
    const meses = resumirMeses([], AGORA);

    expect(meses.map((m) => m.mes)).toEqual([
      "2026-06",
      "2026-07",
      "2026-08",
      "2026-09",
      "2026-10",
      "2026-11",
    ]);
    expect(meses[5]).toMatchObject({ rotulo: "nov", receitas: 0, despesas: 0 });
  });

  it("janela começa no primeiro dia do mês, cinco meses atrás, no fuso local", () => {
    expect(inicioDaJanela(AGORA).toISOString()).toBe("2026-06-01T03:00:00.000Z");
  });
});

describe("variacao", () => {
  it("percentual sobre o mês anterior", () => {
    expect(variacao(150, 100)).toBe(50);
    expect(variacao(50, 100)).toBe(-50);
    expect(variacao(-50, -100)).toBe(50);
  });

  it("mês anterior zero dá null", () => {
    expect(variacao(150, 0)).toBeNull();
  });
});

describe("proximosVencimentos", () => {
  it("inclui vencidas, exclui quitadas e as que vencem depois de 15 dias", () => {
    const lista = proximosVencimentos(
      [
        contaPagar({ id: 1, descricao: "Vencida", vencimento: "2026-11-05T00:00:00.000Z" }),
        contaPagar({ id: 2, descricao: "Quitada", status: "PAGA", valorPago: "300.00" }),
        contaPagar({ id: 3, descricao: "Longe", vencimento: "2026-11-30T00:00:00.000Z" }),
      ],
      [
        contaReceber({
          id: 9,
          descricao: "Parcial",
          vencimento: "2026-11-22T00:00:00.000Z",
          valorRecebido: "100.50",
          status: "PARCIALMENTE_RECEBIDA",
        }),
      ],
      AGORA,
    );

    expect(lista).toEqual([
      expect.objectContaining({ tipo: "pagar", descricao: "Vencida", diasAte: -2, restante: 30000 }),
      expect.objectContaining({ tipo: "receber", descricao: "Parcial", diasAte: 15, restante: 39950 }),
    ]);
  });
});

describe("buscarTransacoesDaJanela", () => {
  it("para ao passar do início e descarta o que é mais antigo", async () => {
    definirSessao({ accessToken: "A", refreshToken: "R" });
    const fetch = mockFetch({
      "GET /transacao": () => ({
        status: 200,
        corpo: {
          transacao: [
            transacao({ id: 1, data: "2026-11-01T15:00:00.000Z" }),
            transacao({ id: 2, data: "2026-05-20T15:00:00.000Z" }),
          ],
          pagina: 1,
          total: 300,
          totalPaginas: 3,
        },
      }),
    });

    const resultado = await buscarTransacoesDaJanela(inicioDaJanela(AGORA));

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(resultado).toEqual({ itens: [expect.objectContaining({ id: 1 })], parcial: false });
  });

  it("teto de 10 páginas marca dados parciais", async () => {
    definirSessao({ accessToken: "A", refreshToken: "R" });
    const fetch = mockFetch({
      "GET /transacao": ({ query }) => ({
        status: 200,
        corpo: {
          transacao: [transacao({ id: Number(query.get("page")), data: "2026-11-01T15:00:00.000Z" })],
          pagina: Number(query.get("page")),
          total: 1200,
          totalPaginas: 12,
        },
      }),
    });

    const resultado = await buscarTransacoesDaJanela(inicioDaJanela(AGORA));

    expect(fetch).toHaveBeenCalledTimes(10);
    expect(String(fetch.mock.calls[0]![0])).toBe("/api/transacao?page=1&limit=100");
    expect(resultado.parcial).toBe(true);
    expect(resultado.itens).toHaveLength(10);
  });
});
