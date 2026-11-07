import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { rotas } from "../App";
import { Provedores } from "../Provedores";
import { definirSessao, limparSessao } from "../lib/api";
import { criarQueryClient } from "../lib/queryClient";
import type { Usuario } from "../lib/tipos";
import { mockFetch, type RotasMock } from "./fetch";

type OpcoesRender = {
  rota: string;
  /** Usuário logado (null = sem sessão). */
  usuario?: Usuario | null;
  /** Respostas da API para este teste. */
  api?: RotasMock;
};

/** Renderiza o app inteiro numa rota, com API falsa e cache novo. */
export function renderApp({ rota, usuario = null, api = {} }: OpcoesRender) {
  const fetch = mockFetch({
    ...(usuario ? { "GET /auth/me": () => ({ status: 200, corpo: usuario }) } : {}),
    ...api,
  });

  if (usuario) definirSessao({ accessToken: "A-teste", refreshToken: "R-teste" });
  else limparSessao();

  const queryClient = criarQueryClient({ retry: false });
  const router = createMemoryRouter(rotas, { initialEntries: [rota] });

  const resultado = render(
    <Provedores queryClient={queryClient}>
      <RouterProvider router={router} />
    </Provedores>,
  );

  return { ...resultado, fetch, router, queryClient };
}
