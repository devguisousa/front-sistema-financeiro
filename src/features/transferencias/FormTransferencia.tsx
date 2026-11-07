import { ArrowRight, ArrowUpDown } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button, CampoValor, Field, Input, PreviaSaldo, Select } from "../../components/ui";
import { formatarBRL, lerValorDigitado, paraCentavos } from "../../lib/dinheiro";
import { tratarErroDeFormulario, validarValor } from "../../lib/formulario";
import { useContasTodas, useSaldos } from "../contas/useContas";
import { type CorpoTransferencia, useTransferir } from "./useTransferencias";

export function FormTransferencia() {
  const [origem, setOrigem] = useState("");
  const [destino, setDestino] = useState("");
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [campos, setCampos] = useState<Record<string, string>>({});

  const contas = useContasTodas();
  const saldos = useSaldos(contas.data);
  const transferir = useTransferir();

  const lido = lerValorDigitado(valor);
  const centavos = lido ? paraCentavos(lido) : 0;
  const saldoOrigem = origem ? saldos.data?.[Number(origem)] : undefined;

  function trocarOrigem(nova: string) {
    setOrigem(nova);
    if (nova && nova === destino) setDestino("");
  }

  function inverter() {
    setOrigem(destino);
    setDestino(origem);
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const erros: Record<string, string> = {};
    if (!origem) erros.contaOrigemId = "Escolha a conta de origem.";
    if (!destino) erros.contaDestinoId = "Escolha a conta de destino.";
    const checado = validarValor(lido);
    if (!checado.ok) erros.valor = checado.erro;
    setCampos(erros);
    if (Object.keys(erros).length || !checado.ok) return;

    const corpo: CorpoTransferencia = {
      contaOrigemId: Number(origem),
      contaDestinoId: Number(destino),
      valor: checado.valor,
    };
    if (descricao.trim()) corpo.descricao = descricao.trim();

    try {
      await transferir.mutateAsync(corpo);
      toast.success("Transferência feita");
      setValor("");
      setDescricao("");
    } catch (erro) {
      tratarErroDeFormulario(erro, setCampos);
    }
  }

  const opcoes = (excluir?: string) =>
    (contas.data ?? [])
      .filter((c) => String(c.id) !== excluir)
      .map((c) => (
        <option key={c.id} value={c.id}>
          {c.nome}
        </option>
      ));

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-2.5">
        <Field rotulo="De" erro={campos.contaOrigemId}>
          {(props) => (
            <Select {...props} value={origem} onChange={(e) => trocarOrigem(e.target.value)}>
              <option value="">Escolha a conta</option>
              {opcoes()}
            </Select>
          )}
        </Field>
        {saldoOrigem && lido && lido !== "0.00" && (
          <PreviaSaldo
            atual={paraCentavos(saldoOrigem.saldoAtual)}
            depois={paraCentavos(saldoOrigem.saldoAtual) - centavos}
          />
        )}
      </div>

      <Button tamanho="sm" onClick={inverter} aria-label="Inverter origem e destino" className="self-center">
        <ArrowUpDown size={14} aria-hidden="true" />
        Inverter
      </Button>

      <Field rotulo="Para" erro={campos.contaDestinoId}>
        {(props) => (
          <Select {...props} value={destino} onChange={(e) => setDestino(e.target.value)}>
            <option value="">Escolha a conta</option>
            {opcoes(origem)}
          </Select>
        )}
      </Field>

      <Field rotulo="Valor" erro={campos.valor}>
        {(props) => (
          <CampoValor
            {...props}
            valor={valor}
            aoMudar={setValor}
            className="min-h-14 text-[22px] font-semibold tracking-[-.02em]"
          />
        )}
      </Field>

      <Field rotulo="Descrição" erro={campos.descricao} dica="Em branco, fica “Transferência entre contas”.">
        {(props) => (
          <Input
            {...props}
            maxLength={150}
            placeholder="Ex.: Reserva mensal"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        )}
      </Field>

      <Button type="submit" variante="primario" carregando={transferir.isPending} className="min-h-12 w-full">
        Transferir {formatarBRL(centavos)}
        <ArrowRight size={16} aria-hidden="true" />
      </Button>
    </form>
  );
}
