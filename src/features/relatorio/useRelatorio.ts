import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { normalizarPagina, requisicao } from "../../lib/api";
import { chaves } from "../../lib/queryClient";
import type { ResumoPeriodo, Transacao } from "../../lib/tipos";
import { limitesParaApi, type Periodo } from "./periodos";

export const POR_PAGINA = 20;

// Chaves dentro de "transacoes": todo lançamento novo, editado ou apagado
// (invalidarLancamento) também refaz o relatório

/** Totais do período, no geral e por categoria (conta na API). */
export function useResumo(periodo: Periodo) {
  return useQuery({
    queryKey: [...chaves.transacoes, "resumo", periodo],
    queryFn: () =>
      requisicao<ResumoPeriodo>("/transacao/resumo", { query: limitesParaApi(periodo) }),
    placeholderData: keepPreviousData,
  });
}

/** Lançamentos do período, página a página. */
export function useLancamentosDoPeriodo(periodo: Periodo, page: number) {
  return useQuery({
    queryKey: [...chaves.transacoes, "periodo", periodo, page],
    queryFn: async () =>
      normalizarPagina<Transacao>(
        await requisicao("/transacao", {
          query: { ...limitesParaApi(periodo), page, limit: POR_PAGINA },
        }),
        "transacao",
      ),
    placeholderData: keepPreviousData,
  });
}
