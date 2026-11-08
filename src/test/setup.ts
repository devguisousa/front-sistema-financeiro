import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { conferirRotasNaoCadastradas } from "./fetch";

// jsdom não tem ResizeObserver (o Recharts usa para medir o gráfico)
class ResizeObserverFalso {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverFalso as unknown as typeof ResizeObserver;

// As telas carregam sob demanda (lazy): a primeira importação de uma tela
// pesada (o Recharts da visão geral) passa de 1s com os arquivos rodando em
// paralelo. 3s evita falha intermitente nos findBy*
configure({ asyncUtilTimeout: 3000 });

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  conferirRotasNaoCadastradas();
});
