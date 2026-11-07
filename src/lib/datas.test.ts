import { describe, expect, it } from "vitest";
import {
  dataParaApi,
  diaLocalDe,
  diasAteVencimento,
  formatarData,
  formatarDataCurta,
  formatarVencimento,
  hojeLocal,
  mesLocal,
} from "./datas";

describe("datas", () => {
  it("roda no fuso de Brasília", () => {
    expect(new Date("2026-11-07T00:00:00.000Z").getTimezoneOffset()).toBe(180);
  });

  it("vencimento em UTC não volta um dia em Brasília", () => {
    expect(formatarVencimento("2026-11-07T00:00:00.000Z")).toBe("07/11/2026");
  });

  it("data de transação usa o fuso local", () => {
    expect(formatarData("2026-11-01T02:00:00.000Z")).toBe("31/10/2026");
    expect(formatarDataCurta("2026-11-07T15:00:00.000Z")).toBe("07 nov");
  });

  it("hojeLocal é o dia em Brasília", () => {
    expect(hojeLocal(new Date("2026-11-08T01:00:00.000Z"))).toBe("2026-11-07");
  });

  it("dataParaApi: hoje usa o instante atual; outro dia usa meio-dia local", () => {
    const agora = new Date("2026-11-07T18:30:00.000Z"); // 15h30 em Brasília
    expect(dataParaApi("2026-11-07", agora)).toBe(agora.toISOString());
    expect(dataParaApi("2026-11-01", agora)).toBe("2026-11-01T15:00:00.000Z");
    expect(formatarData(dataParaApi("2026-11-01", agora))).toBe("01/11/2026");
  });

  it("diaLocalDe devolve o dia do formulário", () => {
    expect(diaLocalDe("2026-11-01T02:00:00.000Z")).toBe("2026-10-31");
  });

  it("diasAteVencimento compara dia UTC do vencimento com o dia local de hoje", () => {
    const agora = new Date("2026-11-08T01:00:00.000Z"); // 07/11 22h em Brasília
    expect(diasAteVencimento("2026-11-07T00:00:00.000Z", agora)).toBe(0);
    expect(diasAteVencimento("2026-11-06T00:00:00.000Z", agora)).toBe(-1);
    expect(diasAteVencimento("2026-11-22T00:00:00.000Z", agora)).toBe(15);
  });

  it("mesLocal agrupa pelo mês em Brasília", () => {
    expect(mesLocal("2026-11-01T02:00:00.000Z")).toBe("2026-10");
  });
});
