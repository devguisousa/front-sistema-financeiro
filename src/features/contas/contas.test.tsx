import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { Usuario } from "../../lib/tipos";
import { chamadasDe, type RotasMock } from "../../test/fetch";
import { ADMIN, conta, listagem, saldo, USUARIO } from "../../test/dados";
import { renderApp } from "../../test/render";

function abrir(usuario: Usuario = ADMIN, extra: RotasMock = {}) {
  return renderApp({
    rota: "/contas",
    usuario,
    api: {
      "GET /contas": () =>
        listagem("contas", [conta({ id: 1, nome: "Banco" }), conta({ id: 2, nome: "Carteira" })]),
      "GET /contas/:id/saldo": ({ params }) => ({
        status: 200,
        corpo: saldo({ contaId: Number(params.id), saldoAtual: params.id === "1" ? "0.10" : "0.20" }),
      }),
      ...extra,
    },
  });
}

describe("contas", () => {
  it("consolidado soma sem erro de arredondamento", async () => {
    abrir();

    const consolidado = await screen.findByRole("region", { name: "Saldo consolidado" });
    expect(await within(consolidado).findByText("R$ 0,30")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Banco" })).toBeInTheDocument();
  });

  it("USUARIO não vê Nova conta nem Editar", async () => {
    abrir(USUARIO);

    expect(await screen.findByRole("region", { name: "Banco" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /nova conta/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^editar/i })).not.toBeInTheDocument();
  });

  it("saldo inicial 0 é aceito", async () => {
    const { fetch } = abrir(ADMIN, { "POST /contas": () => ({ status: 201, corpo: conta() }) });

    await userEvent.click(await screen.findByRole("button", { name: "Nova conta" }));
    const dialogo = await screen.findByRole("dialog", { name: "Nova conta" });
    await userEvent.type(within(dialogo).getByLabelText("Nome"), "Caixa");
    await userEvent.type(within(dialogo).getByLabelText("Saldo inicial"), "0");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("Conta salva")).toBeInTheDocument();
    const [, init] = chamadasDe(fetch, "POST /contas")[0]!;
    expect(JSON.parse(String(init?.body))).toEqual({ nome: "Caixa", saldoInicial: "0.00" });
  });

  it("conta com movimentações não apaga e explica", async () => {
    abrir(ADMIN, {
      "DELETE /contas/:id": () => ({ status: 409, corpo: { erro: "CONTA POSSUI MOVIMENTAÇÕES" } }),
    });

    await userEvent.click(await screen.findByRole("button", { name: "Excluir Banco" }));
    const dialogo = await screen.findByRole("alertdialog");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Excluir" }));

    expect(
      await screen.findByText("Esta conta tem movimentações e não pode ser apagada."),
    ).toBeInTheDocument();
  });

  it("sem contas, ADMIN vê Cadastrar primeira conta", async () => {
    abrir(ADMIN, { "GET /contas": () => listagem("contas", []) });

    expect(await screen.findByRole("button", { name: "Cadastrar primeira conta" })).toBeInTheDocument();
  });
});
