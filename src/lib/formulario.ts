import { toast } from "sonner";
import { separarErros } from "./erros";

/** Erros de campo vão para o formulário; erro geral vira toast. */
export function tratarErroDeFormulario(
  erro: unknown,
  definirCampos: (campos: Record<string, string>) => void,
) {
  const { campos, geral } = separarErros(erro);
  definirCampos(campos);
  if (geral) toast.error(geral);
}

/** Valida um valor digitado; devolve o texto da API ou a mensagem de erro. */
export function validarValor(
  valor: string | null,
  { permitirZero = false } = {},
): { ok: true; valor: string } | { ok: false; erro: string } {
  if (valor === null) return { ok: false, erro: "Valor inválido. Use, por exemplo, 1.234,56." };
  if (!permitirZero && valor === "0.00") return { ok: false, erro: "O valor deve ser maior que zero." };
  return { ok: true, valor };
}
