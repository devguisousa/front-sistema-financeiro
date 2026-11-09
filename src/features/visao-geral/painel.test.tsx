import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ResumoPeriodo } from "../../lib/tipos";
import {
  ADMIN,
  conta,
  contaPagar,
  listagem,
  saldo,
  transacao,
} from "../../test/dados";
import { chamadasDe } from "../../test/fetch";
import { renderApp } from "../../test/render";
import { limitesParaApi, periodoDoAtalho } from "../relatorio/periodos";

const resumo = (o: Partial<ResumoPeriodo> = {}): ResumoPeriodo => ({
  inicio: "",
  fim: "",
  receitas: "0.00",
  despesas: "0.00",
  resultado: "0.00",
  qtdReceitas: 0,
  qtdDespesas: 0,
  porCategoria: [],
  ...o,
});

const umaConta = {
  "GET /contas": () => listagem("contas", [conta({ id: 1, nome: "Banco" })]),
  "GET /contas/:id/saldo": () => ({ status: 200, corpo: saldo({ contaId: 1, saldoAtual: "100.00" }) }),
};

const inicioDe = (fetch: ReturnType<typeof renderApp>["fetch"]) =>
  chamadasDe(fetch, "GET /transacao/resumo").map(
    ([url]) => new URL(String(url), "http://localhost").searchParams.get("inicio"),
  );

const vazio = {
  "GET /transacao/resumo": () => ({ status: 200, corpo: resumo() }),
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
        "GET /transacao/resumo": () => ({
          status: 200,
          corpo: resumo({ receitas: "250.00", resultado: "250.00", qtdReceitas: 1 }),
        }),
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

  it("cartões do mês seguem o período escolhido e comparam com o anterior", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-07T15:00:00.000Z"));

    const novembro = limitesParaApi(periodoDoAtalho("este-mes")).inicio;
    const outubro = limitesParaApi(periodoDoAtalho("mes-passado")).inicio;
    const porInicio: Record<string, ResumoPeriodo> = {
      [novembro]: resumo({ receitas: "1000.00", despesas: "400.00", resultado: "600.00", qtdReceitas: 2, qtdDespesas: 1 }),
      [outubro]: resumo({ receitas: "800.00", despesas: "500.00", resultado: "300.00", qtdReceitas: 1, qtdDespesas: 1 }),
    };

    const { fetch } = renderApp({
      rota: "/",
      usuario: ADMIN,
      api: {
        ...vazio,
        ...umaConta,
        "GET /transacao/resumo": ({ query }) => ({
          status: 200,
          corpo: porInicio[query.get("inicio") ?? ""] ?? resumo(),
        }),
      },
    });

    const receitas = await screen.findByRole("region", { name: "Receitas · nov" });
    expect(await within(receitas).findByText(/R\$\s1\.000,00/)).toBeInTheDocument();
    expect(within(receitas).getByText("2 lançamentos de entrada")).toBeInTheDocument();
    expect(within(receitas).getByText("+25% vs out")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Despesas · nov" })).getByText("−20% vs out")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Resultado · nov" })).getByText("+100% vs out")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Este mês" })).toHaveAttribute("aria-pressed", "true");
    expect(inicioDe(fetch)).toEqual(expect.arrayContaining([novembro, outubro]));

    await userEvent.click(screen.getByRole("button", { name: "Mês passado" }));

    const receitasOut = await screen.findByRole("region", { name: "Receitas · out" });
    expect(await within(receitasOut).findByText(/R\$\s800,00/)).toBeInTheDocument();
    // Setembro sem movimento: sem base para a porcentagem
    expect(await within(receitasOut).findByText("— vs set")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mês passado" })).toHaveAttribute("aria-pressed", "true");
    expect(inicioDe(fetch)).toContain(limitesParaApi({ de: "2026-09-01", ate: "2026-09-30" }).inicio);

    // O resto da página não depende do período
    expect(screen.getByRole("region", { name: "Saldo total" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Fluxo de caixa" })).toBeInTheDocument();
  });

  it("datas livres: cartões sem nome de mês e comparação com os dias logo antes", async () => {
    const { fetch } = renderApp({
      rota: "/?de=2026-10-05&ate=2026-10-20",
      usuario: ADMIN,
      api: { ...vazio, ...umaConta },
    });

    expect(await screen.findByText("05/10/2026 a 20/10/2026")).toBeInTheDocument();
    expect(await screen.findByRole("region", { name: "Receitas" })).toBeInTheDocument();
    expect(await screen.findAllByText("— vs período anterior")).toHaveLength(3);

    const periodo = limitesParaApi({ de: "2026-10-05", ate: "2026-10-20" }).inicio;
    const anterior = limitesParaApi({ de: "2026-09-19", ate: "2026-10-04" }).inicio;
    await waitFor(() => expect(inicioDe(fetch)).toEqual(expect.arrayContaining([periodo, anterior])));

    fireEvent.change(screen.getByLabelText("De"), { target: { value: "2026-10-01" } });
    fireEvent.change(screen.getByLabelText("Até"), { target: { value: "2026-10-31" } });
    await userEvent.click(screen.getByRole("button", { name: "Ver período" }));

    expect(await screen.findByRole("region", { name: "Receitas · out" })).toBeInTheDocument();
  });

  it("erro no resumo do período aparece no lugar dos cartões", async () => {
    renderApp({
      rota: "/",
      usuario: ADMIN,
      api: {
        ...vazio,
        ...umaConta,
        "GET /transacao/resumo": () => ({ status: 500, corpo: { erro: "Falhou" } }),
      },
    });

    expect(await screen.findByRole("button", { name: /tentar de novo/i })).toBeInTheDocument();
  });
});
