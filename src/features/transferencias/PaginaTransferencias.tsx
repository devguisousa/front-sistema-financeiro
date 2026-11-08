import { ArrowLeftRight, Undo2 } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import {
  Badge,
  Button,
  Card,
  CardLateral,
  ConfirmDialog,
  Empty,
  ErroCarregar,
  PageHeader,
  Pagination,
  Skeleton,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "../../components/ui";
import { formatarData } from "../../lib/datas";
import { formatarValor } from "../../lib/dinheiro";
import { mensagemDoErro } from "../../lib/erros";
import { useTitulo } from "../../lib/titulo";
import type { Transferencia } from "../../lib/tipos";
import { useContasTodas } from "../contas/useContas";
import { FormTransferencia } from "./FormTransferencia";
import { useEstornar, useListaTransferencias } from "./useTransferencias";

export function PaginaTransferencias() {
  useTitulo("Transferências");
  const [params, setParams] = useSearchParams();
  const page = Number(params.get("pagina")) || 1;

  const lista = useListaTransferencias(page);
  const contas = useContasTodas();
  const estornar = useEstornar();
  const [paraEstornar, setParaEstornar] = useState<Transferencia | null>(null);

  const nomeDa = (id: number) => contas.data?.find((c) => c.id === id)?.nome ?? `Conta ${id}`;

  async function confirmarEstorno() {
    if (!paraEstornar) return;
    try {
      await estornar.mutateAsync(paraEstornar.id);
      toast.success("Transferência estornada");
      setParaEstornar(null);
    } catch (erro) {
      toast.error(mensagemDoErro(erro));
    }
  }

  return (
    <>
      <PageHeader
        kicker="03 — Movimentações"
        titulo="Transferências"
        descricao="Dinheiro que muda de conta, sem virar receita nem despesa de verdade. Cada transferência cria duas transações: uma saída na origem e uma entrada no destino."
      />

      <div className="flex flex-wrap items-start gap-5">
        <CardLateral aria-labelledby="titulo-mover" className="flex min-w-0 flex-[1_1_340px] flex-col gap-5 p-6">
          <div className="flex flex-col gap-2">
            <span className="kicker text-[11px]">Nova transferência</span>
            <h2 id="titulo-mover" className="text-[22px] font-semibold tracking-[-.03em]">
              Mover dinheiro
            </h2>
          </div>
          <FormTransferencia />
        </CardLateral>

        <Card aria-labelledby="titulo-historico" className="flex min-w-0 flex-[999_1_560px] flex-col overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
            <div className="flex flex-col gap-1">
              <h2 id="titulo-historico" className="text-[16px] font-semibold tracking-[-.02em]">
                Histórico
              </h2>
              <p className="text-[13px] text-musgo">
                Estornar apaga as duas transações e devolve o valor para a origem.
              </p>
            </div>
            {lista.data && (
              <Badge>
                {lista.data.total} {lista.data.total === 1 ? "transferência" : "transferências"}
              </Badge>
            )}
          </div>

          {lista.isError ? (
            <ErroCarregar erro={lista.error} aoTentar={() => void lista.refetch()} />
          ) : !lista.data ? (
            <div className="flex flex-col gap-2 px-5 pb-5" aria-hidden="true">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-11 w-full" />
              ))}
            </div>
          ) : lista.data.itens.length === 0 ? (
            <Empty
              icone={ArrowLeftRight}
              titulo="Nenhuma transferência ainda"
              texto="Use o formulário para mover dinheiro entre duas contas."
            />
          ) : (
            <>
              <Table>
                <THead>
                  <tr>
                    <Th>Data</Th>
                    <Th>Descrição</Th>
                    <Th>Contas</Th>
                    <Th numero>Valor</Th>
                    <Th>
                      <span className="sr-only">Ações</span>
                    </Th>
                  </tr>
                </THead>
                <TBody>
                  {lista.data.itens.map((t) => (
                    <Tr key={t.id}>
                      <Td className="font-mono text-[12px] whitespace-nowrap text-musgo">{formatarData(t.data)}</Td>
                      <Td className="max-w-[240px] truncate">{t.descricao}</Td>
                      <Td className="text-[13px] whitespace-nowrap text-musgo">
                        {`${nomeDa(t.contaOrigemId)} → ${nomeDa(t.contaDestinoId)}`}
                      </Td>
                      <Td numero className="text-[14px]">
                        {formatarValor(t.valor)}
                      </Td>
                      <Td className="w-[120px] py-2 text-right">
                        {(
                          <Button
                            tamanho="sm"
                            variante="fantasma"
                            aria-label={`Estornar ${t.descricao} de ${formatarData(t.data)}`}
                            onClick={() => setParaEstornar(t)}
                          >
                            <Undo2 size={14} aria-hidden="true" />
                            Estornar
                          </Button>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
              <Pagination
                pagina={lista.data.pagina}
                totalPaginas={lista.data.totalPaginas}
                aoMudar={(p) => setParams({ pagina: String(p) })}
              />
            </>
          )}
        </Card>
      </div>

      <ConfirmDialog
        aberto={paraEstornar !== null}
        aoMudar={(aberto) => !aberto && setParaEstornar(null)}
        titulo="Estornar transferência?"
        descricao="Os dois lançamentos serão apagados e o valor volta para a conta de origem."
        textoConfirmar="Estornar transferência"
        perigo
        carregando={estornar.isPending}
        aoConfirmar={() => void confirmarEstorno()}
      />
    </>
  );
}
