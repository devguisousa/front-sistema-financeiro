import { configPagar } from "../compromissos/config";
import { PaginaCompromissos } from "../compromissos/PaginaCompromissos";

export function PaginaContasPagar() {
  return <PaginaCompromissos config={configPagar} />;
}
