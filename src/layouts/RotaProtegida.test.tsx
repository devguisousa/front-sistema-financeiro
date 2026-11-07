import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ADMIN, apiVazia } from "../test/dados";
import { renderApp } from "../test/render";

describe("rotas protegidas", () => {
  it("sem sessão, abrir uma tela leva para /entrar", async () => {
    const { router } = renderApp({
      rota: "/transacoes",
      api: { "GET /auth/status": () => ({ status: 200, corpo: { precisaAdmin: false } }) },
    });

    expect(await screen.findByRole("heading", { name: /entrar/i })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/entrar");
  });

  it("com sessão, mostra o layout com o item ativo", async () => {
    renderApp({ rota: "/transacoes", usuario: ADMIN, api: apiVazia });

    const link = await screen.findByRole("link", { name: "Transações" });
    expect(link).toHaveAttribute("aria-current", "page");
    expect(screen.getByText(ADMIN.email)).toBeInTheDocument();
    expect(document.title).toBe("Transações — Fluxo");
  });

  it("rota desconhecida mostra página não encontrada", async () => {
    renderApp({ rota: "/nao-existe", usuario: ADMIN });

    expect(await screen.findByRole("heading", { name: /página não encontrada/i })).toBeInTheDocument();
  });
});
