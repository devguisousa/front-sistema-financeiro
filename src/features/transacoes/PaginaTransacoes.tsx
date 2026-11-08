import { ArrowDownUp, Lock, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import {
  Badge,
  Button,
  Card,
  CardLateral,
  ConfirmDialog,
  Dialog,
  Empty,
  ErroCarregar,
  PageHeader,
  Pagination,
  Segmentado,
  Select,
  Skeleton,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "../../components/ui";
import { cn } from "../../lib/cn";
import { formatarData } from "../../lib/datas";
import { formatarValor } from "../../lib/dinheiro";
import { mensagemDoErro } from "../../lib/erros";
import { useTitulo } from "../../lib/titulo";
import type { TipoTransacao, Transacao } from "../../lib/tipos";
import { useCategoriasTodas } from "../categorias/useCategorias";
import { useContasTodas } from "../contas/useContas";
import { FormTransacao } from "./FormTransacao";
import { ehManual, origemAutomatica, useApagarTransacao, useListaTransacoes } from "./useTransacoes";

type FiltroTipo = "TODAS" | TipoTransacao;

const numeroOuNada = (texto: string | null) => (texto && /^\d+$/.test(texto) ? Number(texto) : undefined);

export function PaginaTransacoes() {
  useTitulo("Transações");
  const [params, setParams] = useSearchParams();

  const tipoUrl = params.get("tipo");
  const tipo: FiltroTipo = tipoUrl === "RECEITA" || tipoUrl === "DESPESA" ? tipoUrl : "TODAS";
  const contaId = numeroOuNada(params.get("conta"));
  const categoriaId = numeroOuNada(params.get("categoria"));
  const page = numeroOuNada(params.get("pagina")) ?? 1;

  const lista = useListaTransacoes({
    tipo: tipo === "TODAS" ? undefined : tipo,
    contaId,
    categoriaId,
    page,
  });
  const contas = useContasTodas();
  const categorias = useCategoriasTodas();
  const apagar = useApagarTransacao();

  const [editando, setEditando] = useState<Transacao | null>(null);
  const [paraApagar, setParaApagar] = useState<Transacao | null>(null);

  // Mudar filtro volta para a página 1
  function filtrar(chave: string, valor: string | undefined) {
    const proximos = new URLSearchParams(params);
    if (valor) proximos.set(chave, valor);
    else proximos.delete(chave);
    if (chave !== "pagina") proximos.delete("pagina");
    setParams(proximos);
  }

  const temFiltro = tipo !== "TODAS" || contaId !== undefined || categoriaId !== undefined;
  const categoriasDoFiltro = (categorias.data ?? []).filter((c) => tipo === "TODAS" || c.tipo === tipo);

  async function confirmarApagar() {
    if (!paraApagar) return;
    try {
      await apagar.mutateAsync(paraApagar.id);
      toast.success("Lançamento apagado");
      setParaApagar(null);
    } catch (erro) {
      toast.error(mensagemDoErro(erro));
    }
  }

  return (
    <>
      <PageHeader
        kicker="03 — Movimentações"
        titulo="Transações"
        descricao="Toda entrada e saída, conta por conta. A categoria sempre combina com o tipo do lançamento."
      />

      <div className="flex flex-wrap items-start gap-5">
        <Card aria-labelledby="titulo-lista" className="flex min-w-0 flex-[999_1_560px] flex-col overflow-hidden">
          <h2 id="titulo-lista" className="sr-only">
            Lista de transações
          </h2>

          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <Segmentado
                rotulo="Filtrar por tipo"
                valor={tipo}
                aoMudar={(v) => filtrar("tipo", v === "TODAS" ? undefined : v)}
                opcoes={[
                  { valor: "TODAS", rotulo: "Todas" },
                  { valor: "RECEITA", rotulo: "Receitas", ponto: "verde" },
                  { valor: "DESPESA", rotulo: "Despesas", ponto: "coral" },
                ]}
              />
              <Select
                aria-label="Filtrar por conta"
                value={contaId ?? ""}
                onChange={(e) => filtrar("conta", e.target.value || undefined)}
                className="w-auto [&_select]:min-h-10 [&_select]:rounded-full [&_select]:text-[13px]"
              >
                <option value="">Todas as contas</option>
                {(contas.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </Select>
              <Select
                aria-label="Filtrar por categoria"
                value={categoriaId ?? ""}
                onChange={(e) => filtrar("categoria", e.target.value || undefined)}
                className="w-auto [&_select]:min-h-10 [&_select]:rounded-full [&_select]:text-[13px]"
              >
                <option value="">Todas as categorias</option>
                {categoriasDoFiltro.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </Select>
            </div>
            {lista.data && (
              <span className="font-mono text-[12px] text-musgo-2">
                {lista.data.itens.length} nesta página · {lista.data.total} no total
              </span>
            )}
          </div>

          {lista.isError ? (
            <ErroCarregar erro={lista.error} aoTentar={() => void lista.refetch()} />
          ) : !lista.data ? (
            <div className="flex flex-col gap-2 px-5 pb-5" aria-hidden="true">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-11 w-full" />
              ))}
            </div>
          ) : lista.data.itens.length === 0 ? (
            <Empty
              icone={ArrowDownUp}
              titulo={temFiltro ? "Nada com esses filtros" : "Nenhum lançamento ainda"}
              texto={
                temFiltro
                  ? "Tente outro tipo, conta ou categoria."
                  : "Use o lançamento rápido para registrar a primeira entrada ou saída."
              }
              acao={temFiltro && <Button onClick={() => setParams({})}>Limpar filtros</Button>}
            />
          ) : (
            <>
              <Table>
                <THead>
                  <tr>
                    <Th>Data</Th>
                    <Th>Descrição</Th>
                    <Th>Categoria</Th>
                    <Th>Conta</Th>
                    <Th numero>Valor</Th>
                    <Th>
                      <span className="sr-only">Ações</span>
                    </Th>
                  </tr>
                </THead>
                <TBody>
                  {lista.data.itens.map((t) => {
                    const origem = origemAutomatica(t);
                    return (
                      <Tr key={t.id}>
                        <Td className="font-mono text-[12px] whitespace-nowrap text-musgo">
                          {formatarData(t.data)}
                        </Td>
                        <Td className="max-w-[260px]">
                          <span className="flex min-w-0 flex-col gap-1">
                            <span className="truncate">{t.descricao}</span>
                            {origem && (
                              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-musgo-2">
                                <Lock size={12} aria-hidden="true" />
                                {origem}
                              </span>
                            )}
                          </span>
                        </Td>
                        <Td>
                          <Badge>{t.categoria.nome}</Badge>
                        </Td>
                        <Td className="text-[13px] whitespace-nowrap text-musgo">{t.conta.nome}</Td>
                        <Td numero className={cn("text-[14px]", t.tipo === "RECEITA" ? "text-verde" : "text-coral")}>
                          {t.tipo === "RECEITA" ? "+ " : "− "}
                          {formatarValor(t.valor)}
                        </Td>
                        <Td className="w-[96px] py-2">
                          {ehManual(t) && (
                            <span className="flex justify-end gap-1">
                              <Button
                                tamanho="icone"
                                variante="fantasma"
                                aria-label={`Editar ${t.descricao}`}
                                onClick={() => setEditando(t)}
                              >
                                <Pencil size={15} aria-hidden="true" />
                              </Button>
                              <Button
                                tamanho="icone"
                                variante="fantasma"
                                aria-label={`Apagar ${t.descricao}`}
                                onClick={() => setParaApagar(t)}
                                className="hover:text-coral"
                              >
                                <Trash2 size={15} aria-hidden="true" />
                              </Button>
                            </span>
                          )}
                        </Td>
                      </Tr>
                    );
                  })}
                </TBody>
              </Table>
              <Pagination
                pagina={lista.data.pagina}
                totalPaginas={lista.data.totalPaginas}
                aoMudar={(p) => filtrar("pagina", String(p))}
              />
            </>
          )}
        </Card>

        <CardLateral aria-labelledby="titulo-nova" className="flex min-w-0 flex-[1_1_340px] flex-col gap-5 p-6">
          <div className="flex flex-col gap-2">
            <span className="kicker text-[11px]">Lançamento rápido</span>
            <h2 id="titulo-nova" className="text-[22px] font-semibold tracking-[-.03em]">
              Nova transação
            </h2>
          </div>
          <FormTransacao />
        </CardLateral>
      </div>

      <Dialog
        aberto={editando !== null}
        aoMudar={(aberto) => !aberto && setEditando(null)}
        titulo="Editar lançamento"
      >
        {editando && <FormTransacao transacao={editando} aoSalvar={() => setEditando(null)} />}
      </Dialog>

      <ConfirmDialog
        aberto={paraApagar !== null}
        aoMudar={(aberto) => !aberto && setParaApagar(null)}
        titulo="Apagar lançamento?"
        descricao={
          paraApagar
            ? `"${paraApagar.descricao}" (${formatarValor(paraApagar.valor)}) será apagado e o saldo da conta volta ao que era.`
            : ""
        }
        textoConfirmar="Apagar"
        perigo
        carregando={apagar.isPending}
        aoConfirmar={() => void confirmarApagar()}
      />
    </>
  );
}
