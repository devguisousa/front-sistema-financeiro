import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Usuario } from "../../lib/tipos";
import { chamadasDe, type RotasMock } from "../../test/fetch";
import {
  ADMIN,
  categoria,
  conta,
  contaPagar,
  contaReceber,
  listagem,
  saldo,
} from "../../test/dados";
import { renderApp } from "../../test/render";

const comum: RotasMock = {
  "GET /contas": () => listagem("contas", [conta({ id: 1, nome: "Banco" })]),
  "GET /contas/:id/saldo": () => ({ status: 200, corpo: saldo({ saldoAtual: "1000.00" }) }),
  "GET /categoria": () =>
    listagem("categoria", [
      categoria({ id: 1, nome: "Vendas", tipo: "RECEITA" }),
      categoria({ id: 2, nome: "Aluguel", tipo: "DESPESA" }),
    ]),
};

function abrirPagar(usuario: Usuario, itens = [contaPagar()], extra: RotasMock = {}) {
  return renderApp({
    rota: "/contas-a-pagar",
    usuario,
    api: { ...comum, "GET /contaPagar": () => listagem("contaPagar", itens), ...extra },
  });
}

describe("contas a pagar e a receber", () => {
  it("contas a receber lê totalPagina e usa pagina/limite", async () => {
    const { fetch } = renderApp({
      rota: "/contas-a-receber",
      usuario: ADMIN,
      api: {
        ...comum,
        "GET /contaReceber": () =>
          listagem("contaReceber", [contaReceber()], { totalPaginas: undefined, totalPagina: 3 }),
      },
    });

    expect(await screen.findByText("Página 1 de 3")).toBeInTheDocument();
    const urls = chamadasDe(fetch, "GET /contaReceber").map(([url]) => String(url));
    expect(urls).toContain("/api/contaReceber?pagina=1&limite=20");
    expect(document.title).toBe("Contas a receber — Fluxo");
  });

  it("valor da baixa começa com o que falta e envia normalizado", async () => {
    const { fetch } = abrirPagar(ADMIN, [contaPagar({ id: 7, valorTotal: "300.00", valorPago: "100.50", status: "PARCIALMENTE_PAGA" })], {
      "POST /pagamentoPagar/contaPagar/:id": () => ({ status: 201, corpo: {} }),
    });

    await userEvent.click(await screen.findByRole("button", { name: /registrar pagamento/i }));
    const dialogo = await screen.findByRole("dialog", { name: /registrar pagamento/i });
    expect(within(dialogo).getByLabelText("Valor")).toHaveValue("199,50");

    await within(dialogo).findByRole("option", { name: "Banco" });
    await userEvent.selectOptions(within(dialogo).getByLabelText("Sai da conta"), "Banco");
    await userEvent.selectOptions(within(dialogo).getByLabelText("Categoria (despesa)"), "Aluguel");
    await userEvent.click(within(dialogo).getByRole("button", { name: /^registrar pagamento/i }));

    expect(await screen.findByText("Pagamento registrado")).toBeInTheDocument();
    const [, init] = chamadasDe(fetch, "POST /pagamentoPagar/contaPagar/7")[0]!;
    expect(JSON.parse(String(init?.body))).toEqual({ contaId: 1, categoriaId: 2, valor: "199.50" });
  });

  it("vencimento aparece no dia certo e com badge", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-07T15:00:00.000Z"));

    abrirPagar(ADMIN, [contaPagar({ descricao: "Luz", vencimento: "2026-11-05T00:00:00.000Z" })]);

    const lista = await screen.findByRole("region", { name: "Lista de contas a pagar" });
    expect(await within(lista).findByText("05/11/2026")).toBeInTheDocument();
    expect(within(lista).getByText("Vencida há 2 dias")).toBeInTheDocument();
  });

  it("quitada não oferece baixa", async () => {
    abrirPagar(ADMIN, [contaPagar({ valorPago: "300.00", status: "PAGA" })]);

    expect(await screen.findByText("Paga")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /registrar pagamento/i })).not.toBeInTheDocument();
  });

  it("nova conta a pagar envia vencimento AAAA-MM-DD", async () => {
    const { fetch } = abrirPagar(ADMIN, [], {
      "POST /contaPagar": () => ({ status: 201, corpo: contaPagar() }),
    });

    await userEvent.click(await screen.findByRole("button", { name: "Nova conta a pagar" }));
    const dialogo = await screen.findByRole("dialog", { name: "Nova conta a pagar" });
    await userEvent.type(within(dialogo).getByLabelText("Descrição"), "Internet");
    await userEvent.type(within(dialogo).getByLabelText("Valor total"), "99,90");
    await userEvent.type(within(dialogo).getByLabelText("Vencimento"), "2026-11-20");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("Conta a pagar salva")).toBeInTheDocument();
    const [, init] = chamadasDe(fetch, "POST /contaPagar")[0]!;
    expect(JSON.parse(String(init?.body))).toEqual({
      descricao: "Internet",
      valorTotal: "99.90",
      vencimento: "2026-11-20",
    });
  });
});
