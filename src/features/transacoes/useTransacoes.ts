import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { normalizarPagina, requisicao } from "../../lib/api";
import { chaves, invalidarLancamento } from "../../lib/queryClient";
import type { TipoTransacao, Transacao } from "../../lib/tipos";

export const POR_PAGINA = 20;

export type FiltrosTransacao = {
  tipo?: TipoTransacao | undefined;
  contaId?: number | undefined;
  categoriaId?: number | undefined;
  page: number;
};

export type CorpoTransacao = {
  descricao: string;
  valor: string;
  tipo: TipoTransacao;
  contaId: number;
  categoriaId: number;
  data?: string;
};

/** Gerada por pagamento, recebimento ou transferência: não se edita direto. */
export function origemAutomatica(t: Transacao): string | null {
  if (t.pagamentoContaPagarId !== null) return "Pagamento";
  if (t.recebimentoId !== null) return "Recebimento";
  if (t.transferenciaId !== null) return "Transferência";
  return null;
}

export const ehManual = (t: Transacao) => origemAutomatica(t) === null;

export function useListaTransacoes(filtros: FiltrosTransacao) {
  return useQuery({
    queryKey: [...chaves.transacoes, "lista", filtros],
    queryFn: async () =>
      normalizarPagina<Transacao>(
        await requisicao("/transacao", { query: { ...filtros, limit: POR_PAGINA } }),
        "transacao",
      ),
    placeholderData: keepPreviousData,
  });
}

export function useSalvarTransacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, corpo }: { id?: number | undefined; corpo: CorpoTransacao }) =>
      requisicao<Transacao>(id ? `/transacao/${id}` : "/transacao", {
        metodo: id ? "PUT" : "POST",
        corpo,
      }),
    onSuccess: () => invalidarLancamento(queryClient),
  });
}

export function useApagarTransacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => requisicao<void>(`/transacao/${id}`, { metodo: "DELETE" }),
    onSuccess: () => invalidarLancamento(queryClient),
  });
}
