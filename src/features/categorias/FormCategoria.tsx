import { Plus } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button, Field, Input, Segmentado } from "../../components/ui";
import { tratarErroDeFormulario } from "../../lib/formulario";
import type { Categoria, TipoTransacao } from "../../lib/tipos";
import { useSalvarCategoria } from "./useCategorias";

type Props = { categoria?: Categoria | undefined; aoSalvar?(): void };

export function FormCategoria({ categoria, aoSalvar }: Props) {
  const [nome, setNome] = useState(categoria?.nome ?? "");
  const [tipo, setTipo] = useState<TipoTransacao>(categoria?.tipo ?? "RECEITA");
  const [campos, setCampos] = useState<Record<string, string>>({});
  const salvar = useSalvarCategoria();

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (!nome.trim()) {
      setCampos({ nome: "Informe o nome." });
      return;
    }
    setCampos({});

    try {
      await salvar.mutateAsync({ id: categoria?.id, corpo: { nome: nome.trim(), tipo } });
      toast.success("Categoria salva");
      if (!categoria) setNome("");
      aoSalvar?.();
    } catch (erro) {
      tratarErroDeFormulario(erro, setCampos);
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
      <Field rotulo="Nome da categoria" erro={campos.nome}>
        {(props) => (
          <Input
            {...props}
            maxLength={100}
            placeholder="Ex.: Mercado"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        )}
      </Field>
      <Segmentado<TipoTransacao>
        rotulo="Tipo da categoria"
        valor={tipo}
        aoMudar={setTipo}
        className="grid grid-cols-2"
        opcoes={[
          { valor: "RECEITA", rotulo: "Receita", ponto: "verde" },
          { valor: "DESPESA", rotulo: "Despesa", ponto: "coral" },
        ]}
      />
      {campos.tipo && (
        <p role="alert" className="-mt-3 text-[12px] text-coral">
          {campos.tipo}
        </p>
      )}
      <Button type="submit" variante="primario" carregando={salvar.isPending}>
        {categoria ? (
          "Salvar"
        ) : (
          <>
            <Plus size={16} aria-hidden="true" />
            Criar categoria
          </>
        )}
      </Button>
    </form>
  );
}
