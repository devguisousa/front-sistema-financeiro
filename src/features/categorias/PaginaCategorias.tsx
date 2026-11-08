import { Lock, Pencil, Tag, Trash2 } from "lucide-react";
import { useState } from "react";
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
  Skeleton,
} from "../../components/ui";
import { mensagemDoErro } from "../../lib/erros";
import { useTitulo } from "../../lib/titulo";
import type { Categoria, TipoTransacao } from "../../lib/tipos";
import { FormCategoria } from "./FormCategoria";
import { ehDoSistema, useApagarCategoria, useCategoriasTodas } from "./useCategorias";

const GRUPOS: { tipo: TipoTransacao; titulo: string; ponto: string }[] = [
  { tipo: "RECEITA", titulo: "Receitas", ponto: "bg-verde" },
  { tipo: "DESPESA", titulo: "Despesas", ponto: "bg-coral" },
];

export function PaginaCategorias() {
  useTitulo("Categorias");
  const categorias = useCategoriasTodas();
  const apagar = useApagarCategoria();
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [paraApagar, setParaApagar] = useState<Categoria | null>(null);

  async function confirmarApagar() {
    if (!paraApagar) return;
    try {
      await apagar.mutateAsync(paraApagar.id);
      toast.success("Categoria apagada");
    } catch (erro) {
      toast.error(mensagemDoErro(erro));
    }
    setParaApagar(null);
  }

  return (
    <>
      <PageHeader
        kicker="07 — Cadastros"
        titulo="Categorias"
        descricao="Toda categoria tem um tipo. Uma receita só aceita categoria de receita — e uma despesa, de despesa."
      />

      <div className="flex flex-wrap items-start gap-5">
        {(
          <CardLateral aria-labelledby="titulo-nova-categoria" className="flex min-w-0 flex-[1_1_300px] flex-col gap-5 p-6">
            <h2 id="titulo-nova-categoria" className="rotulo">
              Nova categoria
            </h2>
            <FormCategoria />
          </CardLateral>
        )}

        <div className="grid min-w-0 flex-[999_1_560px] gap-5 md:grid-cols-2">
          {categorias.isError ? (
            <Card className="md:col-span-2">
              <ErroCarregar erro={categorias.error} aoTentar={() => void categorias.refetch()} />
            </Card>
          ) : (
            GRUPOS.map((grupo) => {
              const itens = (categorias.data ?? [])
                .filter((c) => c.tipo === grupo.tipo)
                .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
              const idTitulo = `grupo-${grupo.tipo}`;

              return (
                <Card key={grupo.tipo} aria-labelledby={idTitulo} className="flex min-w-0 flex-col">
                  <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
                    <h2 id={idTitulo} className="flex items-center gap-2 text-[16px] font-semibold">
                      <span className={`size-2 rounded-full ${grupo.ponto}`} aria-hidden="true" />
                      {grupo.titulo}
                    </h2>
                    {categorias.data && <Badge>{itens.length}</Badge>}
                  </div>

                  {!categorias.data ? (
                    <div className="flex flex-col gap-2 px-5 pb-5" aria-hidden="true">
                      {Array.from({ length: 4 }, (_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : itens.length === 0 ? (
                    <Empty icone={Tag} titulo={`Nenhuma categoria de ${grupo.titulo.toLowerCase()}`} />
                  ) : (
                    <ul className="flex flex-col pb-2">
                      {itens.map((c) => {
                        const sistema = ehDoSistema(c);
                        return (
                          <li
                            key={c.id}
                            className="flex min-h-12 items-center justify-between gap-3 border-t border-superficie-2 px-5 py-1.5 first:border-t-0"
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <span className="truncate">{c.nome}</span>
                              {sistema && (
                                <Badge className="flex-none">
                                  <Lock size={10} className="mr-1 inline" aria-hidden="true" />
                                  Sistema
                                </Badge>
                              )}
                            </span>
                            {!sistema && (
                              <span className="flex flex-none gap-1">
                                <Button
                                  tamanho="icone"
                                  variante="fantasma"
                                  aria-label={`Editar ${c.nome}`}
                                  onClick={() => setEditando(c)}
                                >
                                  <Pencil size={15} aria-hidden="true" />
                                </Button>
                                <Button
                                  tamanho="icone"
                                  variante="fantasma"
                                  aria-label={`Apagar ${c.nome}`}
                                  onClick={() => setParaApagar(c)}
                                  className="hover:text-coral"
                                >
                                  <Trash2 size={15} aria-hidden="true" />
                                </Button>
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>

      <Dialog
        aberto={editando !== null}
        aoMudar={(aberto) => !aberto && setEditando(null)}
        titulo="Editar categoria"
        descricao="Categoria com lançamentos não pode mudar de tipo."
      >
        {editando && <FormCategoria categoria={editando} aoSalvar={() => setEditando(null)} />}
      </Dialog>

      <ConfirmDialog
        aberto={paraApagar !== null}
        aoMudar={(aberto) => !aberto && setParaApagar(null)}
        titulo={`Apagar "${paraApagar?.nome ?? ""}"?`}
        descricao="Só dá para apagar uma categoria que ainda não tem lançamentos."
        textoConfirmar="Apagar"
        perigo
        carregando={apagar.isPending}
        aoConfirmar={() => void confirmarApagar()}
      />
    </>
  );
}
