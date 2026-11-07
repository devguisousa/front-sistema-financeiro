import { useQuery } from "@tanstack/react-query";
import { buscarTodas } from "../../lib/api";
import { chaves } from "../../lib/queryClient";
import type { Categoria, TipoTransacao } from "../../lib/tipos";

/** Todas as categorias (todas as páginas), opcionalmente de um tipo só. */
export function useCategoriasTodas(tipo?: TipoTransacao) {
  return useQuery({
    queryKey: [...chaves.categorias, tipo ?? "todas"],
    queryFn: () => buscarTodas<Categoria>("/categoria", "categoria", { tipo }),
  });
}
