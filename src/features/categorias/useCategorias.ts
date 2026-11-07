import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { buscarTodas, requisicao } from "../../lib/api";
import { chaves } from "../../lib/queryClient";
import type { Categoria, TipoTransacao } from "../../lib/tipos";

/** Todas as categorias (todas as páginas), opcionalmente de um tipo só. */
export function useCategoriasTodas(tipo?: TipoTransacao) {
  return useQuery({
    queryKey: [...chaves.categorias, tipo ?? "todas"],
    queryFn: () => buscarTodas<Categoria>("/categoria", "categoria", { tipo }),
  });
}

// Criadas e usadas pelas transferências (back-end: CATEGORIAS_DO_SISTEMA)
const DO_SISTEMA = new Set(["transferência enviada", "transferência recebida"]);

/** Categoria das transferências: não se edita nem se usa em lançamento manual. */
export function ehDoSistema(c: Categoria): boolean {
  return DO_SISTEMA.has(c.nome.toLocaleLowerCase("pt-BR"));
}

function useInvalidarCategorias() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all(
      [chaves.categorias, chaves.transacoes].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    );
}

export type CorpoCategoria = { nome: string; tipo: TipoTransacao };

export function useSalvarCategoria() {
  const invalidar = useInvalidarCategorias();
  return useMutation({
    mutationFn: ({ id, corpo }: { id?: number | undefined; corpo: CorpoCategoria }) =>
      requisicao<Categoria>(id ? `/categoria/${id}` : "/categoria", { metodo: id ? "PUT" : "POST", corpo }),
    onSuccess: invalidar,
  });
}

export function useApagarCategoria() {
  const invalidar = useInvalidarCategorias();
  return useMutation({
    mutationFn: (id: number) => requisicao<void>(`/categoria/${id}`, { metodo: "DELETE" }),
    onSuccess: invalidar,
  });
}
