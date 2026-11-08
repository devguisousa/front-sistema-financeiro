import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

function useInvalidarContas() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all(
      [chaves.contas, chaves.saldos, chaves.painel, chaves.transacoes].map((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      ),
    );
}

/** Criar manda saldoInicial; editar manda saldoAtual só quando o saldo mudou. */
export type CorpoConta = { nome: string; saldoInicial?: string; saldoAtual?: string };

export function useSalvarConta() {
  const invalidar = useInvalidarContas();
  return useMutation({
    mutationFn: ({ id, corpo }: { id?: number | undefined; corpo: CorpoConta }) =>
      requisicao<Conta>(id ? `/contas/${id}` : "/contas", { metodo: id ? "PUT" : "POST", corpo }),
    onSuccess: invalidar,
  });
}

export function useApagarConta() {
  const invalidar = useInvalidarContas();
  return useMutation({
    mutationFn: (id: number) => requisicao<void>(`/contas/${id}`, { metodo: "DELETE" }),
    onSuccess: invalidar,
  });
}
