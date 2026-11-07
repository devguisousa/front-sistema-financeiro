# Front-end Fluxo — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar o front-end Fluxo (React + TS + Tailwind v4, preto e verde) ligado à API `sistema_financeiro`, com primeiro acesso que cria o ADMIN.

**Architecture:** SPA Vite que fala com a API pelo proxy `/api`. `lib/` concentra HTTP, sessão, dinheiro, datas e erros (sem React Router). `components/ui/` são peças visuais sem API. Cada pasta de `features/` tem página, hooks de query/mutation e formulários da tela. TanStack Query faz cache e invalidação.

**Tech Stack:** Vite 8, React 19, TypeScript strict, Tailwind CSS 4.3 (`@tailwindcss/vite`), React Router 8, TanStack Query 5, `radix-ui` 1.x, Recharts 3, lucide-react, sonner, `@fontsource`. Testes: Vitest 5, Testing Library, jsdom. Back-end: Express 5, Prisma 7, Zod 4, Vitest + supertest.

**Spec:** `docs/superpowers/specs/2026-11-07-front-fluxo-design.md` (ler junto com este plano).

**Repositórios:**
- Front: `/home/guilherme/Documentos/JS e TS/projetos/front sistema financeiro` (chamado de FRONT).
- Back: `/home/guilherme/Documentos/JS e TS/projetos/sistema_financeiro` (chamado de BACK).
- Mockups: `/home/guilherme/Documentos/JS e TS/projetos/design-fluxo/*.dc.html`. Cada tela tem o seu (`Main` = visão geral). Abrir o mockup da tela antes de escrever a página e copiar layout, textos e espaçamentos.

## Global Constraints

- Node ≥ 22 (máquina tem v26). Versões atuais no npm: as do Tech Stack; não fixar versões menores.
- Tailwind v4 com tokens em `@theme` no `src/index.css`. Nenhum `tailwind.config.*`.
- Bibliotecas permitidas: as do Tech Stack + `clsx`, `tailwind-merge`, `@testing-library/user-event`, `@testing-library/jest-dom`. Qualquer outra: perguntar antes.
- Cores (tokens `--color-*`): `noite #060807`, `noite-2 #0B0F0D`, `superficie #0C110E`, `superficie-2 #111814`, `superficie-3 #141B17`, `linha #18201C`, `linha-2 #1E2A24`, `linha-3 #232D28`, `linha-forte #3A4A42`, `nevoa #E9F1EC`, `nevoa-2 #B9C4BE`, `musgo #8B978F`, `musgo-2 #76827A`, `verde #3DF58F`, `verde-claro #6BFFAD`, `coral #FF8B66`.
- Fontes: Geist (texto), Geist Mono (números, rótulos, kicker caixa alta), Instrument Serif itálico (destaque em títulos). Números com `tabular-nums`.
- Botões em pílula; `active:scale-[.97]`; animações ≤ 250 ms, desligadas com `prefers-reduced-motion`.
- Foco: `outline 2px` verde, `offset 2px`. Alvos de clique ≥ 40 px. Contraste AA.
- Página nunca rola na horizontal; tabelas têm rolagem horizontal própria. Sidebar fixa no desktop (`lg`), gaveta no celular.
- `lang="pt-BR"`; título por rota no formato `"<Tela> — Fluxo"`. Todo texto de interface em português com acentos.
- Dinheiro: enviado como texto com 2 casas (`"150.50"`); contas em centavos inteiros (`number`).
- Vencimentos (meia-noite UTC) formatados com `timeZone: "UTC"`. Datas de transação no fuso local.
- Access token só em memória. Refresh token em `localStorage`, chave `fluxo.refresh`.
- Nada de `dangerouslySetInnerHTML`.
- Back-end: mudar só as duas rotas de primeiro acesso. Outras diferenças de contrato vão para o relatório final.
- Um commit por tarefa, depois de `tsc`, lint e testes verdes.

## Review Focus

1. **Transferências no painel:** cada transferência gera uma DESPESA e uma RECEITA. Receitas, despesas e o gráfico da visão geral devem ignorar transações com `transferenciaId != null`; senão o mês parece ter movimentado o dobro. Teste na Tarefa 6.
2. **Data de transação um dia antes:** a API converte `"AAAA-MM-DD"` em meia-noite UTC, que em Brasília aparece como 21h do dia anterior. O front envia data/hora ISO (`dataParaApi`). Testes nas Tarefas 3 e 7.
3. **Várias abas e vários `401` ao mesmo tempo:** só uma renovação por vez, e sempre com o refresh token lido do `localStorage` dentro do lock. Reutilizar um token antigo derruba todas as sessões. Teste na Tarefa 3.
4. **Valor digitado em pt-BR:** `1.234,56`, `150,5`, `150.5`, `R$ 10`, espaços. Entrada ambígua ou com 3 casas é recusada, não arredondada. Testes na Tarefa 3.
5. **Listas com mais de uma página nos selects:** contas e categorias podem passar de 100 (limite máximo da API). Selects e saldos usam `buscarTodas`, que percorre as páginas. Teste na Tarefa 3.

---

## Mapa de arquivos

```
BACK
  src/autenticacao/services/auth.service.ts     + precisaDeAdmin, criarPrimeiroAdmin
  src/autenticacao/schemas/auth.schema.ts       + primeiroAdminSchema
  src/autenticacao/controllers/auth.controller.ts + status, primeiroAdmin
  src/autenticacao/routes/auth.routes.ts        + GET /status, POST /primeiro-admin
  tests/primeiroAcesso.test.ts                  novo
  README.md                                     rotas novas

FRONT
  index.html, vite.config.ts, eslint.config.js, tsconfig*.json, package.json
  src/main.tsx            providers (QueryClient, Auth, Router, Toaster)
  src/App.tsx             tabela de rotas
  src/index.css           @import tailwindcss, @theme, base
  src/test/setup.ts       jest-dom, TZ, limpeza de localStorage
  src/test/fetch.ts       mockFetch
  src/test/render.tsx     renderApp
  src/lib/cn.ts  tipos.ts  dinheiro.ts  datas.ts  erros.ts  api.ts  auth.tsx  queryClient.ts  titulo.ts
  src/components/ui/      Button Input Field CampoValor Select Dialog ConfirmDialog Badge
                          Table Skeleton Empty Pagination Card PageHeader
  src/layouts/AppLayout.tsx  RotaProtegida.tsx
  src/features/login/            PaginaLogin FormLogin FormPrimeiroAdmin LetreiroMarca
  src/features/visao-geral/      PaginaVisaoGeral usePainel calculos GraficoFluxo
  src/features/transacoes/       PaginaTransacoes FormTransacao useTransacoes
  src/features/transferencias/   PaginaTransferencias FormTransferencia useTransferencias
  src/features/compromissos/     PaginaCompromissos FormCompromisso FormBaixa config useCompromissos
  src/features/contas-pagar/     PaginaContasPagar (config + PaginaCompromissos)
  src/features/contas-receber/   PaginaContasReceber
  src/features/contas/           PaginaContas FormConta useContas
  src/features/categorias/       PaginaCategorias FormCategoria useCategorias
  src/features/configuracoes/    PaginaConfiguracoes FormSenha SecaoUsuarios FormUsuario
  src/features/nao-encontrada/   PaginaNaoEncontrada
  README.md
```

`features/compromissos/` é a tela compartilhada de contas a pagar e a receber; as pastas `contas-pagar/` e `contas-receber/` só passam a configuração.

---

### Tarefa 1: Back-end — primeiro acesso

**Files (BACK):**
- Modify: `src/autenticacao/schemas/auth.schema.ts`
- Modify: `src/autenticacao/services/auth.service.ts`
- Modify: `src/autenticacao/controllers/auth.controller.ts`
- Modify: `src/autenticacao/routes/auth.routes.ts`
- Modify: `README.md` (tabela de autenticação)
- Test: `tests/primeiroAcesso.test.ts`

**Interfaces:**
- Produces (HTTP):
  - `GET /auth/status` → `200 { precisaAdmin: boolean }`.
  - `POST /auth/primeiro-admin` `{ email, senha }` → `201 { accessToken, refreshToken }` | `409 { erro: "JÁ EXISTE UM ADMINISTRADOR" }` | `409 { erro: "USUÁRIO JÁ EXISTE" }` | `400 { erro: "DADOS INVÁLIDOS", detalhes }`.
- Produces (TS): `precisaDeAdmin(): Promise<boolean>`; `criarPrimeiroAdmin(dados: { email: string; senha: string }): Promise<{ accessToken: string; refreshToken: string } | { erro: "JÁ EXISTE UM ADMINISTRADOR" | "USUÁRIO JÁ EXISTE" }>`; `primeiroAdminSchema`.

- [ ] **Passo 1: Escrever os testes que falham** em `tests/primeiroAcesso.test.ts`. O `beforeEach` de `tests/setup.ts` cria `admin@teste.com` (ADMIN); os testes "sem admin" começam com `await prisma.usuario.deleteMany()`.

```ts
describe("Primeiro acesso", () => {
  it("status: true sem ADMIN (mesmo com USUARIO), false com ADMIN", async () => {
    expect((await apiSemToken().get("/auth/status")).body).toEqual({ precisaAdmin: false });
    await prisma.usuario.deleteMany();
    await criarUsuarioLogado("comum@x.com", "USUARIO");
    expect((await apiSemToken().get("/auth/status")).body).toEqual({ precisaAdmin: true });
  });

  it("cria o ADMIN sem token e devolve tokens que funcionam", async () => {
    await prisma.usuario.deleteMany();
    const res = await apiSemToken().post("/auth/primeiro-admin")
      .send({ email: "  Dono@Email.com ", senha: "segredo123" });
    expect(res.status).toBe(201);
    const me = await apiCom(res.body.accessToken).get("/auth/me");
    expect(me.body).toMatchObject({ email: "dono@email.com", papel: "ADMIN" });
    expect((await apiSemToken().post("/auth/refresh")
      .send({ refreshToken: res.body.refreshToken })).status).toBe(200);
  });

  it("409 JÁ EXISTE UM ADMINISTRADOR quando já há ADMIN", async () => {
    const res = await apiSemToken().post("/auth/primeiro-admin")
      .send({ email: "outro@x.com", senha: "segredo123" });
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ erro: "JÁ EXISTE UM ADMINISTRADOR" });
  });

  it("409 USUÁRIO JÁ EXISTE quando o e-mail é de um USUARIO", async () => { /* deleteMany, criarUsuarioLogado("comum@x.com"), POST com esse e-mail */ });

  it("400 com senha curta, com detalhes", async () => { /* deleteMany, senha "1234" → 400, body.erro "DADOS INVÁLIDOS", detalhes[0].path == ["senha"] */ });

  it("ignora papel no corpo e cria ADMIN", async () => { /* body { email, senha, papel: "USUARIO" } → /auth/me.papel == "ADMIN" */ });

  it("dois pedidos ao mesmo tempo criam só um ADMIN", async () => {
    await prisma.usuario.deleteMany();
    const [a, b] = await Promise.all([
      apiSemToken().post("/auth/primeiro-admin").send({ email: "a@x.com", senha: "segredo123" }),
      apiSemToken().post("/auth/primeiro-admin").send({ email: "b@x.com", senha: "segredo123" }),
    ]);
    expect([a.status, b.status].sort()).toEqual([201, 409]);
    expect(await prisma.usuario.count({ where: { papel: "ADMIN" } })).toBe(1);
  });
});
```

- [ ] **Passo 2: Rodar e ver falhar**
Run (BACK): `npx vitest run tests/primeiroAcesso.test.ts`
Expected: FAIL, rotas respondem `401 TOKEN NÃO ENVIADO` (caem depois de `app.use(autenticar)`) ou `404`.

- [ ] **Passo 3: Implementar**
- `primeiroAdminSchema = z.object({ email: emailSchema, senha: novaSenhaSchema })` (mesmas regras do cadastro, sem `papel`; Zod descarta chaves extras).
- `precisaDeAdmin()`: `(await prisma.usuario.count({ where: { papel: "ADMIN" } })) === 0`.
- `criarPrimeiroAdmin`: hash bcrypt **antes** da transação (não segurar o lock durante o hash). Dentro de `prisma.$transaction(async (tx) => …)`:
  1. `await tx.$executeRaw\`SELECT pg_advisory_xact_lock(7428301)\`` (constante literal, sem interpolação);
  2. conta ADMINs → se > 0, `{ erro: "JÁ EXISTE UM ADMINISTRADOR" }`;
  3. procura o e-mail → se existe, `{ erro: "USUÁRIO JÁ EXISTE" }`;
  4. cria com `papel: "ADMIN"`; devolve `{ accessToken: gerarAccessToken(usuario), refreshToken: await gerarRefreshToken(usuario.id, tx) }`.
  Comentário curto explicando o lock (serializa pedidos simultâneos; liberado no commit).
- Controllers `status` e `primeiroAdmin` no padrão dos existentes (`validar` + `responderErro`; `statusDoErro` já dá 409 para os dois códigos).
- Rotas, na seção "Públicas": `authRotas.get("/status", status)` e `authRotas.post("/primeiro-admin", limitadorLoginPorIp, primeiroAdmin)`.
- README: acrescentar as duas rotas e o risco ("enquanto não há ADMIN, quem acessar primeiro vira ADMIN; em produção, criar o admin logo após o deploy").

- [ ] **Passo 4: Rodar tudo**
Run (BACK): `npm run check && npm test`
Expected: tipos ok; todos os testes passam (89 antigos + 7 novos).

- [ ] **Passo 5: Commit (BACK)**
`git add src/autenticacao tests/primeiroAcesso.test.ts README.md && git commit -m "feat(auth): rotas de primeiro acesso para criar o ADMIN"`

---

### Tarefa 2: Scaffold do front

**Files (FRONT):** `package.json`, `index.html`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `eslint.config.js`, `.gitignore`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/vite-env.d.ts`, `src/lib/cn.ts`, `src/test/setup.ts`
- Test: `src/lib/cn.test.ts`

**Interfaces:**
- Produces: `cn(...classes: ClassValue[]): string` (`twMerge(clsx(...))`); classes Tailwind dos tokens (`bg-noite`, `text-nevoa`, `border-linha`, `font-mono`, `font-serif`...); scripts `dev`, `build`, `lint`, `test`, `check`.

- [ ] **Passo 1: Gerar o projeto fora do repositório.** O FRONT já tem `.git` e `docs/`, e o `create-vite` pode esvaziar a pasta. Gerar em `<scratchpad>/scaffold` com `npm create vite@latest scaffold -- --template react-ts` e copiar para o FRONT tudo menos `.git` e `README.md`. Confirmar que `docs/` continua lá.

- [ ] **Passo 2: Instalar dependências**
```bash
npm i react-router @tanstack/react-query radix-ui recharts lucide-react sonner clsx tailwind-merge \
  @fontsource-variable/geist @fontsource-variable/geist-mono @fontsource/instrument-serif
npm i -D tailwindcss @tailwindcss/vite vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

- [ ] **Passo 3: Configurar**
- `vite.config.ts`: plugins `react()` e `tailwindcss()`; `server.proxy["/api"] = { target: "http://localhost:3000", changeOrigin: true, rewrite: (p) => p.replace(/^\/api/, "") }`; bloco `test: { environment: "jsdom", setupFiles: ["src/test/setup.ts"], css: false }` (importar `defineConfig` de `vitest/config`).
- Plugin local `cspNoBuild` (`apply: "build"`, `transformIndexHtml`) que insere `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'">`. Só no build: no dev o HMR usa script inline. `'unsafe-inline'` em estilo é exigido pelo Recharts.
- `index.html`: `lang="pt-BR"`, `<title>Fluxo</title>`, `<meta name="theme-color" content="#060807">`, `<meta name="color-scheme" content="dark">`.
- `src/index.css`: `@import "tailwindcss";`, `@theme` com as cores do Global Constraints e `--font-sans: "Geist Variable", system-ui, sans-serif; --font-mono: "Geist Mono Variable", ui-monospace, monospace; --font-serif: "Instrument Serif", Georgia, serif;`. `@layer base`: `body { @apply bg-noite text-nevoa font-sans antialiased; }`, `:focus-visible { outline: 2px solid var(--color-verde); outline-offset: 2px; }`, `@media (prefers-reduced-motion: reduce) { *, ::before, ::after { animation-duration: .01ms !important; transition-duration: .01ms !important; } }`. Utilitários `.kicker` e `.rotulo` copiados de `Login.dc.html`.
- `src/main.tsx`: importar `@fontsource-variable/geist`, `@fontsource-variable/geist-mono`, `@fontsource/instrument-serif/400-italic.css` e `index.css`.
- `tsconfig.app.json`: `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`; `types: ["vitest/globals"]` não é necessário (testes importam de `vitest`).
- `package.json` scripts: `"dev": "vite"`, `"build": "tsc -b && vite build"`, `"check": "tsc -b"`, `"lint": "eslint ."`, `"test": "vitest run"`.
- `src/test/setup.ts`: `import "@testing-library/jest-dom/vitest"`; `process.env.TZ = "America/Sao_Paulo"`; `afterEach(() => { cleanup(); localStorage.clear(); vi.unstubAllGlobals(); })`.
- `src/App.tsx` provisório: tela "Fluxo" com o kicker e o título serif, para ver as fontes e cores.

- [ ] **Passo 4: Teste do `cn`** em `src/lib/cn.test.ts`: `expect(cn("px-2", false && "x", "px-4")).toBe("px-4")`.

- [ ] **Passo 5: Verificar**
Run (FRONT): `npm run check && npm run lint && npm test && npm run build`
Expected: tudo sem erro; `dist/index.html` contém `Content-Security-Policy`.

- [ ] **Passo 6: Commit** `chore: scaffold Vite + React + Tailwind v4 com tokens Fluxo`

---

### Tarefa 3: Base — `lib/`, sessão, rotas protegidas e layout

**Files (FRONT):**
- Create: `src/lib/tipos.ts`, `dinheiro.ts`, `datas.ts`, `erros.ts`, `api.ts`, `auth.tsx`, `queryClient.ts`, `titulo.ts`
- Create: `src/layouts/AppLayout.tsx`, `src/layouts/RotaProtegida.tsx`, `src/features/nao-encontrada/PaginaNaoEncontrada.tsx`
- Create: `src/test/fetch.ts`, `src/test/render.tsx`
- Modify: `src/main.tsx`, `src/App.tsx`
- Test: `src/lib/dinheiro.test.ts`, `datas.test.ts`, `erros.test.ts`, `api.test.ts`, `src/layouts/RotaProtegida.test.tsx`

**Interfaces (Produces):**

`tipos.ts` (todos os valores de dinheiro são `string` com 2 casas; datas são `string` ISO):
- `Papel = "ADMIN" | "USUARIO"`; `TipoTransacao = "RECEITA" | "DESPESA"`
- `Usuario { id: number; email: string; papel: Papel; criadoEm: string }`
- `Conta { id; nome; saldoInicial; criadoEm }`; `Saldo { contaId; saldoInicial; totalReceitas; totalDespesas; saldoAtual }`
- `Categoria { id; nome; tipo: TipoTransacao }`
- `Transacao { id; descricao; valor; tipo; data; contaId; categoriaId; pagamentoContaPagarId: number | null; recebimentoId: number | null; transferenciaId: number | null; conta: { id; nome }; categoria: { id; nome; tipo } }`
- `Transferencia { id; valor; descricao; data; contaOrigemId; contaDestinoId; transacoes: { id; tipo; contaId }[] }`
- `ContaPagar { id; descricao; valorTotal; valorPago; vencimento; status: "PENDENTE" | "PARCIALMENTE_PAGA" | "PAGA"; criadoEm }`
- `ContaReceber { id; descricao; valorTotal; valorRecebido; vencimento; status: "PENDENTE" | "PARCIALMENTE_RECEBIDA" | "RECEBIDA"; criadoEm }`
- `Pagina<T> { itens: T[]; pagina: number; totalPaginas: number; total: number }`
- `Tokens { accessToken: string; refreshToken: string }`

`dinheiro.ts`:
- `paraCentavos(valor: string): number` — sem `parseFloat`; separa inteiro e decimais.
- `deCentavos(centavos: number): string` — `15050 → "150.50"`, `-500 → "-5.00"`.
- `formatarBRL(centavos: number): string` — `Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })`.
- `formatarValor(valor: string): string` — `formatarBRL(paraCentavos(valor))`.
- `lerValorDigitado(texto: string): string | null` — aceita prefixo `R$` e espaços; com `,` → `.` é milhar e `,` é decimal; sem `,` → um único `.` seguido de 1–2 dígitos no fim é decimal, senão `.` é milhar. Recusa (null): vazio, letras, sinal, mais de 2 casas, mais de 10 dígitos inteiros, grupos de milhar mal formados (`1.23.4`).

`datas.ts`:
- `formatarVencimento(iso: string): string` — `dd/mm/aaaa` com `timeZone: "UTC"`.
- `formatarData(iso: string): string` — `dd/mm/aaaa` no fuso local; `formatarDataCurta(iso)` → `"07 nov"` local.
- `hojeLocal(agora = new Date()): string` — `"AAAA-MM-DD"` local (padrão do `<input type="date">`).
- `dataParaApi(dia: string, agora = new Date()): string` — se `dia === hojeLocal(agora)` → `agora.toISOString()`; senão o meio-dia local desse dia em ISO. Nunca envia `"AAAA-MM-DD"` puro.
- `diaLocalDe(iso: string): string` — inverso, para preencher o formulário de edição.
- `diasAteVencimento(iso: string, agora = new Date()): number` — dia UTC do vencimento menos o dia local de hoje (negativo = vencida).
- `mesLocal(iso: string): string` — `"AAAA-MM"` no fuso local.

`erros.ts`:
- `class ErroApi extends Error { status: number; codigo: string; detalhes: { path: (string | number)[]; message: string }[] }`. `status 0` = falha de rede.
- `mensagemDoErro(e: unknown): string` — por status primeiro: `0` → "Sem conexão com o servidor."; `403` → "Você não tem permissão para isso."; `429` → "Muitas tentativas. Aguarde alguns minutos."; `codigo === "CONFLITO DE CONCORRÊNCIA, TENTE NOVAMENTE"` → "Outra pessoa alterou este registro. Tente de novo."; depois a tabela `MENSAGENS`; senão o código com só a primeira letra maiúscula (`"CONTA NÃO ENCONTRADA"` → "Conta não encontrada"). Erro que não é `ErroApi` → "Algo deu errado. Tente de novo."
- `MENSAGENS` mínimo: `SALDO INSUFICIENTE` → "Saldo insuficiente nesta conta."; `SALDO INSUFICIENTE NA CONTA DE DESTINO` → "A conta de destino ficaria negativa."; `USUÁRIO OU SENHA INCORRETOS` → "E-mail ou senha incorretos."; `USUÁRIO JÁ EXISTE` → "Já existe um usuário com este e-mail."; `JÁ EXISTE UM ADMINISTRADOR` → "O administrador já foi criado. Entre com seu e-mail e senha."; `SENHA ATUAL INCORRETA` → "Senha atual incorreta."; `CATEGORIA EM USO` → "Esta categoria tem lançamentos e não pode ser apagada."; `CATEGORIA EM USO NÃO PODE MUDAR DE TIPO` → "Esta categoria tem lançamentos e não pode mudar de tipo."; `CATEGORIA JÁ EXISTE` → "Já existe uma categoria com esse nome."; `NOME DE CATEGORIA RESERVADO PELO SISTEMA` → "Esse nome é usado pelo sistema. Escolha outro."; `CONTA POSSUI MOVIMENTAÇÕES` → "Esta conta tem movimentações e não pode ser apagada."; `CONTA A PAGAR POSSUI PAGAMENTOS` / `CONTA A RECEBER POSSUI RECEBIMENTOS` → "Já há pagamentos/recebimentos registrados; não dá para apagar."; `PAGAMENTO MAIOR QUE O SALDO PENDENTE` / `RECEBIMENTO MAIOR QUE O SALDO PENDENTE` → "O valor passa do que falta pagar/receber."; `VALOR TOTAL MENOR QUE O JÁ PAGO` / `…RECEBIDO` → "O total não pode ser menor que o já pago/recebido."; `NÃO É POSSÍVEL REMOVER O ÚLTIMO ADMIN` → "É preciso manter pelo menos um administrador."; `CATEGORIA NÃO É DO TIPO …` → "A categoria não combina com o tipo do lançamento.". Lista completa de códigos: `grep -rhoE 'erro: "[^"]+"' BACK/src`.
- `separarErros(e: unknown): { campos: Record<string, string>; geral: string | null }` — `400` com `detalhes` → `campos[path[0]] = message` (primeira mensagem por campo) e `geral = null`; resto → `campos = {}` e `geral = mensagemDoErro(e)`.

`api.ts`:
- `requisicao<T>(caminho: string, opcoes?: { metodo?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; corpo?: unknown; query?: Record<string, string | number | boolean | undefined>; publica?: boolean }): Promise<T>` — base `import.meta.env.VITE_API_URL ?? "/api"`; JSON; `204` → `undefined`; erro → `ErroApi` com `codigo = body.erro`; falha de `fetch` → `ErroApi(0, "SEM CONEXÃO")`.
- Rota não pública: sem access token e com refresh salvo, renova antes. `401` com `codigo` `TOKEN INVÁLIDO OU EXPIRADO` ou `TOKEN NÃO ENVIADO` → `renovarSessao()` e repete **uma** vez; se renovar falhar → `limparSessao()`, avisa os ouvintes e lança `ErroApi(401)`. Outro `401` (ex.: `SENHA ATUAL INCORRETA`) vira `ErroApi` comum, sem renovar.
- `renovarSessao(): Promise<boolean>` — uma promessa em voo por aba (chamadas simultâneas esperam a mesma). Dentro de `navigator.locks.request("fluxo-refresh", …)` quando existir (senão roda direto): lê `localStorage["fluxo.refresh"]` **naquele momento**; ausente → `false`; `POST /auth/refresh`; `200` → `definirSessao`; `401` → `false`; falha de rede → lança `ErroApi(0)` sem apagar a sessão.
- `definirSessao(t: Tokens): void`, `limparSessao(): void`, `temSessao(): boolean`, `lerRefreshToken(): string | null`.
- `aoPerderSessao(cb: () => void): () => void` — também dispara no evento `storage` quando outra aba apaga `fluxo.refresh` (e zera o access token desta aba).
- `normalizarPagina<T>(resposta: Record<string, unknown>, chave: string): Pagina<T>` — usa `totalPaginas ?? totalPagina`.
- `buscarTodas<T>(caminho: string, chave: string, query?: Record<string, …>, paginacao: "page" | "pagina" = "page"): Promise<T[]>` — `limit/limite = 100`, percorre até `totalPaginas`, teto de 20 páginas.

`auth.tsx`:
- `AuthProvider`; `useAuth(): { usuario: Usuario | null; carregando: boolean; ehAdmin: boolean; entrar(email: string, senha: string): Promise<void>; criarPrimeiroAdmin(email: string, senha: string): Promise<void>; sair(): Promise<void>; recarregarUsuario(): Promise<void> }`.
- Na montagem: com `temSessao()`, `GET /auth/me`; sem, `carregando = false`. `entrar`/`criarPrimeiroAdmin` chamam a rota pública, `definirSessao`, depois `/auth/me`. `sair`: `POST /auth/logout` (público, ignora erro), `limparSessao`, `queryClient.clear()`. Ouvinte de `aoPerderSessao`: zera usuário, limpa cache e mostra toast "Sua sessão expirou. Entre de novo." só se havia usuário.

`queryClient.ts`:
- `queryClient` com `staleTime: 30_000`, `refetchOnWindowFocus: true`, `retry` só para `status 0` ou `≥ 500`, no máximo 2.
- `chaves = { me, statusAuth, contas, saldos, categorias, transacoes, transferencias, contasPagar, contasReceber, painel, usuarios }` (cada uma `readonly string[]`).
- `invalidarLancamento(): Promise<void>` — invalida `transacoes`, `saldos`, `painel`, `transferencias`, `contasPagar`, `contasReceber`.

`titulo.ts`: `useTitulo(tela: string): void` → `document.title = \`${tela} — Fluxo\``.

Layout e rotas:
- `RotaProtegida`: `carregando` → tela cheia com spinner (`role="status"`, "Carregando…"); sem usuário → `<Navigate to="/entrar" state={{ de: location }} replace />`; senão `<Outlet />`.
- `AppLayout`: link "Pular para o conteúdo"; sidebar de `Main.dc.html` (logo Fluxo, itens com ícones lucide: Visão geral `/`, Transações `/transacoes`, Transferências `/transferencias`, Contas a pagar `/contas-a-pagar`, Contas a receber `/contas-a-receber`, Contas `/contas`, Categorias `/categorias`, Configurações `/configuracoes`; item ativo via `NavLink`); rodapé com e-mail, papel e "Sair". Abaixo de `lg`: barra no topo com botão de menu que abre a sidebar numa gaveta (Radix Dialog, fecha ao navegar). `<main id="conteudo">` com `<Outlet />`.
- `App.tsx`: exporta `rotas: RouteObject[]` e o `createBrowserRouter(rotas)`;  `/entrar` (provisório até a Tarefa 5) fora do layout; demais rotas dentro de `RotaProtegida` > `AppLayout`, com páginas provisórias "Em construção" até cada tarefa; `*` → `PaginaNaoEncontrada`. Conferir a API do React Router 8 no Context7 antes de escrever.
- `main.tsx`: `QueryClientProvider` > `AuthProvider` > `RouterProvider`, mais `<Toaster theme="dark" position="top-right" richColors />`.

Ajudantes de teste:
- `mockFetch(rotas: Record<string, (req: { metodo: string; corpo: unknown; headers: Headers }) => { status: number; corpo?: unknown }>)` — chave `"GET /auth/me"` (caminho sem `/api` e sem query); rota não cadastrada falha o teste. Devolve o `vi.fn` para inspecionar chamadas.
- `renderApp(opcoes: { rota: string; usuario?: Usuario | null; api?: RotasMock }): RenderResult & { fetch: Mock }` — monta a tabela `rotas` exportada de `App.tsx` num `createMemoryRouter`, com `QueryClient` novo (`retry: false`), `AuthProvider` e `Toaster`. Com `usuario`, chama `definirSessao({ accessToken: "A-teste", refreshToken: "R-teste" })` e acrescenta `"GET /auth/me"` às rotas do `mockFetch`. Todos os testes de tela usam este ajudante; testes de componente (Tarefa 4) renderizam direto.
- Para fixar "hoje": `vi.useFakeTimers({ toFake: ["Date"] })` + `vi.setSystemTime(...)` (só `Date`, para não travar o `userEvent`).

- [ ] **Passo 1: Testes de `dinheiro` e `datas` que falham**

```ts
it.each([
  ["1.234,56", "1234.56"], ["150,5", "150.50"], ["150.5", "150.50"], ["1.234", "1234.00"],
  ["  42 ", "42.00"], ["R$ 10,00", "10.00"], ["0,99", "0.99"], ["1.234.567,8", "1234567.80"],
])("lerValorDigitado(%s) = %s", (entrada, saida) => expect(lerValorDigitado(entrada)).toBe(saida));

it.each(["", "abc", "-5", "1,234", "12345678901", "1.23.4", "10,5,1"])(
  "lerValorDigitado recusa %s", (entrada) => expect(lerValorDigitado(entrada)).toBeNull());

it("centavos sem erro de ponto flutuante", () => {
  expect(paraCentavos("0.10") + paraCentavos("0.20")).toBe(30);
  expect(deCentavos(paraCentavos("1234.56"))).toBe("1234.56");
  expect(formatarBRL(123456).replace(/\s/g, " ")).toBe("R$ 1.234,56");
});

it("vencimento em UTC não volta um dia em Brasília", () =>
  expect(formatarVencimento("2026-11-07T00:00:00.000Z")).toBe("07/11/2026"));

it("dataParaApi: hoje usa o instante atual; outro dia usa meio-dia local", () => {
  const agora = new Date("2026-11-07T18:30:00.000Z"); // 15h30 em Brasília
  expect(dataParaApi("2026-11-07", agora)).toBe(agora.toISOString());
  expect(dataParaApi("2026-11-01", agora)).toBe("2026-11-01T15:00:00.000Z");
  expect(formatarData(dataParaApi("2026-11-01", agora))).toBe("01/11/2026");
});

it("diasAteVencimento compara dia UTC do vencimento com o dia local de hoje", () => {
  const agora = new Date("2026-11-08T01:00:00.000Z"); // 07/11 22h em Brasília
  expect(diasAteVencimento("2026-11-07T00:00:00.000Z", agora)).toBe(0);
  expect(diasAteVencimento("2026-11-06T00:00:00.000Z", agora)).toBe(-1);
});
```

- [ ] **Passo 2: Testes de `erros` que falham** — `mensagemDoErro` para `ErroApi(0)`, `403`, `429`, conflito de concorrência, `SALDO INSUFICIENTE`, código sem mapa (`"CONTA NÃO ENCONTRADA"` → "Conta não encontrada"); `separarErros` com `400` + `detalhes: [{ path: ["valor"], message: "Valor inválido" }]` → `{ campos: { valor: "Valor inválido" }, geral: null }`.

- [ ] **Passo 3: Testes de `api` que falham** (com `mockFetch`):
  - `"envia Bearer, JSON e query sem undefined"`: `requisicao("/transacao", { query: { tipo: "RECEITA", contaId: undefined } })` chama `/api/transacao?tipo=RECEITA` com `Authorization: Bearer A1`.
  - `"duas chamadas com 401 renovam uma vez só e repetem"`: `/contas` responde `401` enquanto o token é `A1` e `200` com `A2`; `POST /auth/refresh` devolve `{ accessToken: "A2", refreshToken: "R2" }`. `Promise.all` de duas chamadas → as duas resolvem; refresh chamado 1 vez; `localStorage["fluxo.refresh"] === "R2"`.
  - `"usa o refresh token lido dentro do lock"`: `navigator.locks.request` falso que, antes de rodar o callback, grava `"R9"` no `localStorage` → o corpo do refresh tem `refreshToken: "R9"`; lock pedido com o nome `"fluxo-refresh"`.
  - `"renovação recusada limpa a sessão e avisa"`: refresh `401` → ouvinte de `aoPerderSessao` chamado, `temSessao() === false`, erro `ErroApi` com `status 401`.
  - `"falha de rede na renovação não apaga a sessão"`: `fetch` rejeita no refresh → `ErroApi(0)`, `temSessao() === true`.
  - `"logout em outra aba derruba esta"`: `window.dispatchEvent(new StorageEvent("storage", { key: "fluxo.refresh", newValue: null }))` → ouvinte chamado.
  - `"204 devolve undefined"`.
  - `"401 que não é de token não renova"`: `PUT /auth/senha` → `401 { erro: "SENHA ATUAL INCORRETA" }` → `ErroApi` com esse código; refresh não chamado; `temSessao() === true`.
  - `"normalizarPagina aceita totalPaginas e totalPagina"`: `{ contaReceber: [x], pagina: 2, total: 11, totalPagina: 2 }` → `{ itens: [x], pagina: 2, totalPaginas: 2, total: 11 }`.
  - `"buscarTodas percorre as páginas"`: 3 páginas de `/categoria` com `limit=100` → array com os itens das 3, na ordem; com `"pagina"` usa `pagina`/`limite` na query.

- [ ] **Passo 4: Rodar e ver falhar** — `npx vitest run src/lib` → FAIL (módulos não existem).

- [ ] **Passo 5: Implementar `lib/`** conforme as interfaces acima.

- [ ] **Passo 6: Rodar** — `npx vitest run src/lib` → PASS.

- [ ] **Passo 7: Teste de rota protegida que falha** em `src/layouts/RotaProtegida.test.tsx`: sem sessão, `renderApp({ rota: "/transacoes" })` mostra a tela de entrar; com `usuario` ADMIN mostra o link "Transações" ativo na sidebar.

- [ ] **Passo 8: Implementar layout, rotas, `main.tsx` e ajudantes de teste**; rodar `npm run check && npm run lint && npm test` → PASS.

- [ ] **Passo 9: Commit** `feat: base do app (api, sessão, erros, dinheiro, datas, layout e rotas)`

---

### Tarefa 4: Componentes de UI

**Files (FRONT):** `src/components/ui/{Button,Input,Field,CampoValor,Select,Dialog,ConfirmDialog,Badge,Table,Skeleton,Empty,Pagination,Card,PageHeader}.tsx`, `src/components/ui/index.ts`
- Test: `src/components/ui/ui.test.tsx`

**Interfaces (Produces):** todos aceitam `className` e repassam props nativas.
- `Button({ variante?: "primario" | "secundario" | "fantasma" | "perigo"; tamanho?: "md" | "sm" | "icone"; carregando?: boolean })` — pílula, `min-h-10`; primário verde com glow no hover (`verde-claro`); `carregando` desabilita, mostra spinner e põe `aria-busy`. Ícone sozinho exige `aria-label`.
- `Input` — estilo de `Login.dc.html`; `aria-invalid` deixa a borda coral.
- `Field({ rotulo: string; erro?: string; dica?: string; children: (props: { id: string; "aria-invalid"?: true; "aria-describedby"?: string }) => ReactNode })` — gera `id` com `useId`, liga rótulo, dica e erro (erro com `role="alert"`, coral).
- `CampoValor({ valor: string; aoMudar(texto: string): void; ...InputProps })` — `inputMode="decimal"`, prefixo "R$", alinhado à direita, `font-mono tabular-nums`. Guarda o texto digitado; quem valida é o formulário com `lerValorDigitado`.
- `Select` — `<select>` nativo estilizado (melhor no celular e no teclado), seta lucide.
- `Dialog({ aberto; aoMudar(aberto: boolean): void; titulo: string; descricao?: string; children; rodape?: ReactNode })` — Radix Dialog; no celular vira folha de baixo.
- `ConfirmDialog({ aberto; aoMudar; titulo; descricao; textoConfirmar: string; perigo?: boolean; carregando?: boolean; aoConfirmar(): void })` — Radix AlertDialog; foco inicial em "Cancelar".
- `Badge({ tom: "verde" | "coral" | "ambar" | "neutro" })` — mono, caixa alta. `ambar` é o tom de "vence logo" dos mockups de contas.
- `Table`, `THead`, `TBody`, `Tr`, `Th`, `Td({ numero?: boolean })` — `Table` envolve num `div` com `overflow-x-auto`; `numero` alinha à direita com `tabular-nums`.
- `Skeleton` — bloco `animate-pulse` `bg-superficie-3`; `Empty({ icone: LucideIcon; titulo; texto?; acao?: ReactNode })`.
- `Pagination({ pagina: number; totalPaginas: number; aoMudar(p: number): void })` — "Página X de Y", Anterior/Próxima; não renderiza nada com `totalPaginas <= 1`.
- `Card` — `bg-superficie border border-linha rounded-2xl`; `PageHeader({ kicker: string; titulo: string; destaque?: string; acoes?: ReactNode })` — `destaque` em serif itálico, como nos mockups.

- [ ] **Passo 1: Testes que falham**
  - `Field` liga rótulo e erro: `getByLabelText("Valor")` tem `aria-invalid="true"` e `toHaveAccessibleDescription("Valor inválido")`.
  - `Pagination` some com 1 página; com 3, clicar "Próxima" chama `aoMudar(2)`; na última, "Próxima" fica desabilitada.
  - `Button carregando` fica desabilitado e com `aria-busy="true"`.
  - `ConfirmDialog` aberto: clicar no botão de confirmar chama `aoConfirmar`; `Esc` chama `aoMudar(false)`.

- [ ] **Passo 2: Rodar e ver falhar** — `npx vitest run src/components` → FAIL.
- [ ] **Passo 3: Implementar os componentes**, com o visual dos mockups.
- [ ] **Passo 4: Rodar** — `npm run check && npm run lint && npm test` → PASS.
- [ ] **Passo 5: Commit** `feat(ui): componentes base no visual Fluxo`

---

### Tarefa 5: Login e primeiro acesso

**Files (FRONT):** `src/features/login/{PaginaLogin,FormLogin,FormPrimeiroAdmin,LetreiroMarca}.tsx`; modify `src/App.tsx`
- Test: `src/features/login/login.test.tsx`

**Interfaces:**
- Consumes: `useAuth().entrar/criarPrimeiroAdmin`, `requisicao`, `separarErros`, `chaves.statusAuth`, `Field`, `Input`, `Button`.
- Produces: rota `/entrar`.

Comportamento:
- Layout de `Login.dc.html`: painel da marca à esquerda (some abaixo de `lg`) com `LetreiroMarca` (letreiro de lançamentos fictícios, `aria-hidden`, parado com `prefers-reduced-motion`); formulário à direita.
- `useQuery(chaves.statusAuth, GET /auth/status, publica)`. Carregando → skeleton do formulário. Erro de rede → mensagem "Sem conexão com o servidor." e botão "Tentar de novo".
- `precisaAdmin: false` → só `FormLogin` (e-mail, senha, "Entrar"); nenhum link de cadastro.
- `precisaAdmin: true` → `FormPrimeiroAdmin`: kicker "Primeiro acesso", título "Criar conta de administrador", texto curto explicando que só acontece uma vez; campos e-mail, senha, confirmar senha. Validação no front: senha ≥ 8 caracteres e ≤ 72 bytes (`new TextEncoder().encode(s).length`), confirmação igual ("As senhas não conferem."). Erro `409 JÁ EXISTE UM ADMINISTRADOR` → toast com a mensagem mapeada e `invalidateQueries(chaves.statusAuth)` (volta para o login).
- Usuário já logado em `/entrar` → `Navigate` para `/`. Depois de entrar → `state.de?.pathname ?? "/"`.
- Erros: `separarErros` → `campos` embaixo de cada campo; `geral` dentro do formulário (`role="alert"`), não em toast, para `401` de login.
- `useTitulo("Entrar")`; `autoComplete` `email`, `current-password` / `new-password`.

- [ ] **Passo 1: Testes que falham**
  - `"sem admin no banco, mostra Criar conta de administrador"` (`GET /auth/status` → `{ precisaAdmin: true }`): heading "Criar conta de administrador" visível; botão "Entrar" ausente.
  - `"com admin, mostra só o login"`: botão "Entrar" visível; texto "Criar conta de administrador" ausente.
  - `"login com senha errada mostra o erro no formulário"`: `POST /auth/login` → `401 { erro: "USUÁRIO OU SENHA INCORRETOS" }` → `getByRole("alert")` com "E-mail ou senha incorretos.".
  - `"erro de campo da API aparece embaixo do campo"`: `POST /auth/primeiro-admin` → `400 { erro: "DADOS INVÁLIDOS", detalhes: [{ path: ["email"], message: "E-mail inválido" }] }` → campo "E-mail" com descrição acessível "E-mail inválido".
  - `"senhas diferentes não enviam o pedido"`: `fetch` de `POST /auth/primeiro-admin` não chamado; "As senhas não conferem." visível.
  - `"primeiro admin criado entra direto"`: `201` com tokens + `GET /auth/me` ADMIN → navega para `/` (texto da visão geral provisória).
- [ ] **Passo 2: Rodar e ver falhar**; **Passo 3: implementar**; **Passo 4:** `npm run check && npm run lint && npm test` → PASS.
- [ ] **Passo 5: Commit** `feat(login): login e primeiro acesso do administrador`

---

### Tarefa 6: Visão geral

**Files (FRONT):** `src/features/visao-geral/{PaginaVisaoGeral,GraficoFluxo}.tsx`, `usePainel.ts`, `calculos.ts`; `src/features/contas/useContas.ts` e `src/features/categorias/useCategorias.ts` (só as queries de leitura; o CRUD entra na Tarefa 9)
- Test: `src/features/visao-geral/calculos.test.ts`, `painel.test.tsx`

**Interfaces:**
- Consumes: `requisicao`, `buscarTodas`, `normalizarPagina`, `paraCentavos`, `mesLocal`, `diasAteVencimento`, `chaves.painel`, `chaves.saldos`.
- Produces:
  - `useContasTodas(): UseQueryResult<Conta[]>` (`buscarTodas("/contas", "contas")`, chave `chaves.contas`); `useSaldos(contas: Conta[]): UseQueryResult<Record<number, Saldo>>` (`GET /contas/:id/saldo` em paralelo, chave `[...chaves.saldos]`).
  - `useCategoriasTodas(tipo?: TipoTransacao): UseQueryResult<Categoria[]>` (`buscarTodas("/categoria", "categoria", { tipo })`, chave `[...chaves.categorias, tipo ?? "todas"]`).
  - `buscarTransacoesDaJanela(inicio: Date): Promise<{ itens: Transacao[]; parcial: boolean }>` — `GET /transacao?limit=100&page=N` desde 1; para quando a página acaba, quando o último item tem `data < inicio`, ou no teto de 10 páginas (`parcial = true` se ainda havia páginas). Descarta itens com `data < inicio`.
  - `resumirMeses(transacoes: Transacao[], agora: Date, meses = 6): { mes: string; rotulo: string; receitas: number; despesas: number }[]` — centavos, do mais antigo ao atual, meses sem movimento com zero, rótulo `"nov"`. Ignora `transferenciaId != null`.
  - `variacao(atual: number, anterior: number): number | null` — percentual; `null` se `anterior === 0`.
  - `proximosVencimentos(pagar: ContaPagar[], receber: ContaReceber[], agora: Date, dias = 15)` → `{ id; tipo: "pagar" | "receber"; descricao; restante: number; vencimento: string; diasAte: number }[]` — não quitadas, `diasAte <= dias` (vencidas incluídas), ordenadas por `diasAte`.
  - `usePainel()` → `{ saldoTotal: number; porConta: (Conta & { saldo: Saldo })[]; meses; mesAtual: { receitas; despesas; resultado; varReceitas; varDespesas; varResultado }; vencimentos; ultimas: Transacao[]; parcial: boolean }` com `isLoading`/`isError` do TanStack Query.

Tela (`Main.dc.html`): saldo total em destaque; cards de receitas, despesas e resultado do mês com variação (seta e cor; `null` → "—"); `GraficoFluxo` (Recharts, barras receitas verde × despesas coral, 6 meses, tooltip em BRL, aviso "Dados parciais" quando `parcial`); saldo por conta; próximos vencimentos com badge coral "Vencida há N dias", âmbar "Vence hoje"/"Em N dias"; últimas 8 transações com link "Ver todas". Skeletons por bloco. Sem contas → `Empty` "Cadastre sua primeira conta" com ação para `/contas` (só ADMIN vê o botão).
Antes do gráfico, carregar a skill `dataviz`.

- [ ] **Passo 1: Testes que falham** (`calculos.test.ts`)
  - `"agrupa por mês local e ignora transferências"`: RECEITA 100.00 em `2026-11-01T02:00:00Z` (31/10 em Brasília) e RECEITA 50.00 com `transferenciaId: 3` → outubro tem `receitas: 10000`, novembro `0`.
  - `"seis meses do mais antigo ao atual, com zeros"`: `agora = 2026-11-07` → `mes` de `"2026-06"` a `"2026-11"`.
  - `"variacao com mês anterior zero é null"`; `variacao(150, 100) === 50`.
  - `"proximosVencimentos inclui vencidas, exclui quitadas e as que vencem depois de 15 dias"`.
  - `"buscarTransacoesDaJanela para ao passar do início"`: página 1 com datas recentes e a última anterior a `inicio` → busca só 1 página, `parcial: false`, itens antigos fora. Teto: 12 páginas recentes → 10 pedidos, `parcial: true`.
- [ ] **Passo 2:** teste de tela (`painel.test.tsx`): com dados mockados, mostra "R$ 1.500,00" de saldo total (duas contas `1000.00` + `500.00`) e "Vencida há 2 dias".
- [ ] **Passo 3: Rodar e ver falhar**; **Passo 4: implementar**; **Passo 5:** `npm run check && npm run lint && npm test` → PASS.
- [ ] **Passo 6: Commit** `feat(painel): visão geral com saldos, fluxo de 6 meses e vencimentos`

---

### Tarefa 7: Transações e transferências

**Files (FRONT):** `src/features/transacoes/{PaginaTransacoes,FormTransacao}.tsx`, `useTransacoes.ts`; `src/features/transferencias/{PaginaTransferencias,FormTransferencia}.tsx`, `useTransferencias.ts`
- Test: `src/features/transacoes/transacoes.test.tsx`, `src/features/transferencias/transferencias.test.tsx`

**Interfaces:**
- Consumes: `requisicao`, `normalizarPagina`, `invalidarLancamento`, `lerValorDigitado`, `dataParaApi`, `diaLocalDe`, `separarErros`, `useAuth().ehAdmin`, `useContasTodas`, `useSaldos`, `useCategoriasTodas` (Tarefa 6), componentes de UI.
- Produces:
  - `ehManual(t: Transacao): boolean` — os três ids de origem são `null`.

Transações (`Transacoes.dc.html`):
- Filtros tipo / conta / categoria e `page` na URL (`useSearchParams`); mudar filtro volta à página 1. `GET /transacao` com `page`, `limit=20`, filtros.
- Tabela: data (`formatarData`), descrição (com badge "Pagamento", "Recebimento" ou "Transferência" quando automática), categoria, conta, valor com sinal e cor (verde receita, coral despesa).
- "Novo lançamento" para todos os papéis. Editar/Apagar só com `ehAdmin && ehManual(t)`.
- `FormTransacao({ aberto; aoMudar; transacao?: Transacao })`: tipo (dois botões RECEITA/DESPESA, `aria-pressed`), descrição, valor (`CampoValor`), conta, categoria (só do tipo escolhido; trocar o tipo limpa a categoria), data (`<input type="date">`, padrão `hojeLocal()`, máximo hoje). Corpo: `{ descricao, valor: lerValorDigitado(...), tipo, contaId, categoriaId, data: dataParaApi(dia) }`; na edição só manda `data` se o dia mudou. Valor inválido → erro no campo sem chamar a API.
- Prévia (só na criação, com conta e valor válidos): "Saldo após o lançamento: R$ X" usando `saldoAtual ± valor` em centavos; negativo fica coral com "A conta ficaria negativa.".
- Sucesso: toast "Lançamento salvo", fecha, `invalidarLancamento()`. Apagar: `ConfirmDialog` "Apagar lançamento?" → `DELETE /transacao/:id`.

Transferências (`Transferencias.dc.html`):
- `GET /transferencias?page&limit=20`. Colunas: data, descrição, "Origem → Destino" (nomes via `useContasTodas`), valor.
- `FormTransferencia`: origem, destino (sem a origem), valor, descrição opcional (vazia → não manda, a API usa "Transferência entre contas"). Prévia do saldo da origem.
- Estornar (ADMIN): `ConfirmDialog` "Estornar transferência? Os dois lançamentos serão apagados." → `DELETE /transferencias/:id`.

- [ ] **Passo 1: Testes que falham**
  - `"USUARIO não vê editar/apagar; ADMIN vê só em lançamento manual"`: duas linhas (manual e com `pagamentoContaPagarId: 1`); como USUARIO, nenhum botão "Editar"; como ADMIN, um "Editar" só.
  - `"categoria filtra pelo tipo"`: tipo DESPESA → opções só de categorias DESPESA.
  - `"erro de campo da API aparece no campo"`: `POST /transacao` → `400` com `detalhes: [{ path: ["descricao"], message: "Descrição muito grande" }]` → descrição acessível do campo "Descrição".
  - `"envia valor normalizado e data ISO"`: digitar `1.234,56` e dia de ontem → corpo `valor: "1234.56"` e `data` terminando em `T15:00:00.000Z`.
  - `"prévia mostra saldo negativo em coral"`: saldo `100.00`, DESPESA `150,00` → "A conta ficaria negativa.".
  - `"transferência não oferece a origem como destino"`.
  - `"SALDO INSUFICIENTE vira toast amigável"`: `POST /transferencias` → `409` → texto "Saldo insuficiente nesta conta.".
- [ ] **Passo 2: Rodar e ver falhar**; **Passo 3: implementar**; **Passo 4:** `npm run check && npm run lint && npm test` → PASS.
- [ ] **Passo 5: Commit** `feat: telas de transações e transferências`

---

### Tarefa 8: Contas a pagar e a receber

**Files (FRONT):** `src/features/compromissos/{PaginaCompromissos,FormCompromisso,FormBaixa}.tsx`, `config.ts`, `useCompromissos.ts`; `src/features/contas-pagar/PaginaContasPagar.tsx`; `src/features/contas-receber/PaginaContasReceber.tsx`
- Test: `src/features/compromissos/compromissos.test.tsx`

**Interfaces:**
- Consumes: `useContasTodas`, `useSaldos`, `useCategoriasTodas`, `invalidarLancamento`, `diasAteVencimento`, `formatarVencimento`, utilitários de dinheiro.
- Produces: `ConfigCompromisso` e as duas constantes `configPagar`, `configReceber`:

```ts
type ConfigCompromisso = {
  tela: "Contas a pagar" | "Contas a receber";
  recurso: "/contaPagar" | "/contaReceber";
  chaveLista: "contaPagar" | "contaReceber";
  paginacao: "page" | "pagina";               // contaPagar: page/limit; contaReceber: pagina/limite
  campoQuitado: "valorPago" | "valorRecebido";
  status: { pendente: string; parcial: string; quitado: string }; // valores do enum da API
  rotaBaixa: (id: number) => string;          // "/pagamentoPagar/contaPagar/:id" | "/contaReceber/:id/recebimentos"
  tipoCategoria: TipoTransacao;               // DESPESA | RECEITA
  textos: { novo: string; baixa: string; quitado: string; restante: string };
  chaveQuery: readonly string[];
};
```

Tela (`ContasPagar.dc.html`, `ContasReceber.dc.html`):
- Filtro de status (Todas / Pendentes / Parciais / Quitadas) e chave "Só vencidas" (`vencidas=true`), na URL. `limit/limite = 20`.
- Colunas: descrição, vencimento (`formatarVencimento` + badge de `diasAteVencimento`: coral "Vencida há N dias", âmbar "Vence hoje"/"Em N dias" até 7 dias, nenhum depois), total, pago/recebido, falta, status, ações.
- "Registrar pagamento"/"Registrar recebimento" para todos os papéis quando não quitada. `FormBaixa`: conta, categoria do `tipoCategoria`, valor com padrão = restante (texto pt-BR); prévia do saldo da conta (só para pagar, que tira dinheiro). Sucesso → `invalidarLancamento()`.
- Novo / Editar / Apagar só ADMIN. `FormCompromisso`: descrição, valor total, vencimento (`<input type="date">`, enviado como `"AAAA-MM-DD"`: aqui a API quer meia-noite UTC).
- Empty: "Nenhuma conta a pagar" com ação "Cadastrar conta a pagar" (ADMIN).

- [ ] **Passo 1: Testes que falham** (renderizar com cada config)
  - `"contas a receber lê totalPagina e usa pagina/limite"`: resposta com `totalPagina: 3` → "Página 1 de 3"; pedido com `pagina=1&limite=20`.
  - `"USUARIO registra pagamento mas não edita"`: botão "Registrar pagamento" visível; "Editar" e "Nova conta a pagar" ausentes.
  - `"valor da baixa começa com o que falta"`: total `300.00`, pago `100.50` → campo com `199,50`.
  - `"vencimento aparece no dia certo e com badge"`: `vencimento: "2026-11-05T00:00:00.000Z"`, hoje `2026-11-07` (`vi.setSystemTime`) → "05/11/2026" e "Vencida há 2 dias".
  - `"quitada não oferece baixa"`.
- [ ] **Passo 2: Rodar e ver falhar**; **Passo 3: implementar**; **Passo 4:** `npm run check && npm run lint && npm test` → PASS.
- [ ] **Passo 5: Commit** `feat: contas a pagar e a receber com baixa parcial`

---

### Tarefa 9: Contas e categorias

**Files (FRONT):** `src/features/contas/{PaginaContas,FormConta}.tsx` (modify `useContas.ts`); `src/features/categorias/{PaginaCategorias,FormCategoria}.tsx` (modify `useCategorias.ts`)
- Test: `src/features/contas/contas.test.tsx`, `src/features/categorias/categorias.test.tsx`

**Interfaces:**
- Consumes: `useContasTodas`, `useSaldos`, `useCategoriasTodas`, `invalidarLancamento`.
- Produces: mutations `useSalvarConta()`, `useApagarConta()`, `useSalvarCategoria()`, `useApagarCategoria()`; cada uma invalida a própria chave (e `saldos`/`painel` no caso de contas).

Contas (`Contas.dc.html`): saldo consolidado (soma em centavos dos `saldoAtual`); um card por conta com saldo atual, saldo inicial, receitas e despesas. ADMIN: "Nova conta", editar (nome, saldo inicial; `0` permitido) e apagar com confirmação. Empty: "Cadastrar primeira conta".
Categorias (`Categorias.dc.html`): duas colunas, Receitas e Despesas (empilhadas no celular), em ordem alfabética. ADMIN: nova (nome, tipo), editar, apagar com confirmação. Erros de regra viram toast com a mensagem mapeada.

- [ ] **Passo 1: Testes que falham**
  - `"consolidado soma sem erro de arredondamento"`: saldos `0.10` e `0.20` → "R$ 0,30".
  - `"USUARIO não vê Nova conta nem Editar"`.
  - `"saldo inicial 0 é aceito"`: enviar com `0` → corpo `saldoInicial: "0.00"`.
  - `"categorias separadas por tipo"`: a coluna "Receitas" só lista RECEITA.
  - `"CATEGORIA EM USO vira mensagem amigável"`: `DELETE` → `409` → "Esta categoria tem lançamentos e não pode ser apagada.".
- [ ] **Passo 2: Rodar e ver falhar**; **Passo 3: implementar**; **Passo 4:** `npm run check && npm run lint && npm test` → PASS.
- [ ] **Passo 5: Commit** `feat: telas de contas e categorias`

---

### Tarefa 10: Configurações e usuários

**Files (FRONT):** `src/features/configuracoes/{PaginaConfiguracoes,FormSenha,SecaoUsuarios,FormUsuario}.tsx`
- Test: `src/features/configuracoes/configuracoes.test.tsx`

**Interfaces:**
- Consumes: `useAuth()`, `limparSessao`, `requisicao`, `normalizarPagina`, `chaves.usuarios`.

Tela (`Configuracoes.dc.html`):
- Perfil: e-mail, papel (badge), "Desde dd/mm/aaaa".
- Trocar senha: atual, nova, confirmar (mesmas regras de tamanho da Tarefa 5; nova ≠ atual). `PUT /auth/senha` → `204` derruba todas as sessões no back-end: `limparSessao()`, limpar cache, toast "Senha alterada. Entre de novo com a nova senha.", navegar para `/entrar`. `401 SENHA ATUAL INCORRETA` → erro no campo "Senha atual" (não desloga: a Tarefa 3 só renova em `401` de token).
- Sair de todos os dispositivos: `ConfirmDialog` → `POST /auth/sair-de-todos` → mesmo fim da troca de senha, toast "Você saiu de todos os dispositivos.".
- Usuários (só ADMIN; a seção nem renderiza para USUARIO): `GET /usuarios?page&limit=20`; tabela e-mail, papel, criado em; "Novo usuário" (`POST /auth/registrar` com e-mail, senha, papel); mudar papel (`PATCH /usuarios/:id/papel`); apagar (`DELETE /usuarios/:id`, confirmação). Na linha do próprio usuário, sem mudar papel nem apagar (evita se trancar fora).

- [ ] **Passo 1: Testes que falham**
  - `"USUARIO não vê a seção Usuários"`.
  - `"ADMIN não vê ações na própria linha"`.
  - `"trocar senha com sucesso volta para Entrar"`.
  - `"senha atual errada mostra erro no campo e não desloga"`: `PUT /auth/senha` → `401 { erro: "SENHA ATUAL INCORRETA" }` → campo "Senha atual" com "Senha atual incorreta."; `POST /auth/refresh` não chamado.
  - `"último admin vira mensagem amigável"`: `PATCH` → `409 NÃO É POSSÍVEL REMOVER O ÚLTIMO ADMIN` → "É preciso manter pelo menos um administrador.".
- [ ] **Passo 2: Rodar e ver falhar**; **Passo 3: implementar**; **Passo 4:** `npm run check && npm run lint && npm test` → PASS.
- [ ] **Passo 5: Commit** `feat: configurações, troca de senha e gestão de usuários`

---

### Tarefa 11: Revisão, navegador e README

**Files (FRONT):** `README.md`; correções onde a revisão apontar.

- [ ] **Passo 1: Revisão de código** do FRONT inteiro e do commit da Tarefa 1 no BACK (skill `code-review` ou `superpowers:requesting-code-review`). Corrigir o que for erro; anotar o resto.
- [ ] **Passo 2: Subir o ambiente de teste**
  - BACK com o banco `_test`: `env $(grep -v '^#' .env.test | xargs) npx prisma migrate deploy` e depois `env $(grep -v '^#' .env.test | xargs) npm run dev` em segundo plano (o `dotenv/config` não sobrescreve variáveis já definidas).
  - FRONT: `npm run dev` em segundo plano (`http://localhost:5173`).
- [ ] **Passo 3: Teste no navegador** (Playwright MCP; se faltar o Chrome, `npx playwright install chromium`):
  1. Banco sem usuários (`TRUNCATE "Usuario" CASCADE` no banco `_test`) → `/entrar` mostra "Criar conta de administrador" → criar → cai na visão geral.
  2. Criar conta "Banco" (saldo `1.000,00`) e categorias "Salário" (RECEITA) e "Mercado" (DESPESA).
  3. Lançar DESPESA "Mercado" `150,50` com data de ontem → aparece na lista com a data de ontem; saldo "R$ 849,50" em Contas e na visão geral.
  4. Sair → `/entrar` mostra só o login → entrar de novo.
  5. Configurações → cadastrar USUARIO → entrar com ele em aba anônima → sem botões de editar/apagar.
  6. Largura 375 px: menu em gaveta, página sem rolagem horizontal; navegar só com teclado (Tab/Enter/Esc) num formulário.
  Erros encontrados: corrigir com teste antes da correção.
- [ ] **Passo 4: Verificação final** — FRONT `npm run check && npm run lint && npm test && npm run build`; BACK `npm run check && npm test`. Tudo verde.
- [ ] **Passo 5: README do FRONT**: requisitos, `npm install`, back-end rodando na 3000, `npm run dev`, scripts, `VITE_API_URL`, primeiro acesso, produção (servir `dist/` com a API no mesmo domínio em `/api`, por causa do CSP `connect-src 'self'`), riscos aceitos (refresh token no `localStorage`; primeiro acesso aberto até existir ADMIN).
- [ ] **Passo 6: Relatório final para o usuário**: o que foi feito, erros corrigidos, e sugestões que precisam de aprovação (paginação `page/limit` × `pagina/limite`, `totalPaginas` × `totalPagina`, rotas no singular × plural, rota `/resumo`, cookie `httpOnly`).
- [ ] **Passo 7: Commit** `docs: README do front e ajustes da revisão`
