import { useEffect } from "react";

/** Título da aba: "Transações — Fluxo". */
export function useTitulo(tela: string) {
  useEffect(() => {
    document.title = `${tela} — Fluxo`;
  }, [tela]);
}
