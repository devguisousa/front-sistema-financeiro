import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { normalizarPagina, requisicao } from "../../lib/api";
import { chaves, invalidarLancamento } from "../../lib/queryClient";
import type { Transferencia } from "../../lib/tipos";

export const POR_PAGINA = 20;

export type CorpoTransferencia = {
  contaOrigemId: number;
  contaDestinoId: number;
  valor: string;
  descricao?: string;
};

export function useListaTransferencias(page: number) {
  return useQuery({
    queryKey: [...chaves.transferencias, "lista", page],
    queryFn: async () =>
      normalizarPagina<Transferencia>(
        await requisicao("/transferencias", { query: { page, limit: POR_PAGINA } }),
        "transferencias",
      ),
    placeholderData: keepPreviousData,
  });
}

export function useTransferir() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (corpo: CorpoTransferencia) =>
      requisicao<Transferencia>("/transferencias", { metodo: "POST", corpo }),
    onSuccess: () => invalidarLancamento(queryClient),
  });
}

export function useEstornar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => requisicao<void>(`/transferencias/${id}`, { metodo: "DELETE" }),
    onSuccess: () => invalidarLancamento(queryClient),
  });
}
