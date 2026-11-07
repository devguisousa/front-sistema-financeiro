import { useQuery } from "@tanstack/react-query";
import { buscarTodas, requisicao } from "../../lib/api";
import { chaves } from "../../lib/queryClient";
import type { Conta, Saldo } from "../../lib/tipos";

/** Todas as contas (todas as páginas), para selects e saldos. */
export function useContasTodas() {
  return useQuery({
    queryKey: [...chaves.contas, "todas"],
    queryFn: () => buscarTodas<Conta>("/contas", "contas"),
  });
}

/** Saldo de cada conta, por id. Espera a lista de contas chegar. */
export function useSaldos(contas: Conta[] | undefined) {
  const ids = (contas ?? []).map((c) => c.id);

  return useQuery({
    queryKey: [...chaves.saldos, ids],
    enabled: contas !== undefined,
    queryFn: async () => {
      const lista = await Promise.all(
        ids.map((id) => requisicao<Saldo>(`/contas/${id}/saldo`)),
      );
      return Object.fromEntries(lista.map((s) => [s.contaId, s])) as Record<number, Saldo>;
    },
  });
}
