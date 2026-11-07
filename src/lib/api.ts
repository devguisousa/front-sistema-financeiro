import { type DetalheErro, ErroApi } from "./erros";
import type { Pagina, Tokens } from "./tipos";

// Em dev o Vite repassa /api para a API (sem CORS). Em produção, a API fica
// no mesmo domínio em /api, ou VITE_API_URL aponta para ela.
const BASE: string = import.meta.env.VITE_API_URL ?? "/api";

const CHAVE_REFRESH = "fluxo.refresh";
const NOME_DO_LOCK = "fluxo-refresh";

// 401 que significam "token velho ou ausente": só estes disparam a renovação.
// Outros 401 (ex.: SENHA ATUAL INCORRETA) são erros comuns.
const CODIGOS_DE_TOKEN = new Set(["TOKEN INVÁLIDO OU EXPIRADO", "TOKEN NÃO ENVIADO"]);

type Metodo = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type Query = Record<string, string | number | boolean | undefined>;

export type OpcoesRequisicao = {
  metodo?: Metodo;
  corpo?: unknown;
  query?: Query;
  /** Rota pública: vai sem token e nunca tenta renovar. */
  publica?: boolean;
};

// Access token só em memória; o refresh fica no localStorage porque a API
// o devolve no corpo (risco aceito na spec: um XSS conseguiria lê-lo).
let accessToken: string | null = null;
const ouvintes = new Set<() => void>();

// ---------------------------------------------------------------- sessão

export function lerRefreshToken(): string | null {
  try {
    return localStorage.getItem(CHAVE_REFRESH);
  } catch {
    return null;
  }
}

export function definirSessao(tokens: Tokens): void {
  accessToken = tokens.accessToken;
  try {
    localStorage.setItem(CHAVE_REFRESH, tokens.refreshToken);
  } catch {
    // sem localStorage (modo privado restrito): a sessão vale só nesta aba
  }
}

export function limparSessao(): void {
  accessToken = null;
  try {
    localStorage.removeItem(CHAVE_REFRESH);
  } catch {
    // nada a limpar
  }
}

export function temSessao(): boolean {
  return accessToken !== null || lerRefreshToken() !== null;
}

/** Avisa quando a sessão cai (renovação recusada ou logout em outra aba). */
export function aoPerderSessao(callback: () => void): () => void {
  ouvintes.add(callback);
  return () => ouvintes.delete(callback);
}

function avisarPerdaDeSessao() {
  for (const callback of ouvintes) callback();
}

function perderSessao() {
  limparSessao();
  avisarPerdaDeSessao();
}

// Logout em outra aba apaga o refresh do localStorage: esta aba sai também
if (typeof window !== "undefined") {
  window.addEventListener("storage", (evento) => {
    const mexeuNaSessao = evento.key === CHAVE_REFRESH || evento.key === null;
    if (mexeuNaSessao && lerRefreshToken() === null) {
      accessToken = null;
      avisarPerdaDeSessao();
    }
  });
}

// ---------------------------------------------------------------- HTTP

function montarUrl(caminho: string, query?: Query): string {
  const params = new URLSearchParams();
  for (const [chave, valor] of Object.entries(query ?? {})) {
    if (valor !== undefined && valor !== "") params.set(chave, String(valor));
  }
  const texto = params.toString();
  return `${BASE}${caminho}${texto ? `?${texto}` : ""}`;
}

async function chamar(
  caminho: string,
  opcoes: OpcoesRequisicao,
  token: string | null,
): Promise<Response> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (opcoes.corpo !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    return await fetch(montarUrl(caminho, opcoes.query), {
      method: opcoes.metodo ?? "GET",
      headers,
      body: opcoes.corpo === undefined ? undefined : JSON.stringify(opcoes.corpo),
    });
  } catch {
    throw new ErroApi(0, "SEM CONEXÃO");
  }
}

async function lerCorpo(resposta: Response): Promise<unknown> {
  try {
    return await resposta.json();
  } catch {
    return null;
  }
}

async function paraErro(resposta: Response): Promise<ErroApi> {
  const corpo = (await lerCorpo(resposta)) as {
    erro?: unknown;
    detalhes?: unknown;
  } | null;
  const codigo = typeof corpo?.erro === "string" ? corpo.erro : `ERRO ${resposta.status}`;
  const detalhes = Array.isArray(corpo?.detalhes) ? (corpo.detalhes as DetalheErro[]) : [];
  return new ErroApi(resposta.status, codigo, detalhes);
}

async function lerResposta<T>(resposta: Response): Promise<T> {
  if (!resposta.ok) throw await paraErro(resposta);
  if (resposta.status === 204) return undefined as T;
  return (await lerCorpo(resposta)) as T;
}

// ---------------------------------------------------------------- renovação

let renovacaoEmVoo: Promise<boolean> | null = null;

async function comLock<T>(tarefa: () => Promise<T>): Promise<T> {
  const locks = typeof navigator === "undefined" ? undefined : navigator.locks;
  if (locks?.request) return locks.request(NOME_DO_LOCK, tarefa) as Promise<T>;
  return tarefa();
}

async function renovarAgora(): Promise<boolean> {
  // Lido DENTRO do lock: se outra aba renovou enquanto esta esperava, usa o
  // token novo. Reutilizar um refresh antigo derruba todas as sessões.
  const refreshToken = lerRefreshToken();
  if (!refreshToken) return false;

  const resposta = await chamar(
    "/auth/refresh",
    { metodo: "POST", corpo: { refreshToken } },
    null,
  );

  if (resposta.ok) {
    definirSessao((await lerCorpo(resposta)) as Tokens);
    return true;
  }
  if (resposta.status === 401) return false;

  // 429/500: a sessão pode estar boa; não apagar
  throw await paraErro(resposta);
}

/**
 * Troca o refresh token por um par novo. Uma renovação por vez nesta aba
 * (chamadas simultâneas esperam a mesma) e entre abas (navigator.locks).
 * Falha de rede lança ErroApi(0) sem apagar a sessão.
 */
export function renovarSessao(): Promise<boolean> {
  renovacaoEmVoo ??= comLock(renovarAgora).finally(() => {
    renovacaoEmVoo = null;
  });
  return renovacaoEmVoo;
}

async function renovarOuSair(): Promise<void> {
  if (!(await renovarSessao())) {
    perderSessao();
    throw new ErroApi(401, "SESSÃO EXPIRADA");
  }
}

// ---------------------------------------------------------------- API pública

/** Chama a API. 401 de token: renova uma vez e repete; se não der, sai. */
export async function requisicao<T>(
  caminho: string,
  opcoes: OpcoesRequisicao = {},
): Promise<T> {
  if (opcoes.publica) return lerResposta<T>(await chamar(caminho, opcoes, null));

  // Página recarregada: não há access token na memória, mas há sessão
  if (accessToken === null && lerRefreshToken() !== null) await renovarOuSair();

  const tokenEnviado = accessToken;
  let resposta = await chamar(caminho, opcoes, tokenEnviado);
  if (resposta.status !== 401) return lerResposta<T>(resposta);

  const erro = await paraErro(resposta);
  if (!CODIGOS_DE_TOKEN.has(erro.codigo)) throw erro;

  // Se outra chamada já renovou enquanto esta estava no ar, só repete
  if (accessToken === tokenEnviado) await renovarOuSair();

  resposta = await chamar(caminho, opcoes, accessToken);
  if (resposta.status === 401) {
    const segundo = await paraErro(resposta);
    if (CODIGOS_DE_TOKEN.has(segundo.codigo)) perderSessao();
    throw segundo;
  }
  return lerResposta<T>(resposta);
}

/** Converte as listagens da API (cada recurso tem um formato) em Pagina<T>. */
export function normalizarPagina<T>(
  resposta: Record<string, unknown>,
  chave: string,
): Pagina<T> {
  const itens = resposta[chave];
  return {
    itens: Array.isArray(itens) ? (itens as T[]) : [],
    pagina: Number(resposta.pagina ?? 1),
    // contaReceber, pagamentos e recebimentos usam "totalPagina"
    totalPaginas: Number(resposta.totalPaginas ?? resposta.totalPagina ?? 0),
    total: Number(resposta.total ?? 0),
  };
}

const LIMITE_MAXIMO = 100; // máximo aceito pela API
const TETO_DE_PAGINAS = 20;

/** Busca todas as páginas de uma listagem (para selects e saldos). */
export async function buscarTodas<T>(
  caminho: string,
  chave: string,
  query: Query = {},
  paginacao: "page" | "pagina" = "page",
): Promise<T[]> {
  const [nomePagina, nomeLimite] =
    paginacao === "page" ? ["page", "limit"] : ["pagina", "limite"];
  const todos: T[] = [];

  for (let pagina = 1; pagina <= TETO_DE_PAGINAS; pagina++) {
    const resposta = await requisicao<Record<string, unknown>>(caminho, {
      query: { ...query, [nomePagina]: pagina, [nomeLimite]: LIMITE_MAXIMO },
    });
    const pag = normalizarPagina<T>(resposta, chave);
    todos.push(...pag.itens);
    if (pagina >= pag.totalPaginas) break;
  }

  return todos;
}
