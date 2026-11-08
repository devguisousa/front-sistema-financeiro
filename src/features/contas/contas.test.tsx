import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { Usuario } from "../../lib/tipos";
import { chamadasDe, type RotasMock } from "../../test/fetch";
import { ADMIN, conta, listagem, saldo } from "../../test/dados";
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

  it("editar mostra o saldo atual e manda saldoAtual só quando muda", async () => {
    const { fetch } = abrir(ADMIN, { "PUT /contas/:id": () => ({ status: 200, corpo: conta() }) });

    await userEvent.click(await screen.findByRole("button", { name: "Editar Banco" }));
    let dialogo = await screen.findByRole("dialog", { name: "Editar conta" });
    const campo = within(dialogo).getByLabelText("Saldo atual");
    expect(campo).toHaveValue("0,10");

    // Sem mexer no saldo: só o nome vai
    await userEvent.click(within(dialogo).getByRole("button", { name: "Salvar" }));
    // O toast "Conta salva" de outro teste pode seguir na tela: espera o diálogo fechar
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    let [, init] = chamadasDe(fetch, "PUT /contas/1")[0]!;
    expect(JSON.parse(String(init?.body))).toEqual({ nome: "Banco" });

    // Saldo novo: vai como saldoAtual
    await userEvent.click(screen.getByRole("button", { name: "Editar Banco" }));
    dialogo = await screen.findByRole("dialog", { name: "Editar conta" });
    await userEvent.clear(within(dialogo).getByLabelText("Saldo atual"));
    await userEvent.type(within(dialogo).getByLabelText("Saldo atual"), "1.500,00");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    [, init] = chamadasDe(fetch, "PUT /contas/1")[1]!;
    expect(JSON.parse(String(init?.body))).toEqual({ nome: "Banco", saldoAtual: "1500.00" });
  });

  it("saldo definido pela pessoa aparece no card no lugar do saldo inicial", async () => {
    abrir(ADMIN, {
      "GET /contas/:id/saldo": ({ params }) => ({
        status: 200,
        corpo: saldo({
          contaId: Number(params.id),
          saldoInicial: "1000.00",
          totalDespesas: "300.00",
          saldoAtual: "700.00",
          saldoDefinidoEm: "2026-11-08T15:00:00.000Z",
        }),
      }),
    });

    const cartao = await screen.findByRole("region", { name: "Banco" });
    expect(await within(cartao).findByText("Saldo definido em 08/11/2026")).toBeInTheDocument();
    expect(within(cartao).getByText("− Despesas depois")).toBeInTheDocument();
    expect(within(cartao).queryByText("Saldo inicial")).not.toBeInTheDocument();
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
