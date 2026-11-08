import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button, CampoValor, Field, Input } from "../../components/ui";
import { centavosParaCampo, lerValorDigitado, paraCentavos } from "../../lib/dinheiro";
import { tratarErroDeFormulario, validarValor } from "../../lib/formulario";
import type { Conta, Saldo } from "../../lib/tipos";
import { type CorpoConta, useSalvarConta } from "./useContas";

type Props = { conta?: Conta | undefined; saldo?: Saldo | undefined; aoSalvar(): void };

export function FormConta({ conta, saldo, aoSalvar }: Props) {
  const editando = conta !== undefined;
  // Na edição o campo é o saldo atual: o valor digitado vira o saldo da conta
  const campoSaldo = editando ? "saldoAtual" : "saldoInicial";
  const [nome, setNome] = useState(conta?.nome ?? "");
  const [valor, setValor] = useState(
    editando && saldo ? centavosParaCampo(paraCentavos(saldo.saldoAtual)) : "",
  );
  const [campos, setCampos] = useState<Record<string, string>>({});
  const salvar = useSalvarConta();

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const erros: Record<string, string> = {};
    if (!nome.trim()) erros.nome = "Informe o nome.";

    const corpo: CorpoConta = { nome: nome.trim() };
    if (!editando) {
      // Em branco = começa do zero
      const checado = validarValor(valor.trim() ? lerValorDigitado(valor) : "0.00", { permitirZero: true });
      if (checado.ok) corpo.saldoInicial = checado.valor;
      else erros.saldoInicial = checado.erro;
    } else if (valor.trim()) {
      // Só manda o saldo se mudou: igual ao atual, a conta segue como está
      const checado = validarValor(lerValorDigitado(valor), { permitirZero: true });
      if (!checado.ok) erros.saldoAtual = checado.erro;
      else if (!saldo || paraCentavos(checado.valor) !== paraCentavos(saldo.saldoAtual)) {
        corpo.saldoAtual = checado.valor;
      }
    }

    setCampos(erros);
    if (Object.keys(erros).length) return;

    try {
      await salvar.mutateAsync({ id: conta?.id, corpo });
      toast.success("Conta salva");
      aoSalvar();
    } catch (erro) {
      tratarErroDeFormulario(erro, setCampos);
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
      <Field rotulo="Nome" erro={campos.nome}>
        {(props) => (
          <Input
            {...props}
            maxLength={100}
            placeholder="Ex.: Conta corrente"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        )}
      </Field>
      <Field
        rotulo={editando ? "Saldo atual" : "Saldo inicial"}
        erro={campos[campoSaldo]}
        dica={
          editando
            ? "O valor digitado vira o saldo da conta. Pagamentos e recebimentos feitos depois continuam mexendo nele."
            : "Pode ser zero."
        }
      >
        {(props) => <CampoValor {...props} valor={valor} aoMudar={setValor} />}
      </Field>
      <Button type="submit" variante="primario" carregando={salvar.isPending} className="sm:self-end">
        Salvar
      </Button>
    </form>
  );
}
