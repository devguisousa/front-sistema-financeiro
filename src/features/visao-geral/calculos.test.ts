import { describe, expect, it } from "vitest";
import { mockFetch } from "../../test/fetch";
import { contaPagar, contaReceber, transacao } from "../../test/dados";
import { definirSessao } from "../../lib/api";
import { limitesParaApi } from "../relatorio/periodos";
import {
  acumularPorDia,
  agruparFluxo,
  buscarTransacoesDoPeriodo,
  cortarFuturo,
  fatiasPorCategoria,
  granularidade,
  proximosVencimentos,
  variacao,
} from "./calculos";

const AGORA = new Date("2026-11-07T15:00:00.000Z"); // 07/11 12h em Brasília

describe("granularidade", () => {
  it("por dia até 31 dias, por semana até 92 e por mês acima disso", () => {
    expect(granularidade({ de: "2026-10-01", ate: "2026-10-31" })).toBe("dia");
    expect(granularidade({ de: "2026-10-01", ate: "2026-11-01" })).toBe("semana"); // 32 dias
    expect(granularidade({ de: "2026-08-01", ate: "2026-10-31" })).toBe("semana"); // 92 dias
    expect(granularidade({ de: "2026-08-01", ate: "2026-11-01" })).toBe("mes"); // 93 dias
    expect(granularidade({ de: "2026-01-01", ate: "2026-12-31" })).toBe("mes");
  });
});

describe("agruparFluxo", () => {
  it("por dia, no fuso local, sem transferências", () => {
    const baldes = agruparFluxo(
      [
        transacao({ valor: "100.00", data: "2026-11-01T02:00:00.000Z" }), // 31/10 em Brasília: fora
        transacao({ valor: "40.00", data: "2026-11-02T02:30:00.000Z" }), // 01/11 23h30 em Brasília
        transacao({ valor: "50.00", data: "2026-11-05T15:00:00.000Z", transferenciaId: 3 }),
        transacao({ tipo: "DESPESA", valor: "30.10", data: "2026-11-06T15:00:00.000Z" }),
        transacao({ tipo: "DESPESA", valor: "0.20", data: "2026-11-06T16:00:00.000Z" }),
      ],
      { de: "2026-11-01", ate: "2026-11-30" },
    );

    expect(baldes).toHaveLength(30);
    expect(baldes[0]).toMatchObject({
      inicio: "2026-11-01",
      fim: "2026-11-01",
      rotulo: "01/11",
      nome: "01/11/2026",
      receitas: 4000,
      qtdReceitas: 1,
    });
    expect(baldes[5]).toMatchObject({ inicio: "2026-11-06", despesas: 3030, qtdDespesas: 2 });
    expect(baldes.reduce((soma, b) => soma + b.receitas, 0)).toBe(4000);
  });

  it("por semana: blocos de 7 dias a partir do início, o último pode ser menor", () => {
    const baldes = agruparFluxo([transacao({ valor: "10.00", data: "2026-10-09T15:00:00.000Z" })], {
      de: "2026-10-01",
      ate: "2026-11-15",
    });

    expect(baldes).toHaveLength(7);
    expect(baldes[1]).toMatchObject({
      inicio: "2026-10-08",
      fim: "2026-10-14",
      rotulo: "08/10",
      nome: "08/10 a 14/10",
      receitas: 1000,
    });
    expect(baldes[6]).toMatchObject({ inicio: "2026-11-12", fim: "2026-11-15" });
  });

  it("por mês: um balde por mês, com o ano quando o período cruza anos", () => {
    const ano = agruparFluxo([], { de: "2026-01-01", ate: "2026-12-31" });
    expect(ano.map((b) => b.rotulo)).toEqual([
      "jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez",
    ]);
    expect(ano[10]).toMatchObject({ inicio: "2026-11-01", fim: "2026-11-30", nome: "Novembro de 2026" });

    const cruza = agruparFluxo(
      [transacao({ tipo: "DESPESA", valor: "9.99", data: "2025-12-31T15:00:00.000Z" })],
      { de: "2025-11-15", ate: "2026-03-10" },
    );
    expect(cruza.map((b) => b.rotulo)).toEqual(["nov/25", "dez/25", "jan/26", "fev/26", "mar/26"]);
    expect(cruza[0]).toMatchObject({ inicio: "2025-11-15", fim: "2025-11-30" });
    expect(cruza[1]).toMatchObject({ despesas: 999, qtdDespesas: 1 });
    expect(cruza[4]).toMatchObject({ inicio: "2026-03-01", fim: "2026-03-10" });
  });
});

describe("cortarFuturo", () => {
  it("baldes que começam depois de hoje e não têm lançamento ficam sem valor", () => {
    const baldes = agruparFluxo(
      [transacao({ valor: "10.00", data: "2026-11-20T15:00:00.000Z" })],
      { de: "2026-11-01", ate: "2026-11-30" },
    );

    const pontos = cortarFuturo(baldes, "2026-11-07");

    expect(pontos[6]).toMatchObject({ inicio: "2026-11-07", receitas: 0, despesas: 0 });
    expect(pontos[7]).toMatchObject({ inicio: "2026-11-08", receitas: null, despesas: null });
    // Lançamento agendado para depois de hoje continua aparecendo
    expect(pontos[19]).toMatchObject({ inicio: "2026-11-20", receitas: 1000, despesas: 0 });
  });
});

describe("acumularPorDia", () => {
  const novembro = { de: "2026-11-01", ate: "2026-11-30" };

  it("soma receitas menos despesas dia a dia e para em hoje", () => {
    const pontos = acumularPorDia(
      [
        transacao({ valor: "100.00", data: "2026-11-02T15:00:00.000Z" }),
        transacao({ tipo: "DESPESA", valor: "30.00", data: "2026-11-04T15:00:00.000Z" }),
        transacao({ valor: "5.00", data: "2026-11-04T16:00:00.000Z", transferenciaId: 2 }),
      ],
      novembro,
      "2026-11-07",
    );

    expect(pontos.map((p) => p.acumulado)).toEqual([0, 10000, 10000, 7000, 7000, 7000, 7000]);
    expect(pontos[3]).toMatchObject({ dia: "2026-11-04", nome: "04/11/2026", doDia: -3000, qtd: 1 });
  });

  it("vai até o último lançamento depois de hoje", () => {
    const pontos = acumularPorDia(
      [transacao({ valor: "1.00", data: "2026-11-10T15:00:00.000Z" })],
      novembro,
      "2026-11-07",
    );

    expect(pontos).toHaveLength(10);
    expect(pontos.at(-1)).toMatchObject({ dia: "2026-11-10", acumulado: 100 });
  });

  it("período já encerrado vai até o último dia", () => {
    expect(acumularPorDia([], { de: "2026-10-01", ate: "2026-10-31" }, "2026-11-07")).toHaveLength(31);
  });

  it("período todo no futuro e sem lançamentos fica vazio", () => {
    expect(acumularPorDia([], { de: "2026-12-01", ate: "2026-12-31" }, "2026-11-07")).toEqual([]);
  });
});

describe("fatiasPorCategoria", () => {
  const cat = (id: number, total: string, tipo: "RECEITA" | "DESPESA" = "DESPESA", quantidade = 1) => ({
    categoriaId: id,
    nome: `Cat ${id}`,
    tipo,
    total,
    quantidade,
  });

  it("só o tipo pedido, da maior para a menor, com a parte de cada uma", () => {
    expect(fatiasPorCategoria([cat(1, "25.00"), cat(2, "75.00", "DESPESA", 3), cat(3, "999.00", "RECEITA")], "DESPESA"))
      .toEqual([
        { chave: "2", nome: "Cat 2", total: 7500, quantidade: 3, parte: 75 },
        { chave: "1", nome: "Cat 1", total: 2500, quantidade: 1, parte: 25 },
      ]);
  });

  it("mais de 7 categorias: as 6 maiores e o resto junto em Outras", () => {
    const fatias = fatiasPorCategoria(
      [1, 2, 3, 4, 5, 6, 7, 8].map((id) => cat(id, `${id}0.00`, "DESPESA", 2)),
      "DESPESA",
    );

    expect(fatias.map((f) => f.nome)).toEqual(["Cat 8", "Cat 7", "Cat 6", "Cat 5", "Cat 4", "Cat 3", "Outras (2)"]);
    expect(fatias[6]).toMatchObject({ chave: "outras", total: 3000, quantidade: 4 });
  });

  it("exatamente 7: a sétima aparece com o próprio nome", () => {
    const fatias = fatiasPorCategoria([1, 2, 3, 4, 5, 6, 7].map((id) => cat(id, `${id}0.00`)), "DESPESA");
    expect(fatias.at(-1)).toMatchObject({ chave: "1", nome: "Cat 1" });
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

describe("buscarTransacoesDoPeriodo", () => {
  const periodo = { de: "2026-11-01", ate: "2026-11-30" };

  it("pede o período, a primeira página e depois o resto junto", async () => {
    definirSessao({ accessToken: "A", refreshToken: "R" });
    const fetch = mockFetch({
      "GET /transacao": ({ query }) => ({
        status: 200,
        corpo: {
          transacao: [transacao({ id: Number(query.get("page")) })],
          pagina: Number(query.get("page")),
          total: 201,
          totalPaginas: 3,
        },
      }),
    });

    const resultado = await buscarTransacoesDoPeriodo(periodo);

    expect(fetch).toHaveBeenCalledTimes(3);
    const query = new URL(String(fetch.mock.calls[0]![0]), "http://localhost").searchParams;
    expect(Object.fromEntries(query)).toEqual({ ...limitesParaApi(periodo), page: "1", limit: "100" });
    expect(resultado).toEqual({
      itens: [1, 2, 3].map((id) => expect.objectContaining({ id })),
      parcial: false,
    });
  });

  it("teto de 20 páginas marca dados parciais", async () => {
    definirSessao({ accessToken: "A", refreshToken: "R" });
    const fetch = mockFetch({
      "GET /transacao": ({ query }) => ({
        status: 200,
        corpo: {
          transacao: [transacao({ id: Number(query.get("page")) })],
          pagina: Number(query.get("page")),
          total: 2500,
          totalPaginas: 25,
        },
      }),
    });

    const resultado = await buscarTransacoesDoPeriodo(periodo);

    expect(fetch).toHaveBeenCalledTimes(20);
    expect(resultado.parcial).toBe(true);
    expect(resultado.itens).toHaveLength(20);
  });
});
