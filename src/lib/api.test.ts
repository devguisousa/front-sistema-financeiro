import { beforeEach, describe, expect, it, vi } from "vitest";
import { chamadasDe, mockFetch } from "../test/fetch";
import {
  aoPerderSessao,
  buscarTodas,
  definirSessao,
  limparSessao,
  normalizarPagina,
  requisicao,
  temSessao,
} from "./api";
import { ErroApi } from "./erros";

const CHAVE = "fluxo.refresh";
const TOKEN_EXPIRADO = { status: 401, corpo: { erro: "TOKEN INVÁLIDO OU EXPIRADO" } };

beforeEach(() => {
  limparSessao();
});

describe("requisicao", () => {
  it("envia Bearer, JSON e query sem undefined", async () => {
    definirSessao({ accessToken: "A1", refreshToken: "R1" });
    const fetch = mockFetch({
      "POST /transacao": () => ({ status: 201, corpo: { id: 1 } }),
    });

    const res = await requisicao("/transacao", {
      metodo: "POST",
      corpo: { valor: "10.00" },
      query: { tipo: "RECEITA", contaId: undefined },
    });

    expect(res).toEqual({ id: 1 });
    const [url, init] = fetch.mock.calls[0]!;
    expect(String(url)).toBe("/api/transacao?tipo=RECEITA");
    const headers = new Headers(init?.headers);
    expect(headers.get("Authorization")).toBe("Bearer A1");
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(init?.body).toBe(JSON.stringify({ valor: "10.00" }));
  });

  it("erro da API vira ErroApi com código e detalhes", async () => {
    definirSessao({ accessToken: "A1", refreshToken: "R1" });
    const detalhes = [{ path: ["valor"], message: "Valor inválido" }];
    mockFetch({
      "POST /transacao": () => ({ status: 400, corpo: { erro: "DADOS INVÁLIDOS", detalhes } }),
    });

    const erro = await requisicao("/transacao", { metodo: "POST", corpo: {} }).catch((e) => e);

    expect(erro).toBeInstanceOf(ErroApi);
    expect(erro).toMatchObject({ status: 400, codigo: "DADOS INVÁLIDOS", detalhes });
  });

  it("204 devolve undefined", async () => {
    definirSessao({ accessToken: "A1", refreshToken: "R1" });
    mockFetch({ "DELETE /contas/:id": () => ({ status: 204 }) });

    expect(await requisicao("/contas/3", { metodo: "DELETE" })).toBeUndefined();
  });

  it("rota pública vai sem Authorization", async () => {
    definirSessao({ accessToken: "A1", refreshToken: "R1" });
    const fetch = mockFetch({
      "GET /auth/status": () => ({ status: 200, corpo: { precisaAdmin: false } }),
    });

    await requisicao("/auth/status", { publica: true });

    expect(new Headers(fetch.mock.calls[0]![1]?.headers).has("Authorization")).toBe(false);
  });

  it("falha de rede vira ErroApi status 0", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(requisicao("/auth/status", { publica: true })).rejects.toMatchObject({
      status: 0,
    });
  });
});

describe("renovação de sessão", () => {
  it("duas chamadas com 401 renovam uma vez só e repetem", async () => {
    definirSessao({ accessToken: "A1", refreshToken: "R1" });
    const fetch = mockFetch({
      "GET /contas": ({ headers }) =>
        headers.get("Authorization") === "Bearer A2"
          ? { status: 200, corpo: { ok: true } }
          : TOKEN_EXPIRADO,
      "POST /auth/refresh": () => ({
        status: 200,
        corpo: { accessToken: "A2", refreshToken: "R2" },
      }),
    });

    const [a, b] = await Promise.all([requisicao("/contas"), requisicao("/contas")]);

    expect(a).toEqual({ ok: true });
    expect(b).toEqual({ ok: true });
    expect(chamadasDe(fetch, "POST /auth/refresh")).toHaveLength(1);
    expect(localStorage.getItem(CHAVE)).toBe("R2");
  });

  it("sem access token na memória e com refresh salvo, renova antes de chamar", async () => {
    localStorage.setItem(CHAVE, "R1"); // página recarregada
    const fetch = mockFetch({
      "POST /auth/refresh": () => ({
        status: 200,
        corpo: { accessToken: "A2", refreshToken: "R2" },
      }),
      "GET /auth/me": ({ headers }) =>
        headers.get("Authorization") === "Bearer A2" ? { status: 200, corpo: { id: 1 } } : TOKEN_EXPIRADO,
    });

    expect(await requisicao("/auth/me")).toEqual({ id: 1 });
    expect(chamadasDe(fetch, "GET /auth/me")).toHaveLength(1);
  });

  it("usa o refresh token lido dentro do lock", async () => {
    definirSessao({ accessToken: "A1", refreshToken: "R1" });
    const request = vi.fn(async (_nome: string, callback: () => Promise<unknown>) => {
      // outra aba renovou enquanto esta esperava o lock
      localStorage.setItem(CHAVE, "R9");
      return callback();
    });
    vi.stubGlobal("navigator", { locks: { request } });
    const fetch = mockFetch({
      "GET /contas": ({ headers }) =>
        headers.get("Authorization") === "Bearer A2" ? { status: 200, corpo: [] } : TOKEN_EXPIRADO,
      "POST /auth/refresh": () => ({
        status: 200,
        corpo: { accessToken: "A2", refreshToken: "R10" },
      }),
    });

    await requisicao("/contas");

    expect(request).toHaveBeenCalledWith("fluxo-refresh", expect.any(Function));
    const [, init] = chamadasDe(fetch, "POST /auth/refresh")[0]!;
    expect(JSON.parse(String(init?.body))).toEqual({ refreshToken: "R9" });
  });

  it("renovação recusada limpa a sessão e avisa", async () => {
    definirSessao({ accessToken: "A1", refreshToken: "R1" });
    const ouvinte = vi.fn();
    const parar = aoPerderSessao(ouvinte);
    mockFetch({
      "GET /contas": () => TOKEN_EXPIRADO,
      "POST /auth/refresh": () => ({
        status: 401,
        corpo: { erro: "REFRESH TOKEN INVÁLIDO OU EXPIRADO" },
      }),
    });

    const erro = await requisicao("/contas").catch((e: unknown) => e);

    expect(erro).toBeInstanceOf(ErroApi);
    expect(erro).toMatchObject({ status: 401 });
    expect(ouvinte).toHaveBeenCalledTimes(1);
    expect(temSessao()).toBe(false);
    parar();
  });

  it("falha de rede na renovação não apaga a sessão", async () => {
    definirSessao({ accessToken: "A1", refreshToken: "R1" });
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.endsWith("/auth/refresh")) throw new TypeError("Failed to fetch");
        return new Response(JSON.stringify(TOKEN_EXPIRADO.corpo), { status: 401 });
      }),
    );

    await expect(requisicao("/contas")).rejects.toMatchObject({ status: 0 });
    expect(temSessao()).toBe(true);
  });

  it("401 que não é de token não renova", async () => {
    definirSessao({ accessToken: "A1", refreshToken: "R1" });
    const fetch = mockFetch({
      "PUT /auth/senha": () => ({ status: 401, corpo: { erro: "SENHA ATUAL INCORRETA" } }),
    });

    await expect(requisicao("/auth/senha", { metodo: "PUT", corpo: {} })).rejects.toMatchObject({
      status: 401,
      codigo: "SENHA ATUAL INCORRETA",
    });
    expect(chamadasDe(fetch, "POST /auth/refresh")).toHaveLength(0);
    expect(temSessao()).toBe(true);
  });

  it("logout em outra aba derruba esta", async () => {
    definirSessao({ accessToken: "A1", refreshToken: "R1" });
    const ouvinte = vi.fn();
    const parar = aoPerderSessao(ouvinte);

    localStorage.removeItem(CHAVE); // o que a outra aba fez
    window.dispatchEvent(new StorageEvent("storage", { key: CHAVE, newValue: null }));

    expect(ouvinte).toHaveBeenCalledTimes(1);
    parar();
  });
});

describe("paginação", () => {
  it("normalizarPagina aceita totalPaginas e totalPagina", () => {
    expect(
      normalizarPagina({ contaReceber: ["x"], pagina: 2, total: 11, totalPagina: 2 }, "contaReceber"),
    ).toEqual({ itens: ["x"], pagina: 2, totalPaginas: 2, total: 11 });
    expect(
      normalizarPagina({ contas: [], pagina: 1, total: 0, totalPaginas: 0 }, "contas"),
    ).toEqual({ itens: [], pagina: 1, totalPaginas: 0, total: 0 });
  });

  it("buscarTodas percorre as páginas com page/limit", async () => {
    definirSessao({ accessToken: "A1", refreshToken: "R1" });
    const fetch = mockFetch({
      "GET /categoria": ({ query }) => {
        const pagina = Number(query.get("page"));
        return {
          status: 200,
          corpo: { categoria: [`c${pagina}`], pagina, total: 3, totalPaginas: 3 },
        };
      },
    });

    expect(await buscarTodas("/categoria", "categoria", { tipo: "RECEITA" })).toEqual([
      "c1",
      "c2",
      "c3",
    ]);
    const [url] = fetch.mock.calls[0]!;
    expect(String(url)).toBe("/api/categoria?tipo=RECEITA&page=1&limit=100");
  });

  it("buscarTodas usa pagina/limite quando pedido", async () => {
    definirSessao({ accessToken: "A1", refreshToken: "R1" });
    const fetch = mockFetch({
      "GET /contaReceber": () => ({
        status: 200,
        corpo: { contaReceber: ["r"], pagina: 1, total: 1, totalPagina: 1 },
      }),
    });

    expect(await buscarTodas("/contaReceber", "contaReceber", {}, "pagina")).toEqual(["r"]);
    expect(String(fetch.mock.calls[0]![0])).toBe("/api/contaReceber?pagina=1&limite=100");
  });
});
