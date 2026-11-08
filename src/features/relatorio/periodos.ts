import { hojeLocal } from "../../lib/datas";

/** Período em dias locais "AAAA-MM-DD"; os dois dias entram. */
export type Periodo = { de: string; ate: string };

export type Atalho = "este-mes" | "mes-passado" | "30-dias" | "este-ano";

export const ATALHOS: { valor: Atalho; rotulo: string }[] = [
  { valor: "este-mes", rotulo: "Este mês" },
  { valor: "mes-passado", rotulo: "Mês passado" },
  { valor: "30-dias", rotulo: "Últimos 30 dias" },
  { valor: "este-ano", rotulo: "Este ano" },
];

/** Data local (mês e dia podem transbordar). setFullYear evita que os anos 0–99 virem 1900–1999. */
function dataLocal(ano: number, mes: number, dia: number, h = 0, min = 0, s = 0, ms = 0): Date {
  const data = new Date(0);
  data.setFullYear(ano, mes, dia);
  data.setHours(h, min, s, ms);
  return data;
}

export function periodoDoAtalho(atalho: Atalho, agora = new Date()): Periodo {
  const ano = agora.getFullYear();
  const mes = agora.getMonth();

  switch (atalho) {
    case "este-mes":
      return { de: hojeLocal(dataLocal(ano, mes, 1)), ate: hojeLocal(dataLocal(ano, mes + 1, 0)) };
    case "mes-passado":
      return { de: hojeLocal(dataLocal(ano, mes - 1, 1)), ate: hojeLocal(dataLocal(ano, mes, 0)) };
    case "30-dias":
      return { de: hojeLocal(dataLocal(ano, mes, agora.getDate() - 29)), ate: hojeLocal(agora) };
    case "este-ano":
      return { de: `${ano}-01-01`, ate: `${ano}-12-31` };
  }
}

/** Qual atalho gera este período (null = datas escolhidas à mão). */
export function atalhoDoPeriodo(periodo: Periodo, agora = new Date()): Atalho | null {
  const achado = ATALHOS.find(({ valor }) => {
    const p = periodoDoAtalho(valor, agora);
    return p.de === periodo.de && p.ate === periodo.ate;
  });
  return achado?.valor ?? null;
}

/** "AAAA-MM-DD" que existe no calendário. */
export function diaValido(dia: string | null | undefined): dia is string {
  if (!dia || !/^\d{4}-\d{2}-\d{2}$/.test(dia)) return false;
  const [ano = 0, mes = 0, d = 0] = dia.split("-").map(Number);
  return hojeLocal(dataLocal(ano, mes - 1, d)) === dia;
}

/** Mensagem de erro do período, ou null se está tudo certo. */
export function erroDoPeriodo(periodo: Periodo): string | null {
  if (!diaValido(periodo.de) || !diaValido(periodo.ate)) return "Preencha as duas datas.";
  if (periodo.de > periodo.ate) return "A data final vem antes da inicial.";
  return null;
}

/** Período da URL (?de=&ate=); sem datas válidas, vale o mês atual. */
export function periodoDaUrl(params: URLSearchParams, agora = new Date()): Periodo {
  const periodo = { de: params.get("de") ?? "", ate: params.get("ate") ?? "" };
  return erroDoPeriodo(periodo) === null ? periodo : periodoDoAtalho("este-mes", agora);
}

/** Começo do primeiro dia e fim do último, no fuso de quem usa, em ISO. */
export function limitesParaApi(periodo: Periodo): { inicio: string; fim: string } {
  const [a1 = 0, m1 = 1, d1 = 1] = periodo.de.split("-").map(Number);
  const [a2 = 0, m2 = 1, d2 = 1] = periodo.ate.split("-").map(Number);
  return {
    inicio: dataLocal(a1, m1 - 1, d1).toISOString(),
    fim: dataLocal(a2, m2 - 1, d2, 23, 59, 59, 999).toISOString(),
  };
}

/** "2026-11-01" → "01/11/2026" */
export function formatarDia(dia: string): string {
  const [ano, mes, d] = dia.split("-");
  return `${d}/${mes}/${ano}`;
}
