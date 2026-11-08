import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { ResumoPeriodo } from "../../lib/tipos";
import { chamadasDe, type RotasMock } from "../../test/fetch";
import { ADMIN, listagem, transacao } from "../../test/dados";
import { renderApp } from "../../test/render";
import { limitesParaApi, periodoDoAtalho } from "./periodos";

const resumo = (o: Partial<ResumoPeriodo> = {}): ResumoPeriodo => ({
  inicio: "2026-11-01T03:00:00.000Z",
  fim: "2026-12-01T02:59:59.999Z",
  receitas: "5000.00",
  despesas: "1800.00",
  resultado: "3200.00",
  qtdReceitas: 1,
  qtdDespesas: 3,
  porCategoria: [
    { categoriaId: 1, nome: "Salário", tipo: "RECEITA", total: "5000.00", quantidade: 1 },
    { categoriaId: 2, nome: "Moradia", tipo: "DESPESA", total: "1500.00", quantidade: 1 },
    { categoriaId: 3, nome: "Mercado", tipo: "DESPESA", total: "300.00", quantidade: 2 },
  ],
  ...o,
});

function abrir(rota = "/relatorio", extra: RotasMock = {}) {
  return renderApp({
    rota,
    usuario: ADMIN,
    api: {
      "GET /transacao/resumo": () => ({ status: 200, corpo: resumo() }),
      "GET /transacao": () =>
        listagem("transacao", [
          transacao({ id: 1, descricao: "Salário de novembro", valor: "5000.00" }),
          transacao({
            id: 2,
            descricao: "Para a reserva",
            tipo: "DESPESA",
            transferenciaId: 7,
            categoria: { id: 9, nome: "Transferência", tipo: "DESPESA" },
          }),
        ]),
      ...extra,
    },
  });
}

const queryDe = (fetch: ReturnType<typeof renderApp>["fetch"], chave: string) =>
  chamadasDe(fetch, chave).map(([url]) => new URL(String(url), "http://localhost").searchParams);

describe("relatório por período", () => {
  it("abre no mês atual com totais, categorias e lançamentos", async () => {
    const { fetch } = abrir();

    const receitas = await screen.findByRole("region", { name: "Receitas" });
    expect(await within(receitas).findByText(/R\$\s5\.000,00/)).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Despesas" })).getByText(/R\$\s1\.800,00/)).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Resultado" })).getByText(/R\$\s3\.200,00/)).toBeInTheDocument();
    expect(within(receitas).getByText("1 lançamento de entrada")).toBeInTheDocument();

    const despesas = screen.getByRole("region", { name: "Despesas por categoria" });
    expect(within(despesas).getByText("Moradia")).toBeInTheDocument();
    expect(within(despesas).getByText("83%")).toBeInTheDocument();
    expect(within(despesas).getByText("17%")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Receitas por categoria" })).getByText("Salário")).toBeInTheDocument();

    expect(await screen.findByText("Salário de novembro")).toBeInTheDocument();
    expect(screen.getByText(/fora dos totais/)).toBeInTheDocument();

    const esperado = limitesParaApi(periodoDoAtalho("este-mes"));
    const [query] = queryDe(fetch, "GET /transacao/resumo");
    expect(query?.get("inicio")).toBe(esperado.inicio);
    expect(query?.get("fim")).toBe(esperado.fim);
    const [lista] = queryDe(fetch, "GET /transacao");
    expect(lista?.get("inicio")).toBe(esperado.inicio);
    expect(lista?.get("fim")).toBe(esperado.fim);

    expect(screen.getByRole("button", { name: "Este mês" })).toHaveAttribute("aria-pressed", "true");
  });

  it("atalho troca o período e refaz a busca", async () => {
    const { fetch } = abrir();
    await screen.findByRole("region", { name: "Receitas" });

    await userEvent.click(screen.getByRole("button", { name: "Mês passado" }));

    const esperado = limitesParaApi(periodoDoAtalho("mes-passado"));
    await waitFor(() =>
      expect(queryDe(fetch, "GET /transacao/resumo").some((q) => q.get("inicio") === esperado.inicio)).toBe(true),
    );
    expect(screen.getByRole("button", { name: "Mês passado" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Este mês" })).toHaveAttribute("aria-pressed", "false");
  });

  it("datas livres só valem ao clicar em Ver período", async () => {
    const { fetch } = abrir();
    await screen.findByRole("region", { name: "Receitas" });
    const antes = chamadasDe(fetch, "GET /transacao/resumo").length;

    fireEvent.change(screen.getByLabelText("De"), { target: { value: "2026-10-05" } });
    fireEvent.change(screen.getByLabelText("Até"), { target: { value: "2026-10-20" } });
    expect(chamadasDe(fetch, "GET /transacao/resumo")).toHaveLength(antes);

    await userEvent.click(screen.getByRole("button", { name: "Ver período" }));

    const esperado = limitesParaApi({ de: "2026-10-05", ate: "2026-10-20" });
    await waitFor(() =>
      expect(queryDe(fetch, "GET /transacao/resumo").at(-1)?.get("inicio")).toBe(esperado.inicio),
    );
    expect(queryDe(fetch, "GET /transacao/resumo").at(-1)?.get("fim")).toBe(esperado.fim);
    expect(await screen.findByText("05/10/2026 a 20/10/2026")).toBeInTheDocument();
    for (const atalho of ["Este mês", "Mês passado", "Últimos 30 dias", "Este ano"]) {
      expect(screen.getByRole("button", { name: atalho })).toHaveAttribute("aria-pressed", "false");
    }
  });

  it("recusa data final antes da inicial, sem buscar", async () => {
    const { fetch } = abrir();
    await screen.findByRole("region", { name: "Receitas" });
    const antes = chamadasDe(fetch, "GET /transacao/resumo").length;

    fireEvent.change(screen.getByLabelText("De"), { target: { value: "2026-10-20" } });
    fireEvent.change(screen.getByLabelText("Até"), { target: { value: "2026-10-05" } });
    await userEvent.click(screen.getByRole("button", { name: "Ver período" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("A data final vem antes da inicial.");
    expect(chamadasDe(fetch, "GET /transacao/resumo")).toHaveLength(antes);
  });

  it("lê o período da URL", async () => {
    const { fetch } = abrir("/relatorio?de=2026-03-01&ate=2026-03-31");

    expect(await screen.findByText("01/03/2026 a 31/03/2026")).toBeInTheDocument();
    const esperado = limitesParaApi({ de: "2026-03-01", ate: "2026-03-31" });
    await waitFor(() => expect(queryDe(fetch, "GET /transacao/resumo")[0]?.get("inicio")).toBe(esperado.inicio));
  });

  it("período vazio avisa em cada bloco", async () => {
    abrir("/relatorio", {
      "GET /transacao/resumo": () => ({
        status: 200,
        corpo: resumo({
          receitas: "0.00",
          despesas: "0.00",
          resultado: "0.00",
          qtdReceitas: 0,
          qtdDespesas: 0,
          porCategoria: [],
        }),
      }),
      "GET /transacao": () => listagem("transacao", []),
    });

    expect(await screen.findByText("Nenhuma despesa no período.")).toBeInTheDocument();
    expect(screen.getByText("Nenhuma receita no período.")).toBeInTheDocument();
    expect(await screen.findByText("Nada lançado nesse período")).toBeInTheDocument();
  });

  it("resultado negativo fica em coral", async () => {
    abrir("/relatorio", {
      "GET /transacao/resumo": () => ({
        status: 200,
        corpo: resumo({ receitas: "100.00", despesas: "300.00", resultado: "-200.00" }),
      }),
    });

    const cartao = await screen.findByRole("region", { name: "Resultado" });
    const valor = await within(cartao).findByText(/200,00/);
    expect(valor).toHaveClass("text-coral");
  });

  it("aparece no menu", async () => {
    abrir();
    const menu = await screen.findByRole("navigation", { name: "Navegação principal" });
    expect(within(menu).getByRole("link", { name: "Relatório" })).toHaveAttribute("href", "/relatorio");
  });
});
