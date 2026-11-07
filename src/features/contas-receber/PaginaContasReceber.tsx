import { configReceber } from "../compromissos/config";
import { PaginaCompromissos } from "../compromissos/PaginaCompromissos";

export function PaginaContasReceber() {
  return <PaginaCompromissos config={configReceber} />;
}
