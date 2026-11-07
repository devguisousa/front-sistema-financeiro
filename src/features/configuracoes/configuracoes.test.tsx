import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { Usuario } from "../../lib/tipos";
import { chamadasDe, type RotasMock } from "../../test/fetch";
import { ADMIN, listagem, USUARIO } from "../../test/dados";
import { renderApp } from "../../test/render";

const CHEFE: Usuario = { id: 3, email: "chefe@fluxo.dev", papel: "ADMIN", criadoEm: "2026-11-03T12:00:00.000Z" };

function abrir(usuario: Usuario = ADMIN, extra: RotasMock = {}) {
  return renderApp({
    rota: "/configuracoes",
    usuario,
    api: {
      "GET /usuarios": () => listagem("usuarios", [ADMIN, USUARIO, CHEFE]),
      "GET /auth/status": () => ({ status: 200, corpo: { precisaAdmin: false } }),
      ...extra,
    },
  });
}

async function trocarSenha() {
  const minhaConta = await screen.findByRole("region", { name: ADMIN.email });
  await userEvent.type(within(minhaConta).getByLabelText("Senha atual"), "antiga123");
  await userEvent.type(within(minhaConta).getByLabelText("Nova senha"), "novinha123");
  await userEvent.click(within(minhaConta).getByRole("button", { name: "Trocar senha" }));
  return minhaConta;
}

describe("configurações", () => {
  it("USUARIO não vê a seção Usuários", async () => {
    abrir(USUARIO);

    expect(await screen.findByRole("region", { name: USUARIO.email })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /usuários/i })).not.toBeInTheDocument();
  });

  it("ADMIN não vê ações na própria linha", async () => {
    abrir();

    const secao = await screen.findByRole("region", { name: /usuários/i });
    expect(await within(secao).findByRole("button", { name: `Remover ${USUARIO.email}` })).toBeInTheDocument();
    expect(within(secao).getByLabelText(`Papel de ${USUARIO.email}`)).toBeInTheDocument();
    expect(within(secao).queryByRole("button", { name: `Remover ${ADMIN.email}` })).not.toBeInTheDocument();
    expect(within(secao).queryByLabelText(`Papel de ${ADMIN.email}`)).not.toBeInTheDocument();
  });

  it("trocar senha com sucesso volta para Entrar", async () => {
    const { router } = abrir(ADMIN, { "PUT /auth/senha": () => ({ status: 204 }) });

    await trocarSenha();

    expect(await screen.findByText("Senha alterada. Entre de novo com a nova senha.")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Entrar" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/entrar");
  });

  it("senha atual errada mostra erro no campo e não desloga", async () => {
    const { fetch } = abrir(ADMIN, {
      "PUT /auth/senha": () => ({ status: 401, corpo: { erro: "SENHA ATUAL INCORRETA" } }),
    });

    const minhaConta = await trocarSenha();

    expect(await within(minhaConta).findByText("Senha atual incorreta.")).toBeInTheDocument();
    expect(within(minhaConta).getByLabelText("Senha atual")).toHaveAccessibleDescription("Senha atual incorreta.");
    expect(chamadasDe(fetch, "POST /auth/refresh")).toHaveLength(0);
    expect(screen.getByRole("button", { name: "Sair" })).toBeInTheDocument(); // continua logado
  });

  it("último admin vira mensagem amigável", async () => {
    abrir(ADMIN, {
      "PATCH /usuarios/:id/papel": () => ({
        status: 409,
        corpo: { erro: "NÃO É POSSÍVEL REMOVER O ÚLTIMO ADMIN" },
      }),
    });

    const papel = await screen.findByLabelText(`Papel de ${CHEFE.email}`);
    await userEvent.selectOptions(papel, "USUARIO");

    expect(await screen.findByText("É preciso manter pelo menos um administrador.")).toBeInTheDocument();
  });

  it("cadastra usuário com papel", async () => {
    const { fetch } = abrir(ADMIN, {
      "POST /auth/registrar": () => ({ status: 201, corpo: USUARIO }),
    });

    const secao = await screen.findByRole("region", { name: /usuários/i });
    await userEvent.type(within(secao).getByLabelText("E-mail"), "novo@fluxo.dev");
    await userEvent.type(within(secao).getByLabelText("Senha provisória"), "provisoria1");
    await userEvent.selectOptions(within(secao).getByLabelText("Papel"), "ADMIN");
    await userEvent.click(within(secao).getByRole("button", { name: "Cadastrar" }));

    expect(await screen.findByText("Usuário cadastrado")).toBeInTheDocument();
    const [, init] = chamadasDe(fetch, "POST /auth/registrar")[0]!;
    expect(JSON.parse(String(init?.body))).toEqual({
      email: "novo@fluxo.dev",
      senha: "provisoria1",
      papel: "ADMIN",
    });
  });

  it("sair de todos pede confirmação e volta para Entrar", async () => {
    const { router, fetch } = abrir(ADMIN, { "POST /auth/sair-de-todos": () => ({ status: 204 }) });

    await userEvent.click(await screen.findByRole("button", { name: "Sair de todos" }));
    const dialogo = await screen.findByRole("alertdialog");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Sair de todos os dispositivos" }));

    expect(await screen.findByRole("heading", { name: "Entrar" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/entrar");
    expect(chamadasDe(fetch, "POST /auth/sair-de-todos")).toHaveLength(1);
  });
});
