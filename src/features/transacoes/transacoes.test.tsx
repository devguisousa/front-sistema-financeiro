import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Usuario } from "../../lib/tipos";
import { chamadasDe, type RotasMock } from "../../test/fetch";
import {
  ADMIN,
  categoria,
  conta,
  listagem,
  saldo,
  transacao,
  USUARIO,
} from "../../test/dados";
import { renderApp } from "../../test/render";

function api(extra: RotasMock = {}): RotasMock {
  return {
    "GET /contas": () => listagem("contas", [conta({ id: 1, nome: "Banco" })]),
    "GET /contas/:id/saldo": () => ({ status: 200, corpo: saldo({ saldoAtual: "100.00" }) }),
    "GET /categoria": () =>
      listagem("categoria", [
        categoria({ id: 1, nome: "Vendas", tipo: "RECEITA" }),
        categoria({ id: 2, nome: "Aluguel", tipo: "DESPESA" }),
      ]),
    "GET /transacao": () => listagem("transacao", []),
    ...extra,
  };
}

function abrir(usuario: Usuario = ADMIN, extra: RotasMock = {}) {
  return renderApp({ rota: "/transacoes", usuario, api: api(extra) });
}

const formulario = () => screen.getByRole("complementary", { name: "Nova transação" });

async function preencher({ tipo = "Receita", valor = "10", descricao = "Venda balcão" } = {}) {
  const form = await screen.findByRole("complementary", { name: "Nova transação" });
  await userEvent.click(within(form).getByRole("button", { name: tipo }));
  await userEvent.type(within(form).getByLabelText("Descrição"), descricao);
  await userEvent.type(within(form).getByLabelText("Valor"), valor);
  await within(form).findByRole("option", { name: "Banco" });
  await userEvent.selectOptions(within(form).getByLabelText("Conta"), "Banco");
  const nomeCategoria = tipo === "Receita" ? "Vendas" : "Aluguel";
  await within(form).findByRole("option", { name: nomeCategoria });
  await userEvent.selectOptions(within(form).getByLabelText("Categoria"), nomeCategoria);
  return form;
}

describe("transações", () => {
  const linhas = () =>
    listagem("transacao", [
      transacao({ id: 1, descricao: "Venda" }),
      transacao({ id: 2, descricao: "Pagamento aluguel", tipo: "DESPESA", pagamentoContaPagarId: 1 }),
    ]);

  it("USUARIO não vê editar nem apagar", async () => {
    abrir(USUARIO, { "GET /transacao": linhas });

    expect(await screen.findByText("Pagamento aluguel")).toBeInTheDocument();
    expect(screen.queryAllByRole("button", { name: /^editar/i })).toHaveLength(0);
    expect(screen.queryAllByRole("button", { name: /^apagar/i })).toHaveLength(0);
  });

  it("ADMIN vê editar e apagar só no lançamento manual", async () => {
    abrir(ADMIN, { "GET /transacao": linhas });

    expect(await screen.findByText("Pagamento aluguel")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^editar/i }).map((b) => b.getAttribute("aria-label"))).toEqual([
      "Editar Venda",
    ]);
    expect(screen.getByText("Pagamento")).toBeInTheDocument(); // origem automática
  });

  it("categoria do formulário filtra pelo tipo", async () => {
    abrir();
    const form = await screen.findByRole("complementary", { name: "Nova transação" });

    await userEvent.click(within(form).getByRole("button", { name: "Despesa" }));
    await within(form).findByRole("option", { name: "Aluguel" });

    const opcoes = within(within(form).getByLabelText("Categoria"))
      .getAllByRole("option")
      .map((o) => o.textContent);
    expect(opcoes).toEqual(["Escolha a categoria", "Aluguel"]);
  });

  it("erro de campo da API aparece no campo", async () => {
    abrir(ADMIN, {
      "POST /transacao": () => ({
        status: 400,
        corpo: {
          erro: "DADOS INVÁLIDOS",
          detalhes: [{ path: ["descricao"], message: "Descrição muito grande" }],
        },
      }),
    });

    const form = await preencher();
    await userEvent.click(within(form).getByRole("button", { name: /lançar/i }));

    expect(await within(form).findByText("Descrição muito grande")).toBeInTheDocument();
    expect(within(form).getByLabelText("Descrição")).toHaveAccessibleDescription(
      "Descrição muito grande",
    );
  });

  it("envia valor normalizado e data ISO com hora", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-07T15:00:00.000Z"));
    const { fetch } = abrir(ADMIN, {
      "POST /transacao": () => ({ status: 201, corpo: transacao() }),
    });

    const form = await preencher({ valor: "1.234,56" });
    fireEvent.change(within(form).getByLabelText("Data"), { target: { value: "2026-11-06" } });
    await userEvent.click(within(form).getByRole("button", { name: /lançar/i }));

    expect(await screen.findByText("Lançamento salvo")).toBeInTheDocument();
    const [, init] = chamadasDe(fetch, "POST /transacao")[0]!;
    expect(JSON.parse(String(init?.body))).toEqual({
      descricao: "Venda balcão",
      valor: "1234.56",
      tipo: "RECEITA",
      contaId: 1,
      categoriaId: 1,
      data: "2026-11-06T15:00:00.000Z",
    });
  });

  it("valor inválido não chama a API", async () => {
    const { fetch } = abrir();

    const form = await preencher({ valor: "12,345" });
    await userEvent.click(within(form).getByRole("button", { name: /lançar/i }));

    expect(await within(form).findByText(/valor inválido/i)).toBeInTheDocument();
    expect(chamadasDe(fetch, "POST /transacao")).toHaveLength(0);
  });

  it("prévia avisa quando a conta ficaria negativa", async () => {
    abrir();

    await preencher({ tipo: "Despesa", valor: "150,00" });

    expect(
      await within(formulario()).findByText(/a conta não pode ficar negativa/i),
    ).toBeInTheDocument();
    expect(within(formulario()).getByText("-R$ 50,00", { normalizer: (t) => t.replace(/\s/g, " ") })).toBeInTheDocument();
  });

  it("apagar pede confirmação", async () => {
    const { fetch } = abrir(ADMIN, {
      "GET /transacao": linhas,
      "DELETE /transacao/:id": () => ({ status: 204 }),
    });

    await userEvent.click(await screen.findByRole("button", { name: "Apagar Venda" }));
    const dialogo = await screen.findByRole("alertdialog", { name: "Apagar lançamento?" });
    await userEvent.click(within(dialogo).getByRole("button", { name: "Apagar" }));

    expect(await screen.findByText("Lançamento apagado")).toBeInTheDocument();
    expect(chamadasDe(fetch, "DELETE /transacao/1")).toHaveLength(1);
  });
});
