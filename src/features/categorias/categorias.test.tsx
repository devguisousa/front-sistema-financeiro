import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { Usuario } from "../../lib/tipos";
import { chamadasDe, type RotasMock } from "../../test/fetch";
import { ADMIN, categoria, listagem, USUARIO } from "../../test/dados";
import { renderApp } from "../../test/render";

function abrir(usuario: Usuario = ADMIN, extra: RotasMock = {}) {
  return renderApp({
    rota: "/categorias",
    usuario,
    api: {
      "GET /categoria": () =>
        listagem("categoria", [
          categoria({ id: 1, nome: "Vendas", tipo: "RECEITA" }),
          categoria({ id: 2, nome: "Aluguel", tipo: "DESPESA" }),
          categoria({ id: 3, nome: "Transferência enviada", tipo: "DESPESA" }),
        ]),
      ...extra,
    },
  });
}

describe("categorias", () => {
  it("separa receitas e despesas", async () => {
    abrir();

    const receitas = await screen.findByRole("region", { name: "Receitas" });
    expect(await within(receitas).findByText("Vendas")).toBeInTheDocument();
    expect(within(receitas).queryByText("Aluguel")).not.toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Despesas" })).getByText("Aluguel")).toBeInTheDocument();
  });

  it("categoria do sistema não tem editar nem apagar", async () => {
    abrir();

    const despesas = await screen.findByRole("region", { name: "Despesas" });
    expect(await within(despesas).findByText("Transferência enviada")).toBeInTheDocument();
    expect(within(despesas).getByText("Sistema")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar Transferência enviada" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Editar Aluguel" })).toBeInTheDocument();
  });

  it("USUARIO não vê Nova categoria nem ações", async () => {
    abrir(USUARIO);

    expect(await screen.findByText("Vendas")).toBeInTheDocument();
    expect(screen.queryByRole("complementary", { name: "Nova categoria" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^editar/i })).not.toBeInTheDocument();
  });

  it("cria categoria com nome e tipo", async () => {
    const { fetch } = abrir(ADMIN, {
      "POST /categoria": () => ({ status: 201, corpo: categoria() }),
    });

    const form = await screen.findByRole("complementary", { name: "Nova categoria" });
    await userEvent.type(within(form).getByLabelText("Nome da categoria"), "Mercado");
    await userEvent.click(within(form).getByRole("button", { name: "Despesa" }));
    await userEvent.click(within(form).getByRole("button", { name: "Criar categoria" }));

    expect(await screen.findByText("Categoria salva")).toBeInTheDocument();
    const [, init] = chamadasDe(fetch, "POST /categoria")[0]!;
    expect(JSON.parse(String(init?.body))).toEqual({ nome: "Mercado", tipo: "DESPESA" });
  });

  it("CATEGORIA EM USO vira mensagem amigável", async () => {
    abrir(ADMIN, {
      "DELETE /categoria/:id": () => ({ status: 409, corpo: { erro: "CATEGORIA EM USO" } }),
    });

    await userEvent.click(await screen.findByRole("button", { name: "Apagar Vendas" }));
    await userEvent.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Apagar" }));

    expect(
      await screen.findByText("Esta categoria tem lançamentos e não pode ser apagada."),
    ).toBeInTheDocument();
  });
});
