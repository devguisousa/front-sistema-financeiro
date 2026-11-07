import { Pencil, Plus, Trash2, WalletCards } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Button,
  Card,
  ConfirmDialog,
  Dialog,
  Empty,
  ErroCarregar,
  PageHeader,
  Skeleton,
} from "../../components/ui";
import { formatarBRL, formatarValor, paraCentavos } from "../../lib/dinheiro";
import { mensagemDoErro } from "../../lib/erros";
import { useTitulo } from "../../lib/titulo";
import type { Conta, Saldo } from "../../lib/tipos";
import { useAuth } from "../../lib/useAuth";
import { FormConta } from "./FormConta";
import { useApagarConta, useContasTodas, useSaldos } from "./useContas";

const dataCriacao = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

function Linha({ rotulo, valor, destaque }: { rotulo: string; valor: string; destaque?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="rotulo">{rotulo}</span>
      <span className={destaque ? "num font-mono text-[20px] font-medium" : "num font-mono text-[14px] text-nevoa-2"}>
        {valor}
      </span>
    </div>
  );
}

function CartaoConta({
  conta,
  saldo,
  ehAdmin,
  aoEditar,
  aoExcluir,
}: {
  conta: Conta;
  saldo: Saldo | undefined;
  ehAdmin: boolean;
  aoEditar(): void;
  aoExcluir(): void;
}) {
  const idTitulo = `conta-${conta.id}`;
  return (
    <Card aria-labelledby={idTitulo} className="flex flex-col gap-5 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="rotulo">
            Conta #{conta.id} · criada em {dataCriacao.format(new Date(conta.criadoEm))}
          </span>
          <h2 id={idTitulo} className="truncate text-[20px] font-semibold tracking-[-.03em]">
            {conta.nome}
          </h2>
        </div>
        {ehAdmin && (
          <div className="flex flex-none gap-1">
            <Button tamanho="icone" variante="fantasma" aria-label={`Editar ${conta.nome}`} onClick={aoEditar}>
              <Pencil size={15} aria-hidden="true" />
            </Button>
            <Button
              tamanho="icone"
              variante="fantasma"
              aria-label={`Excluir ${conta.nome}`}
              onClick={aoExcluir}
              className="hover:text-coral"
            >
              <Trash2 size={15} aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>
      {saldo ? (
        <div className="flex flex-col gap-2.5">
          <Linha rotulo="Saldo inicial" valor={formatarValor(saldo.saldoInicial)} />
          <Linha rotulo="+ Receitas" valor={formatarValor(saldo.totalReceitas)} />
          <Linha rotulo="− Despesas" valor={formatarValor(saldo.totalDespesas)} />
          <hr className="border-superficie-3" />
          <Linha rotulo="= Saldo atual" valor={formatarValor(saldo.saldoAtual)} destaque />
        </div>
      ) : (
        <Skeleton className="h-28 w-full" />
      )}
    </Card>
  );
}

export function PaginaContas() {
  useTitulo("Contas");
  const { ehAdmin } = useAuth();
  const contas = useContasTodas();
  const saldos = useSaldos(contas.data);
  const apagar = useApagarConta();

  const [formulario, setFormulario] = useState<{ conta?: Conta } | null>(null);
  const [paraExcluir, setParaExcluir] = useState<Conta | null>(null);

  const consolidado = saldos.data
    ? Object.values(saldos.data).reduce((soma, s) => soma + paraCentavos(s.saldoAtual), 0)
    : undefined;

  async function confirmarExcluir() {
    if (!paraExcluir) return;
    try {
      await apagar.mutateAsync(paraExcluir.id);
      toast.success("Conta excluída");
      setParaExcluir(null);
    } catch (erro) {
      toast.error(mensagemDoErro(erro));
      setParaExcluir(null);
    }
  }

  const novaConta = (texto: string) =>
    ehAdmin && (
      <Button variante="primario" onClick={() => setFormulario({})}>
        <Plus size={16} aria-hidden="true" />
        {texto}
      </Button>
    );

  return (
    <>
      <PageHeader
        kicker="06 — Cadastros"
        titulo="Contas"
        descricao="Onde o dinheiro mora. Nenhuma conta fica negativa — o sistema barra qualquer saída maior que o saldo."
        acoes={novaConta("Nova conta")}
      />

      {contas.isError ? (
        <Card>
          <ErroCarregar erro={contas.error} aoTentar={() => void contas.refetch()} />
        </Card>
      ) : contas.data?.length === 0 ? (
        <Card>
          <Empty
            icone={WalletCards}
            titulo="Nenhuma conta ainda"
            texto="Banco, carteira, reserva: cada lugar onde o dinheiro fica é uma conta."
            acao={novaConta("Cadastrar primeira conta")}
          />
        </Card>
      ) : (
        <>
          <Card aria-labelledby="titulo-consolidado" className="flex flex-wrap items-end justify-between gap-4 p-6">
            <div className="flex flex-col gap-3">
              <h2 id="titulo-consolidado" className="rotulo">
                Saldo consolidado
              </h2>
              {consolidado === undefined ? (
                <Skeleton className="h-11 w-56" />
              ) : (
                <p className="num font-mono text-[clamp(32px,4vw,44px)] leading-none font-medium tracking-[-.03em]">
                  {formatarBRL(consolidado)}
                </p>
              )}
            </div>
            {contas.data && (
              <span className="text-[13px] text-musgo">
                {contas.data.length} {contas.data.length === 1 ? "conta" : "contas"}
              </span>
            )}
          </Card>

          {saldos.isError && (
            <Card>
              <ErroCarregar erro={saldos.error} aoTentar={() => void saldos.refetch()} />
            </Card>
          )}

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {!contas.data
              ? Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-60 w-full rounded-[18px]" />)
              : contas.data.map((c) => (
                  <CartaoConta
                    key={c.id}
                    conta={c}
                    saldo={saldos.data?.[c.id]}
                    ehAdmin={ehAdmin}
                    aoEditar={() => setFormulario({ conta: c })}
                    aoExcluir={() => setParaExcluir(c)}
                  />
                ))}
          </div>
        </>
      )}

      <Dialog
        aberto={formulario !== null}
        aoMudar={(aberto) => !aberto && setFormulario(null)}
        titulo={formulario?.conta ? "Editar conta" : "Nova conta"}
      >
        {formulario && <FormConta conta={formulario.conta} aoSalvar={() => setFormulario(null)} />}
      </Dialog>

      <ConfirmDialog
        aberto={paraExcluir !== null}
        aoMudar={(aberto) => !aberto && setParaExcluir(null)}
        titulo={`Excluir "${paraExcluir?.nome ?? ""}"?`}
        descricao="Só dá para excluir uma conta sem movimentações."
        textoConfirmar="Excluir"
        perigo
        carregando={apagar.isPending}
        aoConfirmar={() => void confirmarExcluir()}
      />
    </>
  );
}
