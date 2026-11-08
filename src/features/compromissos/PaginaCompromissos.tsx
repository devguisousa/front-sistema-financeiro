import { CalendarClock, History, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import {
  Badge,
  BadgeVencimento,
  Button,
  Card,
  ConfirmDialog,
  Dialog,
  Empty,
  ErroCarregar,
  PageHeader,
  Pagination,
  Segmentado,
  Skeleton,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "../../components/ui";
import { cn } from "../../lib/cn";
import { diasAteVencimento, formatarVencimento } from "../../lib/datas";
import { formatarBRL, formatarValor, paraCentavos } from "../../lib/dinheiro";
import { mensagemDoErro } from "../../lib/erros";
import { useTitulo } from "../../lib/titulo";
import type { Compromisso, ConfigCompromisso, Situacao } from "./config";
import { FormBaixa } from "./FormBaixa";
import { FormCompromisso } from "./FormCompromisso";
import { HistoricoBaixas } from "./HistoricoBaixas";
import { restante } from "./restante";
import { useApagarCompromisso, useListaCompromissos, useResumoCompromissos } from "./useCompromissos";

type FiltroSituacao = "todas" | Situacao;

const TOM_SITUACAO = { pendente: "neutro", parcial: "neutro", quitado: "verde" } as const;

function Numero({ rotulo, qtd, total, alerta }: { rotulo: string; qtd?: number; total?: number; alerta?: boolean }) {
  return (
    <Card className="flex flex-col gap-3 p-5">
      <span className="rotulo">{rotulo}</span>
      {total === undefined ? (
        <Skeleton className="h-7 w-32" />
      ) : (
        <span className={cn("num font-mono text-[24px] leading-none font-medium", alerta && total > 0 && "text-coral")}>
          {formatarBRL(total)}
        </span>
      )}
      <span className="text-[13px] text-musgo">
        {qtd === undefined ? " " : `${qtd} ${qtd === 1 ? "conta" : "contas"}`}
      </span>
    </Card>
  );
}

export function PaginaCompromissos({ config }: { config: ConfigCompromisso }) {
  useTitulo(config.tela);
  const [params, setParams] = useSearchParams();

  const situacaoUrl = params.get("status");
  const situacao: FiltroSituacao =
    situacaoUrl === "pendente" || situacaoUrl === "parcial" || situacaoUrl === "quitado" ? situacaoUrl : "todas";
  const vencidas = params.get("vencidas") === "1";
  const pagina = Number(params.get("pagina")) || 1;

  const lista = useListaCompromissos(config, {
    situacao: situacao === "todas" ? undefined : situacao,
    vencidas,
    pagina,
  });
  const resumo = useResumoCompromissos(config);
  const apagar = useApagarCompromisso(config);

  const [formulario, setFormulario] = useState<{ item?: Compromisso } | null>(null);
  const [baixa, setBaixa] = useState<Compromisso | null>(null);
  const [historico, setHistorico] = useState<Compromisso | null>(null);
  const [paraApagar, setParaApagar] = useState<Compromisso | null>(null);

  function filtrar(chave: string, valor: string | undefined) {
    const proximos = new URLSearchParams(params);
    if (valor) proximos.set(chave, valor);
    else proximos.delete(chave);
    if (chave !== "pagina") proximos.delete("pagina");
    setParams(proximos);
  }

  async function confirmarApagar() {
    if (!paraApagar) return;
    try {
      await apagar.mutateAsync(paraApagar.id);
      toast.success(config.textos.apagado);
      setParaApagar(null);
    } catch (erro) {
      toast.error(mensagemDoErro(erro));
    }
  }

  const nomeLista = `Lista de ${config.tela.toLowerCase()}`;
  const temFiltro = situacao !== "todas" || vencidas;

  return (
    <>
      <PageHeader
        kicker={config.kicker}
        titulo={config.tela}
        descricao={config.descricao}
        acoes={
          (
            <Button variante="primario" onClick={() => setFormulario({})}>
              <Plus size={16} aria-hidden="true" />
              {config.textos.novo}
            </Button>
          )
        }
      />

      {resumo.isError ? (
        <Card>
          <ErroCarregar erro={resumo.error} aoTentar={() => void resumo.refetch()} />
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-3">
          <Numero rotulo="Em aberto" qtd={resumo.data?.emAberto.qtd} total={resumo.data?.emAberto.total} />
          <Numero rotulo="Vencidas" qtd={resumo.data?.vencidas.qtd} total={resumo.data?.vencidas.total} alerta />
          <Numero rotulo="Vencem em 7 dias" qtd={resumo.data?.proximas.qtd} total={resumo.data?.proximas.total} />
        </div>
      )}

      <Card aria-labelledby="titulo-lista-compromissos" className="flex min-w-0 flex-col overflow-hidden">
        <h2 id="titulo-lista-compromissos" className="sr-only">
          {nomeLista}
        </h2>
        <div className="flex flex-wrap items-center gap-3 px-5 py-4">
          <Segmentado
            rotulo="Filtrar por status"
            valor={situacao}
            aoMudar={(v) => filtrar("status", v === "todas" ? undefined : v)}
            opcoes={[
              { valor: "todas", rotulo: "Todas" },
              { valor: "pendente", rotulo: "Pendentes" },
              { valor: "parcial", rotulo: "Parciais" },
              { valor: "quitado", rotulo: config.tipoCategoria === "DESPESA" ? "Pagas" : "Recebidas" },
            ]}
          />
          <Button
            tamanho="sm"
            aria-pressed={vencidas}
            onClick={() => filtrar("vencidas", vencidas ? undefined : "1")}
            className={cn(vencidas && "border-coral/40 bg-coral/10 text-coral")}
          >
            Só vencidas
          </Button>
        </div>

        {lista.isError ? (
          <ErroCarregar erro={lista.error} aoTentar={() => void lista.refetch()} />
        ) : !lista.data ? (
          <div className="flex flex-col gap-2 px-5 pb-5" aria-hidden="true">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : lista.data.itens.length === 0 ? (
          <Empty
            icone={CalendarClock}
            titulo={temFiltro ? "Nada com esses filtros" : config.textos.vazio}
            texto={temFiltro ? "Tente outro status." : undefined}
            acao={
              temFiltro ? (
                <Button onClick={() => setParams({})}>Limpar filtros</Button>
              ) : (
                (
                  <Button variante="primario" onClick={() => setFormulario({})}>
                    <Plus size={16} aria-hidden="true" />
                    {config.textos.novo}
                  </Button>
                )
              )
            }
          />
        ) : (
          <>
            <Table className="min-w-[860px]">
              <THead>
                <tr>
                  <Th>Descrição</Th>
                  <Th>Vencimento</Th>
                  <Th numero>Total</Th>
                  <Th numero>{config.textos.quitado}</Th>
                  <Th numero>Falta</Th>
                  <Th>Status</Th>
                  <Th>
                    <span className="sr-only">Ações</span>
                  </Th>
                </tr>
              </THead>
              <TBody>
                {lista.data.itens.map((c) => {
                  const quitado = c.situacao === "quitado";
                  return (
                    <Tr key={c.id}>
                      <Td className="max-w-[240px] truncate">{c.descricao}</Td>
                      <Td>
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[12px] text-musgo">{formatarVencimento(c.vencimento)}</span>
                          {!quitado && <BadgeVencimento diasAte={diasAteVencimento(c.vencimento)} />}
                        </span>
                      </Td>
                      <Td numero>{formatarValor(c.valorTotal)}</Td>
                      <Td numero className="text-musgo">{formatarValor(c.valorQuitado)}</Td>
                      <Td numero className={cn(!quitado && "font-semibold")}>{formatarBRL(restante(c))}</Td>
                      <Td>
                        <Badge tom={TOM_SITUACAO[c.situacao]}>{config.rotuloSituacao[c.situacao]}</Badge>
                      </Td>
                      <Td className="py-2">
                        <span className="flex items-center justify-end gap-1">
                          {!quitado && (
                            <Button
                              tamanho="sm"
                              onClick={() => setBaixa(c)}
                              aria-label={`${config.textos.baixa} de ${c.descricao}`}
                            >
                              {config.textos.baixa}
                            </Button>
                          )}
                          {paraCentavos(c.valorQuitado) > 0 && (
                            <Button
                              tamanho="icone"
                              variante="fantasma"
                              aria-label={`${config.textos.historico} de ${c.descricao}`}
                              title={config.textos.historico}
                              onClick={() => setHistorico(c)}
                            >
                              <History size={15} aria-hidden="true" />
                            </Button>
                          )}
                          {(
                            <>
                              <Button
                                tamanho="icone"
                                variante="fantasma"
                                aria-label={`Editar ${c.descricao}`}
                                onClick={() => setFormulario({ item: c })}
                              >
                                <Pencil size={15} aria-hidden="true" />
                              </Button>
                              <Button
                                tamanho="icone"
                                variante="fantasma"
                                aria-label={`Apagar ${c.descricao}`}
                                onClick={() => setParaApagar(c)}
                                className="hover:text-coral"
                              >
                                <Trash2 size={15} aria-hidden="true" />
                              </Button>
                            </>
                          )}
                        </span>
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

      <Dialog
        aberto={formulario !== null}
        aoMudar={(aberto) => !aberto && setFormulario(null)}
        titulo={formulario?.item ? config.textos.editar : config.textos.novo}
      >
        {formulario && (
          <FormCompromisso config={config} item={formulario.item} aoSalvar={() => setFormulario(null)} />
        )}
      </Dialog>

      <Dialog
        aberto={baixa !== null}
        aoMudar={(aberto) => !aberto && setBaixa(null)}
        titulo={config.textos.baixa}
        descricao={baixa ? `${baixa.descricao} · falta ${formatarBRL(restante(baixa))}` : undefined}
      >
        {baixa && <FormBaixa config={config} item={baixa} aoSalvar={() => setBaixa(null)} />}
      </Dialog>

      <Dialog
        aberto={historico !== null}
        aoMudar={(aberto) => !aberto && setHistorico(null)}
        titulo={config.textos.historico}
        descricao={historico?.descricao}
      >
        {historico && <HistoricoBaixas config={config} item={historico} />}
      </Dialog>

      <ConfirmDialog
        aberto={paraApagar !== null}
        aoMudar={(aberto) => !aberto && setParaApagar(null)}
        titulo={`Apagar "${paraApagar?.descricao ?? ""}"?`}
        descricao="Só dá para apagar quando não há pagamentos ou recebimentos registrados. Apague-os antes pelo histórico."
        textoConfirmar="Apagar"
        perigo
        carregando={apagar.isPending}
        aoConfirmar={() => void confirmarApagar()}
      />
    </>
  );
}
