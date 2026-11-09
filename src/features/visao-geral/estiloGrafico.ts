// Cores da marca (verde = entrada, coral = saída). Validadas com o script da
// skill dataviz: CVD ΔE 9,4, contraste ≥ 3:1 sobre #0C110E. Identidade também
// vem da legenda, da ordem fixa (receita à esquerda) e da tabela.
export const COR = { receitas: "#3DF58F", despesas: "#FF8B66" } as const;

// Categorias (rosca): 6 cores na ordem fixa da paleta de referência da skill
// dataviz, passo do modo escuro. Validadas sobre #0C110E: pares vizinhos com
// CVD ΔE ≥ 8,4, visão normal ≥ 19,3, contraste ≥ 3:1. A 7ª fatia é cinza.
export const CORES_CATEGORIA = ["#3987E5", "#D95926", "#199E70", "#C98500", "#D55181", "#008300"] as const;
export const COR_OUTRAS = "#76827A";

export const corDaFatia = (indice: number) => CORES_CATEGORIA[indice] ?? COR_OUTRAS;

export const SUPERFICIE = "#0C110E"; // fundo dos cards: anel de 2px entre marcas
export const GRADE = "#141B17";
export const EIXO_ZERO = "#3A4A42";

export const TICK = { fill: "#76827A", fontSize: 11, fontFamily: "Geist Mono Variable, monospace" };

const compacto = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });

/** Eixo Y em reais curtos: 150000 centavos → "1,5 mil" */
export const reaisCurtos = (centavos: number) => compacto.format(centavos / 100);
