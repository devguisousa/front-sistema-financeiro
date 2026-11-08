import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button, ConfirmDialog, ErroCarregar, Skeleton } from "../../components/ui";
import { formatarData } from "../../lib/datas";
import { formatarValor } from "../../lib/dinheiro";
import { mensagemDoErro } from "../../lib/erros";
import type { Baixa } from "../../lib/tipos";
import { useContasTodas, useSaldos } from "../contas/useContas";
import type { Compromisso, ConfigCompromisso } from "./config";
import { useApagarBaixa, useBaixas } from "./useCompromissos";

type Props = { config: ConfigCompromisso; item: Compromisso };

/** Lista de pagamentos/recebimentos de um compromisso, com opção de apagar. */
export function HistoricoBaixas({ config, item }: Props) {
  const baixas = useBaixas(config, item.id);
  const contas = useContasTodas();
  const saldos = useSaldos(contas.data);
  const apagar = useApagarBaixa(config);
  const [paraApagar, setParaApagar] = useState<Baixa | null>(null);

  const nomeDaConta = (id: number) => contas.data?.find((c) => c.id === id)?.nome ?? `Conta #${id}`;

  // Saldo digitado depois da baixa: apagar não mexe mais no saldo da conta
  function efeito(b: Baixa) {
    const definidoEm = saldos.data?.[b.contaId]?.saldoDefinidoEm;
    return definidoEm && new Date(definidoEm) > new Date(b.data)
      ? config.textos.efeitoApagarSemSaldo
      : config.textos.efeitoApagar;
  }

  async function confirmar() {
    if (!paraApagar) return;
    try {
      await apagar.mutateAsync(paraApagar.id);
      toast.success(config.textos.baixaApagada);
    } catch (erro) {
      toast.error(mensagemDoErro(erro));
    }
    setParaApagar(null);
  }

  if (baixas.isError) return <ErroCarregar erro={baixas.error} aoTentar={() => void baixas.refetch()} />;

  if (!baixas.data) {
    return (
      <div className="flex flex-col gap-2" aria-hidden="true">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (baixas.data.length === 0) return <p className="text-[14px] text-musgo">{config.textos.semBaixas}</p>;

  return (
    <>
      <ul aria-label={config.textos.historico} className="flex flex-col divide-y divide-superficie-2">
        {baixas.data.map((b) => (
          <li key={b.id} className="flex items-center justify-between gap-3 py-3">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="num font-mono text-[15px] font-medium">{formatarValor(b.valor)}</span>
              <span className="truncate text-[12px] text-musgo">
                {formatarData(b.data)} · {nomeDaConta(b.contaId)}
              </span>
            </div>
            <Button
              tamanho="icone"
              variante="fantasma"
              aria-label={`${config.textos.apagarBaixa} de ${formatarValor(b.valor)} em ${formatarData(b.data)}`}
              onClick={() => setParaApagar(b)}
              className="flex-none hover:text-coral"
            >
              <Trash2 size={15} aria-hidden="true" />
            </Button>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        aberto={paraApagar !== null}
        aoMudar={(aberto) => !aberto && setParaApagar(null)}
        titulo={`${config.textos.apagarBaixa} de ${paraApagar ? formatarValor(paraApagar.valor) : ""}?`}
        descricao={paraApagar ? efeito(paraApagar) : ""}
        textoConfirmar="Apagar"
        perigo
        carregando={apagar.isPending}
        aoConfirmar={() => void confirmar()}
      />
    </>
  );
}
