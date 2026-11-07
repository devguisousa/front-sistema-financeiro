import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import {
  Button,
  CampoValor,
  Field,
  Input,
  PreviaSaldo,
  Segmentado,
  Select,
} from "../../components/ui";
import { dataParaApi, diaLocalDe, hojeLocal } from "../../lib/datas";
import { centavosParaCampo, lerValorDigitado, paraCentavos } from "../../lib/dinheiro";
import { tratarErroDeFormulario, validarValor } from "../../lib/formulario";
import type { TipoTransacao, Transacao } from "../../lib/tipos";
import { useCategoriasTodas } from "../categorias/useCategorias";
import { useContasTodas, useSaldos } from "../contas/useContas";
import { type CorpoTransacao, useSalvarTransacao } from "./useTransacoes";

type FormTransacaoProps = {
  /** Com transação: modo edição (PUT). Sem: lançamento novo. */
  transacao?: Transacao;
  aoSalvar?(): void;
};

const TIPOS = [
  { valor: "RECEITA" as const, rotulo: "Receita", ponto: "verde" as const },
  { valor: "DESPESA" as const, rotulo: "Despesa", ponto: "coral" as const },
];

export function FormTransacao({ transacao, aoSalvar }: FormTransacaoProps) {
  const editando = transacao !== undefined;
  const [tipo, setTipo] = useState<TipoTransacao>(transacao?.tipo ?? "RECEITA");
  const [descricao, setDescricao] = useState(transacao?.descricao ?? "");
  const [valor, setValor] = useState(
    transacao ? centavosParaCampo(paraCentavos(transacao.valor)) : "",
  );
  const [contaId, setContaId] = useState(transacao ? String(transacao.contaId) : "");
  const [categoriaId, setCategoriaId] = useState(transacao ? String(transacao.categoriaId) : "");
  const [dia, setDia] = useState(transacao ? diaLocalDe(transacao.data) : hojeLocal());
  const [campos, setCampos] = useState<Record<string, string>>({});

  const contas = useContasTodas();
  const saldos = useSaldos(contas.data);
  const categorias = useCategoriasTodas();
  const doTipo = (categorias.data ?? []).filter((c) => c.tipo === tipo);
  const salvar = useSalvarTransacao();

  const lido = lerValorDigitado(valor);
  const saldoDaConta = contaId ? saldos.data?.[Number(contaId)] : undefined;
  const previa =
    !editando && saldoDaConta && lido && lido !== "0.00"
      ? {
          atual: paraCentavos(saldoDaConta.saldoAtual),
          depois:
            paraCentavos(saldoDaConta.saldoAtual) +
            (tipo === "RECEITA" ? 1 : -1) * paraCentavos(lido),
        }
      : null;

  function trocarTipo(novo: TipoTransacao) {
    setTipo(novo);
    setCategoriaId(""); // categoria precisa combinar com o tipo
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const erros: Record<string, string> = {};
    if (!descricao.trim()) erros.descricao = "Informe a descrição.";
    const checado = validarValor(lido);
    if (!checado.ok) erros.valor = checado.erro;
    if (!contaId) erros.contaId = "Escolha a conta.";
    if (!categoriaId) erros.categoriaId = "Escolha a categoria.";
    setCampos(erros);
    if (Object.keys(erros).length || !checado.ok) return;

    const corpo: CorpoTransacao = {
      descricao: descricao.trim(),
      valor: checado.valor,
      tipo,
      contaId: Number(contaId),
      categoriaId: Number(categoriaId),
    };
    // Em branco: a API usa o momento atual (ou mantém a data na edição)
    const mudouDia = !editando || dia !== diaLocalDe(transacao.data);
    if (dia && mudouDia) corpo.data = dataParaApi(dia);

    try {
      await salvar.mutateAsync({ id: transacao?.id, corpo });
      toast.success("Lançamento salvo");
      if (!editando) {
        setDescricao("");
        setValor("");
        setDia(hojeLocal());
      }
      aoSalvar?.();
    } catch (erro) {
      tratarErroDeFormulario(erro, setCampos);
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
      <Segmentado
        rotulo="Tipo do lançamento"
        opcoes={TIPOS}
        valor={tipo}
        aoMudar={trocarTipo}
        className="grid grid-cols-2"
      />

      <Field rotulo="Descrição" erro={campos.descricao}>
        {(props) => (
          <Input
            {...props}
            maxLength={200}
            placeholder="Ex.: Venda balcão"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
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

      <div className="flex flex-col gap-2.5">
        <Field rotulo="Conta" erro={campos.contaId}>
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
        {previa && <PreviaSaldo atual={previa.atual} depois={previa.depois} />}
      </div>

      <Field
        rotulo="Categoria"
        erro={campos.categoriaId}
        dica={`Só aparecem categorias do tipo ${tipo === "RECEITA" ? "receita" : "despesa"}.`}
      >
        {(props) => (
          <Select {...props} value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
            <option value="">Escolha a categoria</option>
            {doTipo.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field rotulo="Data" erro={campos.data} dica="Em branco, vale o momento do lançamento.">
        {(props) => (
          <Input
            {...props}
            type="date"
            max={hojeLocal()}
            value={dia}
            onChange={(e) => setDia(e.target.value)}
            className="font-mono [color-scheme:dark]"
          />
        )}
      </Field>

      <Button type="submit" variante="primario" carregando={salvar.isPending} className="min-h-12 w-full">
        {editando ? "Salvar alterações" : `Lançar ${tipo === "RECEITA" ? "receita" : "despesa"}`}
      </Button>
    </form>
  );
}
