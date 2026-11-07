import { describe, expect, it } from "vitest";
import {
  deCentavos,
  formatarBRL,
  formatarValor,
  lerValorDigitado,
  paraCentavos,
} from "./dinheiro";

// Intl usa espaço não separável entre "R$" e o número
const semNbsp = (texto: string) => texto.replace(/\s/g, " ");

describe("lerValorDigitado", () => {
  it.each([
    ["1.234,56", "1234.56"],
    ["150,5", "150.50"],
    ["150.5", "150.50"],
    ["1.234", "1234.00"],
    ["  42 ", "42.00"],
    ["R$ 10,00", "10.00"],
    ["R$10", "10.00"],
    ["0,99", "0.99"],
    ["0", "0.00"],
    ["1.234.567,8", "1234567.80"],
    ["1234567,89", "1234567.89"],
  ])("lerValorDigitado(%s) = %s", (entrada, saida) => {
    expect(lerValorDigitado(entrada)).toBe(saida);
  });

  it.each([
    "",
    "   ",
    "abc",
    "-5",
    "+5",
    "1,234",
    "12345678901",
    "1.23.4",
    "10,5,1",
    "1.2345",
    ",5",
    "5,",
  ])("recusa %j", (entrada) => {
    expect(lerValorDigitado(entrada)).toBeNull();
  });
});

describe("centavos", () => {
  it("soma sem erro de ponto flutuante", () => {
    expect(paraCentavos("0.10") + paraCentavos("0.20")).toBe(30);
  });

  it("ida e volta", () => {
    expect(paraCentavos("1234.56")).toBe(123456);
    expect(paraCentavos("150.5")).toBe(15050);
    expect(paraCentavos("7")).toBe(700);
    expect(deCentavos(paraCentavos("1234.56"))).toBe("1234.56");
    expect(deCentavos(5)).toBe("0.05");
    expect(deCentavos(-500)).toBe("-5.00");
  });

  it("formata em reais", () => {
    expect(semNbsp(formatarBRL(123456))).toBe("R$ 1.234,56");
    expect(semNbsp(formatarBRL(-5050))).toBe("-R$ 50,50");
    expect(semNbsp(formatarValor("0.30"))).toBe("R$ 0,30");
  });
});
