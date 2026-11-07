// Vencimentos chegam como meia-noite UTC: formatar em UTC para não aparecer
// um dia antes em Brasília. Datas de transação são instantes: fuso local.

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

const diaUtc = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "UTC",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const diaLocal = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const doisDigitos = (n: number) => String(n).padStart(2, "0");
const UM_DIA_MS = 24 * 60 * 60 * 1000;

/** Vencimento (meia-noite UTC) → "07/11/2026" */
export function formatarVencimento(iso: string): string {
  return diaUtc.format(new Date(iso));
}

/** Instante → "07/11/2026" no fuso local */
export function formatarData(iso: string): string {
  return diaLocal.format(new Date(iso));
}

/** Instante → "07 nov" no fuso local */
export function formatarDataCurta(iso: string): string {
  const data = new Date(iso);
  return `${doisDigitos(data.getDate())} ${MESES[data.getMonth()]}`;
}

/** Nome curto do mês: "2026-11" → "nov" */
export function nomeDoMes(mes: string): string {
  return MESES[Number(mes.slice(5, 7)) - 1] ?? mes;
}

/** Dia local "AAAA-MM-DD" (valor do <input type="date">) */
export function hojeLocal(agora = new Date()): string {
  return `${agora.getFullYear()}-${doisDigitos(agora.getMonth() + 1)}-${doisDigitos(agora.getDate())}`;
}

/** Dia local "AAAA-MM-DD" de um instante ISO */
export function diaLocalDe(iso: string): string {
  return hojeLocal(new Date(iso));
}

/**
 * Data de transação para a API. A API lê "AAAA-MM-DD" como meia-noite UTC
 * (21h do dia anterior em Brasília), então sempre manda data/hora ISO:
 * hoje = o instante atual; outro dia = meio-dia local desse dia.
 */
export function dataParaApi(dia: string, agora = new Date()): string {
  if (dia === hojeLocal(agora)) return agora.toISOString();

  const [ano, mes, d] = dia.split("-").map(Number);
  return new Date(ano ?? 0, (mes ?? 1) - 1, d ?? 1, 12).toISOString();
}

/** Dias entre hoje (local) e o vencimento (dia UTC). Negativo = vencida. */
export function diasAteVencimento(iso: string, agora = new Date()): number {
  const venc = new Date(iso);
  const diaVenc = Date.UTC(venc.getUTCFullYear(), venc.getUTCMonth(), venc.getUTCDate());
  const hoje = Date.UTC(agora.getFullYear(), agora.getMonth(), agora.getDate());
  return Math.round((diaVenc - hoje) / UM_DIA_MS);
}

/** Mês local "AAAA-MM" de um instante */
export function mesLocal(iso: string): string {
  const data = new Date(iso);
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}`;
}
