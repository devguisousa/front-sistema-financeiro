import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { normalizarPagina, requisicao } from "../../lib/api";
import { chaves } from "../../lib/queryClient";
import type { Papel, Usuario } from "../../lib/tipos";

export const POR_PAGINA = 20;

export function useListaUsuarios(page: number) {
  return useQuery({
    queryKey: [...chaves.usuarios, page],
    queryFn: async () =>
      normalizarPagina<Usuario>(
        await requisicao("/usuarios", { query: { page, limit: POR_PAGINA } }),
        "usuarios",
      ),
    placeholderData: keepPreviousData,
  });
}

function useMutacaoDeUsuarios<A, R>(fn: (args: A) => Promise<R>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSettled: () => queryClient.invalidateQueries({ queryKey: chaves.usuarios }),
  });
}

export type CorpoUsuario = { email: string; senha: string; papel: Papel };

export const useCadastrarUsuario = () =>
  useMutacaoDeUsuarios((corpo: CorpoUsuario) =>
    requisicao<Usuario>("/auth/registrar", { metodo: "POST", corpo }),
  );

export const useMudarPapel = () =>
  useMutacaoDeUsuarios(({ id, papel }: { id: number; papel: Papel }) =>
    requisicao<Usuario>(`/usuarios/${id}/papel`, { metodo: "PATCH", corpo: { papel } }),
  );

export const useRemoverUsuario = () =>
  useMutacaoDeUsuarios((id: number) => requisicao<void>(`/usuarios/${id}`, { metodo: "DELETE" }));
