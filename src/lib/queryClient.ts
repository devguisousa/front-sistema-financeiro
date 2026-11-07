import { QueryClient } from "@tanstack/react-query";
import { ErroApi } from "./erros";

/** Cache do app. Repete só falha de rede ou erro 5xx, no máximo 2 vezes. */
export function criarQueryClient(opcoes: { retry?: boolean } = {}) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: true,
        retry:
          opcoes.retry === false
            ? false
            : (falhas, erro) =>
                falhas < 2 &&
                erro instanceof ErroApi &&
                (erro.status === 0 || erro.status >= 500),
      },
      mutations: { retry: false },
    },
  });
}

/** Chaves do cache por recurso (prefixos: invalidar uma derruba as filhas). */
export const chaves = {
  me: ["me"],
  statusAuth: ["auth", "status"],
  contas: ["contas"],
  saldos: ["saldos"],
  categorias: ["categorias"],
  transacoes: ["transacoes"],
  transferencias: ["transferencias"],
  contasPagar: ["contas-pagar"],
  contasReceber: ["contas-receber"],
  painel: ["painel"],
  usuarios: ["usuarios"],
} as const;

/** Depois de um lançamento: listas, saldos, painel e compromissos mudam. */
export async function invalidarLancamento(queryClient: QueryClient) {
  await Promise.all(
    [
      chaves.transacoes,
      chaves.saldos,
      chaves.painel,
      chaves.transferencias,
      chaves.contasPagar,
      chaves.contasReceber,
    ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
  );
}
