import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button, CampoValor, Field, Input } from "../../components/ui";
import { centavosParaCampo, lerValorDigitado, paraCentavos } from "../../lib/dinheiro";
import { tratarErroDeFormulario, validarValor } from "../../lib/formulario";
import type { Conta } from "../../lib/tipos";
import { useSalvarConta } from "./useContas";

export function FormConta({ conta, aoSalvar }: { conta?: Conta | undefined; aoSalvar(): void }) {
  const [nome, setNome] = useState(conta?.nome ?? "");
  const [saldoInicial, setSaldoInicial] = useState(
    conta ? centavosParaCampo(paraCentavos(conta.saldoInicial)) : "",
  );
  const [campos, setCampos] = useState<Record<string, string>>({});
  const salvar = useSalvarConta();

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const erros: Record<string, string> = {};
    if (!nome.trim()) erros.nome = "Informe o nome.";
    // Em branco = começa do zero
    const checado = validarValor(saldoInicial.trim() ? lerValorDigitado(saldoInicial) : "0.00", {
      permitirZero: true,
    });
    if (!checado.ok) erros.saldoInicial = checado.erro;
    setCampos(erros);
    if (Object.keys(erros).length || !checado.ok) return;

    try {
      await salvar.mutateAsync({ id: conta?.id, corpo: { nome: nome.trim(), saldoInicial: checado.valor } });
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
        rotulo="Saldo inicial"
        erro={campos.saldoInicial}
        dica={conta ? "Baixar o saldo inicial não pode deixar a conta negativa." : "Pode ser zero."}
      >
        {(props) => <CampoValor {...props} valor={saldoInicial} aoMudar={setSaldoInicial} />}
      </Field>
      <Button type="submit" variante="primario" carregando={salvar.isPending} className="sm:self-end">
        Salvar
      </Button>
    </form>
  );
}
