import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button, CampoValor, Field, Input } from "../../components/ui";
import { centavosParaCampo, lerValorDigitado, paraCentavos } from "../../lib/dinheiro";
import { tratarErroDeFormulario, validarValor } from "../../lib/formulario";
import type { Compromisso, ConfigCompromisso } from "./config";
import { useSalvarCompromisso } from "./useCompromissos";

type Props = { config: ConfigCompromisso; item?: Compromisso | undefined; aoSalvar(): void };

export function FormCompromisso({ config, item, aoSalvar }: Props) {
  const [descricao, setDescricao] = useState(item?.descricao ?? "");
  const [valor, setValor] = useState(item ? centavosParaCampo(paraCentavos(item.valorTotal)) : "");
  // Vencimento é meia-noite UTC: o dia é o pedaço "AAAA-MM-DD" do ISO
  const [vencimento, setVencimento] = useState(item?.vencimento.slice(0, 10) ?? "");
  const [campos, setCampos] = useState<Record<string, string>>({});
  const salvar = useSalvarCompromisso(config);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const erros: Record<string, string> = {};
    if (!descricao.trim()) erros.descricao = "Informe a descrição.";
    const checado = validarValor(lerValorDigitado(valor));
    if (!checado.ok) erros.valorTotal = checado.erro;
    if (!vencimento) erros.vencimento = "Informe o vencimento.";
    setCampos(erros);
    if (Object.keys(erros).length || !checado.ok) return;

    try {
      await salvar.mutateAsync({
        id: item?.id,
        corpo: { descricao: descricao.trim(), valorTotal: checado.valor, vencimento },
      });
      toast.success(config.textos.salvo);
      aoSalvar();
    } catch (erro) {
      tratarErroDeFormulario(erro, setCampos);
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
      <Field rotulo="Descrição" erro={campos.descricao}>
        {(props) => (
          <Input
            {...props}
            maxLength={config.maxDescricao}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        )}
      </Field>
      <Field
        rotulo="Valor total"
        erro={campos.valorTotal}
        dica={item ? `Não pode ficar abaixo do que já foi ${config.textos.quitado.toLowerCase()}.` : undefined}
      >
        {(props) => <CampoValor {...props} valor={valor} aoMudar={setValor} />}
      </Field>
      <Field rotulo="Vencimento" erro={campos.vencimento}>
        {(props) => (
          <Input
            {...props}
            type="date"
            value={vencimento}
            onChange={(e) => setVencimento(e.target.value)}
            className="font-mono [color-scheme:dark]"
          />
        )}
      </Field>
      <Button type="submit" variante="primario" carregando={salvar.isPending} className="sm:self-end">
        Salvar
      </Button>
    </form>
  );
}
