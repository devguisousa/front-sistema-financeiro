import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { chamadasDe } from "../../test/fetch";
import { ADMIN, apiVazia, painelVazio } from "../../test/dados";
import { renderApp } from "../../test/render";

const comAdmin = { "GET /auth/status": () => ({ status: 200, corpo: { precisaAdmin: false } }) };
const semAdmin = { "GET /auth/status": () => ({ status: 200, corpo: { precisaAdmin: true } }) };

async function preencherPrimeiroAdmin(senha: string, confirmar: string) {
  await userEvent.type(await screen.findByLabelText("E-mail"), "dono@fluxo.dev");
  await userEvent.type(screen.getByLabelText("Senha"), senha);
  await userEvent.type(screen.getByLabelText("Confirmar senha"), confirmar);
  await userEvent.click(screen.getByRole("button", { name: /criar administrador/i }));
}

describe("tela de entrar", () => {
  it("sem admin no banco, mostra Criar conta de administrador", async () => {
    renderApp({ rota: "/entrar", api: semAdmin });

    expect(
      await screen.findByRole("heading", { name: "Criar conta de administrador" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^entrar/i })).not.toBeInTheDocument();
  });

  it("com admin, mostra só o login", async () => {
    renderApp({ rota: "/entrar", api: comAdmin });

    expect(await screen.findByRole("button", { name: /^entrar/i })).toBeInTheDocument();
    expect(screen.queryByText(/criar conta de administrador/i)).not.toBeInTheDocument();
    expect(document.title).toBe("Entrar — Fluxo");
  });

  it("login com senha errada mostra o erro no formulário", async () => {
    renderApp({
      rota: "/entrar",
      api: {
        ...comAdmin,
        "POST /auth/login": () => ({ status: 401, corpo: { erro: "USUÁRIO OU SENHA INCORRETOS" } }),
      },
    });

    await userEvent.type(await screen.findByLabelText("E-mail"), "ana@fluxo.dev");
    await userEvent.type(screen.getByLabelText("Senha"), "errada123");
    await userEvent.click(screen.getByRole("button", { name: /^entrar/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("E-mail ou senha incorretos.");
  });

  it("login certo volta para a tela pedida", async () => {
    const { router } = renderApp({
      rota: "/contas",
      api: {
        ...comAdmin,
        "POST /auth/login": () => ({ status: 200, corpo: { accessToken: "A1", refreshToken: "R1" } }),
        "GET /auth/me": () => ({ status: 200, corpo: ADMIN }),
        ...apiVazia,
      },
    });

    await userEvent.type(await screen.findByLabelText("E-mail"), ADMIN.email);
    await userEvent.type(screen.getByLabelText("Senha"), "segredo123");
    await userEvent.click(screen.getByRole("button", { name: /^entrar/i }));

    expect(await screen.findByRole("heading", { name: "Contas" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/contas");
  });

  it("erro de campo da API aparece embaixo do campo", async () => {
    renderApp({
      rota: "/entrar",
      api: {
        ...semAdmin,
        "POST /auth/primeiro-admin": () => ({
          status: 400,
          corpo: {
            erro: "DADOS INVÁLIDOS",
            detalhes: [{ path: ["email"], message: "E-mail inválido" }],
          },
        }),
      },
    });

    await preencherPrimeiroAdmin("segredo123", "segredo123");

    expect(await screen.findByLabelText("E-mail")).toHaveAccessibleDescription("E-mail inválido");
  });

  it("senhas diferentes não enviam o pedido", async () => {
    const { fetch } = renderApp({ rota: "/entrar", api: semAdmin });

    await preencherPrimeiroAdmin("segredo123", "segredo124");

    expect(await screen.findByText("As senhas não conferem.")).toBeInTheDocument();
    expect(chamadasDe(fetch, "POST /auth/primeiro-admin")).toHaveLength(0);
  });

  it("senha curta não envia o pedido", async () => {
    const { fetch } = renderApp({ rota: "/entrar", api: semAdmin });

    await preencherPrimeiroAdmin("curta", "curta");

    expect(
      await screen.findByText("A senha precisa ter pelo menos 8 caracteres."),
    ).toBeInTheDocument();
    expect(chamadasDe(fetch, "POST /auth/primeiro-admin")).toHaveLength(0);
  });

  it("primeiro admin criado entra direto", async () => {
    const { router } = renderApp({
      rota: "/entrar",
      api: {
        ...semAdmin,
        "POST /auth/primeiro-admin": () => ({
          status: 201,
          corpo: { accessToken: "A1", refreshToken: "R1" },
        }),
        "GET /auth/me": () => ({ status: 200, corpo: ADMIN }),
        ...painelVazio,
      },
    });

    await preencherPrimeiroAdmin("segredo123", "segredo123");

    expect(await screen.findByText("01 — Visão geral")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
  });

  it("logado, /entrar leva para a visão geral", async () => {
    const { router } = renderApp({
      rota: "/entrar",
      usuario: ADMIN,
      api: { ...comAdmin, ...painelVazio },
    });

    expect(await screen.findByText("01 — Visão geral")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
  });

  it("sem conexão mostra aviso e botão para tentar de novo", async () => {
    renderApp({
      rota: "/entrar",
      api: {
        "GET /auth/status": () => {
          throw new TypeError("Failed to fetch");
        },
      },
    });

    expect(await screen.findByText("Sem conexão com o servidor.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tentar de novo/i })).toBeInTheDocument();
  });
});
