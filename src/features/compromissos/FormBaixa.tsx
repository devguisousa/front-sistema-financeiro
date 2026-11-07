import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button, CampoValor, Field, PreviaSaldo, Select } from "../../components/ui";
import { centavosParaCampo, formatarBRL, lerValorDigitado, paraCentavos } from "../../lib/dinheiro";
import { tratarErroDeFormulario, validarValor } from "../../lib/formulario";
import { ehDoSistema, useCategoriasTodas } from "../categorias/useCategorias";
import { useContasTodas, useSaldos } from "../contas/useContas";
import type { Compromisso, ConfigCompromisso } from "./config";
import { restante } from "./restante";
import { useRegistrarBaixa } from "./useCompromissos";

type Props = { config: ConfigCompromisso; item: Compromisso; aoSalvar(): void };

export function FormBaixa({ config, item, aoSalvar }: Props) {
  const falta = restante(item);
  const [valor, setValor] = useState(centavosParaCampo(falta));
  const [contaId, setContaId] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [campos, setCampos] = useState<Record<string, string>>({});

  const contas = useContasTodas();
  const saldos = useSaldos(contas.data);
  const categorias = useCategoriasTodas(config.tipoCategoria);
  const registrar = useRegistrarBaixa(config);

  const lido = lerValorDigitado(valor);
  const passou = lido !== null && paraCentavos(lido) > falta;
  const saldo = contaId ? saldos.data?.[Number(contaId)] : undefined;
  const sinal = config.tipoCategoria === "DESPESA" ? -1 : 1;

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const erros: Record<string, string> = {};
    const checado = validarValor(lido);
    if (!checado.ok) erros.valor = checado.erro;
    else if (passou) erros.valor = `O valor passa do que falta (${formatarBRL(falta)}).`;
    if (!contaId) erros.contaId = "Escolha a conta.";
    if (!categoriaId) erros.categoriaId = "Escolha a categoria.";
    setCampos(erros);
    if (Object.keys(erros).length || !checado.ok) return;

    try {
      await registrar.mutateAsync({
        id: item.id,
        corpo: { contaId: Number(contaId), categoriaId: Number(categoriaId), valor: checado.valor },
      });
      toast.success(config.textos.baixaFeita);
      aoSalvar();
    } catch (erro) {
      tratarErroDeFormulario(erro, setCampos);
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-2.5">
        <Field rotulo="Valor" erro={campos.valor}>
          {(props) => <CampoValor {...props} valor={valor} aoMudar={setValor} />}
        </Field>
        <button
          type="button"
          onClick={() => setValor(centavosParaCampo(falta))}
          className="inline-flex h-7 cursor-pointer items-center self-start rounded-full border border-verde/30 bg-verde/10 px-3 font-mono text-[11px] text-verde transition-colors hover:bg-verde/20"
        >
          Quitar {formatarBRL(falta)}
        </button>
      </div>

      <div className="flex flex-col gap-2.5">
        <Field rotulo={config.textos.contaDaBaixa} erro={campos.contaId}>
          {(props) => (
            <Select {...props} value={contaId} onChange={(e) => setContaId(e.target.value)}>
              <option value="">Escolha a conta</option>
              {(contas.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </Select>
          )}
        </Field>
        {saldo && lido && lido !== "0.00" && (
          <PreviaSaldo
            atual={paraCentavos(saldo.saldoAtual)}
            depois={paraCentavos(saldo.saldoAtual) + sinal * paraCentavos(lido)}
          />
        )}
      </div>

      <Field rotulo={config.textos.categoriaDaBaixa} erro={campos.categoriaId}>
        {(props) => (
          <Select {...props} value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
            <option value="">Escolha a categoria</option>
            {(categorias.data ?? [])
              .filter((c) => c.tipo === config.tipoCategoria && !ehDoSistema(c))
              .map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Button type="submit" variante="primario" carregando={registrar.isPending} className="sm:self-end">
        {config.textos.baixa}
      </Button>
    </form>
  );
}
