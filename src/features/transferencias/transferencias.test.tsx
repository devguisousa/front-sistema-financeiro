import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { Usuario } from "../../lib/tipos";
import type { RotasMock } from "../../test/fetch";
import { ADMIN, conta, listagem, saldo, transferencia, USUARIO } from "../../test/dados";
import { renderApp } from "../../test/render";

function abrir(usuario: Usuario = ADMIN, extra: RotasMock = {}) {
  return renderApp({
    rota: "/transferencias",
    usuario,
    api: {
      "GET /contas": () =>
        listagem("contas", [
          conta({ id: 1, nome: "Banco" }),
          conta({ id: 2, nome: "Carteira" }),
          conta({ id: 3, nome: "Reserva" }),
        ]),
      "GET /contas/:id/saldo": ({ params }) => ({
        status: 200,
        corpo: saldo({ contaId: Number(params.id), saldoAtual: "50.00" }),
      }),
      "GET /transferencias": () =>
        listagem("transferencias", [transferencia({ descricao: "Reserva mensal" })]),
      ...extra,
    },
  });
}

describe("transferências", () => {
  it("não oferece a origem como destino", async () => {
    abrir();
    const form = await screen.findByRole("complementary", { name: "Mover dinheiro" });

    await within(form).findAllByRole("option", { name: "Banco" });
    await userEvent.selectOptions(within(form).getByLabelText("De"), "Banco");

    const destinos = within(within(form).getByLabelText("Para"))
      .getAllByRole("option")
      .map((o) => o.textContent);
    expect(destinos).toEqual(["Escolha a conta", "Carteira", "Reserva"]);
  });

  it("mostra origem e destino pelo nome no histórico", async () => {
    abrir();

    const historico = await screen.findByRole("region", { name: "Histórico" });
    expect(await within(historico).findByText("Reserva mensal")).toBeInTheDocument();
    expect(await within(historico).findByText("Banco → Carteira")).toBeInTheDocument();
  });

  it("SALDO INSUFICIENTE vira mensagem amigável", async () => {
    abrir(USUARIO, {
      "POST /transferencias": () => ({ status: 409, corpo: { erro: "SALDO INSUFICIENTE" } }),
    });
    const form = await screen.findByRole("complementary", { name: "Mover dinheiro" });

    await within(form).findAllByRole("option", { name: "Banco" });
    await userEvent.selectOptions(within(form).getByLabelText("De"), "Banco");
    await userEvent.selectOptions(within(form).getByLabelText("Para"), "Carteira");
    await userEvent.type(within(form).getByLabelText("Valor"), "40");
    await userEvent.click(within(form).getByRole("button", { name: /transferir/i }));

    expect(await screen.findByText("Saldo insuficiente nesta conta.")).toBeInTheDocument();
  });

  it("USUARIO não vê Estornar; ADMIN vê", async () => {
    const { unmount } = abrir(USUARIO);
    expect(await screen.findByText("Reserva mensal")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /estornar/i })).not.toBeInTheDocument();
    unmount();

    abrir(ADMIN);
    expect(await screen.findByRole("button", { name: /estornar reserva mensal/i })).toBeInTheDocument();
  });
});
