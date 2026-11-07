import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  ADMIN,
  conta,
  contaPagar,
  listagem,
  saldo,
  transacao,
  USUARIO,
} from "../../test/dados";
import { renderApp } from "../../test/render";

const vazio = {
  "GET /contaPagar": () => listagem("contaPagar", []),
  "GET /contaReceber": () => listagem("contaReceber", [], { totalPagina: 1 }),
  "GET /transacao": () => listagem("transacao", []),
};

describe("visão geral", () => {
  it("mostra saldo total, vencida e últimas transações", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-07T15:00:00.000Z"));

    renderApp({
      rota: "/",
      usuario: ADMIN,
      api: {
        ...vazio,
        "GET /contas": () =>
          listagem("contas", [conta({ id: 1, nome: "Banco" }), conta({ id: 2, nome: "Carteira" })]),
        "GET /contas/:id/saldo": ({ params }) => ({
          status: 200,
          corpo: saldo({ contaId: Number(params.id), saldoAtual: params.id === "1" ? "1000.00" : "500.00" }),
        }),
        "GET /contaPagar": ({ query }) =>
          listagem(
            "contaPagar",
            query.get("status") === "PENDENTE"
              ? [contaPagar({ descricao: "Aluguel", vencimento: "2026-11-05T00:00:00.000Z" })]
              : [],
          ),
        "GET /transacao": () =>
          listagem("transacao", [transacao({ descricao: "Venda de outubro", valor: "250.00" })]),
      },
    });

    const saldoTotal = await screen.findByRole("region", { name: "Saldo total" });
    expect(await within(saldoTotal).findByText("R$ 1.500,00")).toBeInTheDocument();

    const vencimentos = screen.getByRole("region", { name: "Próximos vencimentos" });
    expect(await within(vencimentos).findByText("Aluguel")).toBeInTheDocument();
    expect(within(vencimentos).getByText("Vencida há 2 dias")).toBeInTheDocument();

    expect(await screen.findByText("1 lançamento de entrada")).toBeInTheDocument();
    expect(screen.getByText("0 lançamentos de saída")).toBeInTheDocument();

    const ultimas = screen.getByRole("region", { name: "Últimas transações" });
    expect(await within(ultimas).findByText("Venda de outubro")).toBeInTheDocument();
    expect(document.title).toBe("Visão geral — Fluxo");
  });

  it("sem contas, ADMIN vê o convite para cadastrar", async () => {
    renderApp({
      rota: "/",
      usuario: ADMIN,
      api: { ...vazio, "GET /contas": () => listagem("contas", []) },
    });

    expect(await screen.findByText("Cadastre sua primeira conta")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /cadastrar conta/i })).toHaveAttribute("href", "/contas");
  });

  it("sem contas, USUARIO não vê o botão de cadastrar", async () => {
    renderApp({
      rota: "/",
      usuario: USUARIO,
      api: { ...vazio, "GET /contas": () => listagem("contas", []) },
    });

    expect(await screen.findByText("Cadastre sua primeira conta")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /cadastrar conta/i })).not.toBeInTheDocument();
  });
});
