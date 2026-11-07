// Dinheiro trafega como texto ("150.50") e as contas são feitas em centavos
// inteiros. Decimal(12,2) cabe com folga num Number em centavos.

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** "150.50" → 15050, sem passar por ponto flutuante. */
export function paraCentavos(valor: string): number {
  const negativo = valor.startsWith("-");
  const [inteiro = "0", decimais = ""] = valor.replace(/^[-+]/, "").split(".");
  const centavos =
    Number(inteiro) * 100 + Number(decimais.padEnd(2, "0").slice(0, 2));
  return negativo ? -centavos : centavos;
}

/** 15050 → "150.50" (formato que a API aceita). */
export function deCentavos(centavos: number): string {
  const sinal = centavos < 0 ? "-" : "";
  const absoluto = Math.abs(Math.round(centavos));
  const inteiro = Math.floor(absoluto / 100);
  const decimais = String(absoluto % 100).padStart(2, "0");
  return `${sinal}${inteiro}.${decimais}`;
}

/** 123456 → "R$ 1.234,56" */
export function formatarBRL(centavos: number): string {
  return brl.format(centavos / 100);
}

/** "1234.56" (da API) → "R$ 1.234,56" */
export function formatarValor(valor: string): string {
  return formatarBRL(paraCentavos(valor));
}

/** 19950 → "199,50" (texto para preencher um campo de valor) */
export function centavosParaCampo(centavos: number): string {
  return deCentavos(centavos).replace(".", ",");
}

const SO_DIGITOS = /^\d+$/;
const COM_MILHAR = /^\d{1,3}(\.\d{3})+$/;

/**
 * Lê um valor digitado em pt-BR e devolve no formato da API ("1234.56").
 * Aceita "1.234,56", "150,5", "150.5", "R$ 10". Devolve null para entrada
 * inválida ou ambígua (sinal, letras, mais de 2 casas, mais de 10 dígitos).
 */
export function lerValorDigitado(texto: string): string | null {
  const limpo = texto.trim().replace(/^R\$\s*/i, "");
  if (!limpo) return null;

  let inteiro: string;
  let decimais = "";

  if (limpo.includes(",")) {
    const partes = limpo.split(",");
    if (partes.length !== 2) return null;
    [inteiro = "", decimais = ""] = partes;
    if (!/^\d{1,2}$/.test(decimais)) return null;
  } else {
    // Sem vírgula: "150.5" é decimal; "1.234" é milhar
    const decimal = /^(\d+)\.(\d{1,2})$/.exec(limpo);
    if (decimal) {
      inteiro = decimal[1] ?? "";
      decimais = decimal[2] ?? "";
    } else {
      inteiro = limpo;
    }
  }

  if (!SO_DIGITOS.test(inteiro) && !COM_MILHAR.test(inteiro)) return null;

  const digitos = inteiro.replace(/\./g, "").replace(/^0+(?=\d)/, "");
  if (digitos.length > 10) return null;

  return `${digitos}.${decimais.padEnd(2, "0")}`;
}
