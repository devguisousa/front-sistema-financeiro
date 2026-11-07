import { vi } from "vitest";

export type ReqMock = {
  metodo: string;
  caminho: string;
  params: Record<string, string>;
  query: URLSearchParams;
  corpo: unknown;
  headers: Headers;
};

export type RespostaMock = { status: number; corpo?: unknown };

/** Chave "MÉTODO /caminho" (sem /api e sem query); ":nome" casa qualquer segmento. */
export type RotasMock = Record<
  string,
  (req: ReqMock) => RespostaMock | Promise<RespostaMock>
>;

// Pedidos sem rota cadastrada: o setup falha o teste no afterEach
// (um throw dentro do fetch viraria "sem conexão" e passaria despercebido)
const naoCadastradas: string[] = [];

export function conferirRotasNaoCadastradas() {
  const lista = naoCadastradas.splice(0);
  if (lista.length > 0) {
    throw new Error(`mockFetch: rota não cadastrada: ${lista.join(", ")}`);
  }
}

function casar(padrao: string, caminho: string): Record<string, string> | null {
  const a = padrao.split("/");
  const b = caminho.split("/");
  if (a.length !== b.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < a.length; i++) {
    const seg = a[i] ?? "";
    if (seg.startsWith(":")) params[seg.slice(1)] = b[i] ?? "";
    else if (seg !== b[i]) return null;
  }
  return params;
}

/** Troca o fetch global por respostas fixas. Devolve o vi.fn para inspecionar. */
export function mockFetch(rotas: RotasMock) {
  const fn = vi.fn(async (entrada: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(entrada), "http://localhost");
    const caminho = url.pathname.replace(/^\/api/, "");
    const metodo = (init?.method ?? "GET").toUpperCase();

    for (const [chave, responder] of Object.entries(rotas)) {
      const [m, padrao = ""] = chave.split(" ");
      if (m !== metodo) continue;
      const params = casar(padrao, caminho);
      if (!params) continue;

      const { status, corpo } = await responder({
        metodo,
        caminho,
        params,
        query: url.searchParams,
        corpo: init?.body ? JSON.parse(String(init.body)) : undefined,
        headers: new Headers(init?.headers),
      });

      return new Response(corpo === undefined ? null : JSON.stringify(corpo), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    }

    naoCadastradas.push(`${metodo} ${caminho}`);
    return new Response(JSON.stringify({ erro: "ROTA NÃO CADASTRADA NO MOCK" }), {
      status: 599,
    });
  });

  vi.stubGlobal("fetch", fn);
  return fn;
}

/** Pedidos feitos a uma rota, na ordem ("POST /auth/refresh"). */
export function chamadasDe(fn: ReturnType<typeof mockFetch>, chave: string) {
  const [metodo, caminho] = chave.split(" ");
  return fn.mock.calls.filter(([entrada, init]) => {
    const url = new URL(String(entrada), "http://localhost");
    return (
      (init?.method ?? "GET").toUpperCase() === metodo &&
      url.pathname.replace(/^\/api/, "") === caminho
    );
  });
}
