import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { buscarTodas, normalizarPagina, requisicao } from "../../lib/api";
import { diasAteVencimento } from "../../lib/datas";
import { chaves, invalidarLancamento } from "../../lib/queryClient";
import type { Baixa } from "../../lib/tipos";
import type { Compromisso, ConfigCompromisso, Situacao } from "./config";
import { restante } from "./restante";

export const POR_PAGINA = 20;

export type FiltrosCompromisso = { situacao?: Situacao | undefined; vencidas: boolean; pagina: number };

export function useListaCompromissos(config: ConfigCompromisso, filtros: FiltrosCompromisso) {
  const [nomePagina, nomeLimite] = config.paginacao === "page" ? ["page", "limit"] : ["pagina", "limite"];

  return useQuery({
    queryKey: [...config.chaveQuery, "lista", filtros],
    queryFn: async () => {
      const pag = normalizarPagina<unknown>(
        await requisicao(config.recurso, {
          query: {
            status: filtros.situacao ? config.statusApi[filtros.situacao] : undefined,
            vencidas: filtros.vencidas ? "true" : undefined,
            [nomePagina]: filtros.pagina,
            [nomeLimite]: POR_PAGINA,
          },
        }),
        config.chaveLista,
      );
      return { ...pag, itens: pag.itens.map(config.normalizar) };
    },
    placeholderData: keepPreviousData,
  });
}

/** Números do topo: em aberto, vencidas e as que vencem em 7 dias. */
export function useResumoCompromissos(config: ConfigCompromisso) {
  return useQuery({
    queryKey: [...config.chaveQuery, "resumo"],
    queryFn: async () => {
      const [pendentes, parciais] = await Promise.all(
        (["pendente", "parcial"] as const).map((s) =>
          buscarTodas<unknown>(config.recurso, config.chaveLista, { status: config.statusApi[s] }, config.paginacao),
        ),
      );
      const abertas = [...(pendentes ?? []), ...(parciais ?? [])].map(config.normalizar);
      const agora = new Date();
      const soma = (lista: Compromisso[]) => lista.reduce((t, c) => t + restante(c), 0);
      const vencidas = abertas.filter((c) => diasAteVencimento(c.vencimento, agora) < 0);
      const proximas = abertas.filter((c) => {
        const dias = diasAteVencimento(c.vencimento, agora);
        return dias >= 0 && dias <= 7;
      });
      return {
        emAberto: { qtd: abertas.length, total: soma(abertas) },
        vencidas: { qtd: vencidas.length, total: soma(vencidas) },
        proximas: { qtd: proximas.length, total: soma(proximas) },
      };
    },
  });
}

export type CorpoCompromisso = { descricao: string; valorTotal: string; vencimento: string };

function useInvalidar(config: ConfigCompromisso) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: config.chaveQuery }),
      queryClient.invalidateQueries({ queryKey: chaves.painel }),
    ]);
}

export function useSalvarCompromisso(config: ConfigCompromisso) {
  const invalidar = useInvalidar(config);
  return useMutation({
    mutationFn: ({ id, corpo }: { id?: number | undefined; corpo: CorpoCompromisso }) =>
      requisicao(id ? `${config.recurso}/${id}` : config.recurso, { metodo: id ? "PUT" : "POST", corpo }),
    onSuccess: invalidar,
  });
}

export function useApagarCompromisso(config: ConfigCompromisso) {
  const invalidar = useInvalidar(config);
  return useMutation({
    mutationFn: (id: number) => requisicao<void>(`${config.recurso}/${id}`, { metodo: "DELETE" }),
    onSuccess: invalidar,
  });
}

export type CorpoBaixa = { contaId: number; categoriaId: number; valor: string };

/** Pagamento ou recebimento (parcial ou total). Gera uma transação. */
export function useRegistrarBaixa(config: ConfigCompromisso) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, corpo }: { id: number; corpo: CorpoBaixa }) =>
      requisicao(config.rotaBaixa(id), { metodo: "POST", corpo }),
    onSuccess: () => invalidarLancamento(queryClient),
  });
}

/** Pagamentos/recebimentos já feitos de um compromisso, do mais novo ao mais antigo. */
export function useBaixas(config: ConfigCompromisso, id: number) {
  return useQuery({
    queryKey: [...config.chaveQuery, "baixas", id],
    queryFn: () => buscarTodas<Baixa>(config.rotaBaixas(id), config.chaveBaixas, {}, "pagina"),
  });
}

/** Apaga um pagamento/recebimento: a transação some e o compromisso reabre. */
export function useApagarBaixa(config: ConfigCompromisso) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => requisicao<void>(config.rotaApagarBaixa(id), { metodo: "DELETE" }),
    onSuccess: () => invalidarLancamento(queryClient),
  });
}
