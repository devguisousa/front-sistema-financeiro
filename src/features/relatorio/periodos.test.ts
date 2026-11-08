import { describe, expect, it } from "vitest";
import {
  atalhoDoPeriodo,
  diaValido,
  erroDoPeriodo,
  formatarDia,
  limitesParaApi,
  periodoDaUrl,
  periodoDoAtalho,
} from "./periodos";

const agora = new Date(2026, 1, 15, 10, 30); // 15/02/2026, local

describe("períodos do relatório", () => {
  it("atalhos viram datas locais", () => {
    expect(periodoDoAtalho("este-mes", agora)).toEqual({ de: "2026-02-01", ate: "2026-02-28" });
    expect(periodoDoAtalho("mes-passado", agora)).toEqual({ de: "2026-01-01", ate: "2026-01-31" });
    expect(periodoDoAtalho("30-dias", agora)).toEqual({ de: "2026-01-17", ate: "2026-02-15" });
    expect(periodoDoAtalho("este-ano", agora)).toEqual({ de: "2026-01-01", ate: "2026-12-31" });
  });

  it("mês passado em janeiro volta para dezembro do ano anterior", () => {
    expect(periodoDoAtalho("mes-passado", new Date(2026, 0, 10))).toEqual({
      de: "2025-12-01",
      ate: "2025-12-31",
    });
  });

  it("reconhece o atalho de um período e devolve null para datas livres", () => {
    expect(atalhoDoPeriodo({ de: "2026-01-01", ate: "2026-01-31" }, agora)).toBe("mes-passado");
    expect(atalhoDoPeriodo({ de: "2026-01-05", ate: "2026-01-31" }, agora)).toBeNull();
  });

  it("valida o dia no calendário", () => {
    expect(diaValido("2024-02-29")).toBe(true);
    expect(diaValido("2026-02-29")).toBe(false);
    expect(diaValido("2026-13-01")).toBe(false);
    expect(diaValido("ontem")).toBe(false);
    expect(diaValido("")).toBe(false);
    expect(diaValido(null)).toBe(false);
  });

  it("aponta datas faltando e período invertido", () => {
    expect(erroDoPeriodo({ de: "", ate: "2026-01-31" })).toBe("Preencha as duas datas.");
    expect(erroDoPeriodo({ de: "2026-02-01", ate: "2026-01-31" })).toBe("A data final vem antes da inicial.");
    expect(erroDoPeriodo({ de: "2026-01-31", ate: "2026-01-31" })).toBeNull();
  });

  it("lê o período da URL e cai no mês atual se faltar ou estiver errado", () => {
    expect(periodoDaUrl(new URLSearchParams("de=2026-01-05&ate=2026-01-20"), agora)).toEqual({
      de: "2026-01-05",
      ate: "2026-01-20",
    });
    const mesAtual = { de: "2026-02-01", ate: "2026-02-28" };
    expect(periodoDaUrl(new URLSearchParams(""), agora)).toEqual(mesAtual);
    expect(periodoDaUrl(new URLSearchParams("de=2026-03-01&ate=2026-01-01"), agora)).toEqual(mesAtual);
  });

  it("manda para a API o começo do primeiro dia e o fim do último, no fuso local", () => {
    const { inicio, fim } = limitesParaApi({ de: "2026-01-05", ate: "2026-01-20" });
    expect(new Date(inicio)).toEqual(new Date(2026, 0, 5, 0, 0, 0, 0));
    expect(new Date(fim)).toEqual(new Date(2026, 0, 20, 23, 59, 59, 999));
  });

  it("formata o dia para exibir", () => {
    expect(formatarDia("2026-01-05")).toBe("05/01/2026");
  });
});
