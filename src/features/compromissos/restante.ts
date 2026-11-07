import { paraCentavos } from "../../lib/dinheiro";
import type { Compromisso } from "./config";

/** Quanto falta pagar/receber, em centavos. */
export function restante(c: Compromisso): number {
  return paraCentavos(c.valorTotal) - paraCentavos(c.valorQuitado);
}
