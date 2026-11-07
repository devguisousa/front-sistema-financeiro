# Front-end Fluxo — design

Data: 2026-11-07
Status: aprovado em conversa; aguardando revisão da spec escrita

## 1. Objetivo

Criar um front-end novo para a API `sistema_financeiro`, substituindo a tentativa
anterior (descartada). O resultado deve ser um site moderno, preto e verde,
fiel aos mockups da marca **Fluxo** (`projetos/design-fluxo/*.dc.html`), seguindo
boas práticas de UI/UX e conectado ao back-end real.

### O que o usuário pediu

- Pasta `projetos/front sistema financeiro`.
- React + TypeScript + Tailwind CSS.
- Visual moderno, paleta preto e verde, referências tipo Vercel/Framer/Awwwards.
- Cadastro na tela de login, na forma de **primeiro acesso**: se o banco não tem
  nenhum ADMIN, a tela permite criar o administrador; havendo ADMIN, a tela mostra
  só o login, sem opção de cadastro.
- Conectar ao back-end, revisar o código e corrigir erros, por etapas.

### Suposições aceitas

- As 10 telas dos mockups Fluxo entram no escopo.
- O front fala com a API pelo proxy `/api` do Vite (sem CORS em desenvolvimento).
- O back-end muda só nas duas rotas de primeiro acesso.

### Critérios de sucesso

- Todas as telas funcionam contra a API real, respeitando os papéis.
- `tsc`, ESLint, testes e `vite build` passam sem erros.
- Teste manual no navegador (Playwright) cobre login, primeiro acesso e um
  lançamento de ponta a ponta.
- Contraste AA, foco visível, navegação por teclado e layout responsivo.

## 2. Arquitetura

- **Stack:** Vite, React 19, TypeScript strict, Tailwind CSS v4 (tokens via
  `@theme` no CSS, sem `tailwind.config`).
- **Bibliotecas:** React Router (rotas e proteção), TanStack Query (cache, recarga,
  mutations com invalidação), Radix UI no estilo shadcn (código copiado para o
  projeto e reestilizado), Recharts (gráfico), lucide-react (ícones), sonner
  (toasts), `@fontsource` (fontes self-hosted).
- **Repositório:** git próprio, separado do back-end.

### Estrutura de pastas

```
src/
  main.tsx, App.tsx, index.css        # entrada, rotas, tokens Tailwind
  lib/
    api.ts                            # fetch, tokens, refresh, erros
    auth.tsx                          # AuthProvider, useAuth
    dinheiro.ts, datas.ts             # BRL, centavos, datas UTC
    erros.ts                          # códigos da API -> mensagens
    tipos.ts                          # tipos das respostas da API
    queryClient.ts                    # TanStack Query + chaves
  components/ui/                      # Button, Input, Field, Dialog, Select,
                                      # Badge, Table, Skeleton, Empty, Pagination
  layouts/AppLayout.tsx               # sidebar + topo + <Outlet/>
  features/
    login/  visao-geral/  transacoes/  transferencias/
    contas-pagar/  contas-receber/  contas/  categorias/  configuracoes/
```

Cada pasta de `features/` tem a página, os hooks de query/mutation e os
formulários daquela tela. Cada unidade tem um propósito: `lib/` não conhece
React Router; `components/ui/` não conhece a API.

## 3. Visual (fiel ao Fluxo)

### Tokens

| Token | Cor | Uso |
|---|---|---|
| noite | `#060807` | fundo |
| superfície | `#0C110E` | cards |
| linha | `#18201C` | bordas |
| névoa | `#E9F1EC` | texto |
| musgo | `#8B978F` | texto de apoio |
| verde | `#3DF58F` | ação, entrada |
| verde-claro | `#6BFFAD` | hover do primário |
| coral | `#FF8B66` | saída, vencido, perigo |

Tons intermediários (`#0B0F0D`, `#111814`, `#141B17`, `#1E2A24`, `#232D28`,
`#3A4A42`, `#76827A`, `#B9C4BE`) vêm dos mockups e viram tokens nomeados.

### Tipografia

- Geist (texto), Geist Mono (números, rótulos, kicker em caixa alta),
  Instrument Serif itálico (palavras de destaque nos títulos).
- Números sempre com `tabular-nums`.

### Componentes e movimento

- Botões em pílula; primário verde com glow no hover; `active:scale(.97)`.
- Animações curtas (≤ 250 ms) e desligadas com `prefers-reduced-motion`.
- Foco: `outline 2px` verde, `offset 2px`.

### Regras de UI/UX

- Contraste AA em texto e controles.
- Alvos de clique de pelo menos 40 px.
- Skeleton durante o carregamento; estado vazio com ação ("Cadastrar primeira conta").
- Erros perto do campo; erros gerais em toast.
- Confirmação antes de apagar ou estornar.
- Responsivo: sidebar fixa no desktop, menu em gaveta no celular, tabelas com
  rolagem horizontal própria (a página nunca rola na horizontal).
- `lang="pt-BR"`, títulos de página por rota.

## 4. Telas e permissões

| Tela | Conteúdo |
|---|---|
| Login | Painel da marca com letreiro de lançamentos + formulário. Se `precisaAdmin`, mostra "Criar conta de administrador". |
| Visão geral | Saldo total, receitas/despesas/resultado do mês com variação sobre o mês anterior, fluxo de caixa de 6 meses, saldo por conta, próximos vencimentos (15 dias, destaque para vencidas), últimas transações. |
| Transações | Filtro por tipo, conta e categoria; paginação; lançamento rápido com prévia do saldo após o lançamento; edição/exclusão só para ADMIN e só para lançamentos manuais. |
| Transferências | Lista, nova transferência, estorno (ADMIN). |
| Contas a pagar | Lista com filtro de status e vencidas; registrar pagamento parcial; CRUD (ADMIN). |
| Contas a receber | Igual, com recebimentos. |
| Contas | Saldo consolidado e por conta; CRUD (ADMIN). |
| Categorias | Receitas e despesas lado a lado; CRUD (ADMIN). |
| Configurações | Perfil, trocar senha, sair de todos os dispositivos, usuários (ADMIN: cadastrar, mudar papel, apagar). |

### Permissões

- **USUARIO:** vê tudo; lança transação, transferência, pagamento e recebimento.
- **ADMIN:** tudo.
- O front esconde os botões que o papel não pode usar; quem bloqueia de verdade
  é o back-end. Um `403` vira toast "Você não tem permissão para isso".

### Visão geral sem endpoint de resumo

A API não tem rota agregada. O front busca `GET /transacao?limit=100` página a
página (ordem por data desc) até passar do início da janela de 6 meses, com teto
de 10 páginas. Se o teto for atingido, o gráfico mostra o aviso "dados parciais".
Saldos vêm de `GET /contas/:id/saldo`. Sugestão futura: rota `/resumo` no back-end.

## 5. Dados e erros

### Tokens e sessão

- Access token só em memória. Refresh token em `localStorage`, porque a API o
  devolve no corpo e não em cookie.
- Risco aceito: um XSS leria o refresh token. Mitigação: CSP no build de produção,
  nada de `dangerouslySetInnerHTML`. Sugestão futura: cookie `httpOnly`.
- `401` numa chamada: renova uma única vez e repete o pedido; se a renovação
  falhar, faz logout e volta ao login.
- Reutilizar um refresh token antigo derruba todas as sessões. Por isso a
  renovação roda dentro de `navigator.locks.request("fluxo-refresh")`: dentro do
  lock, a aba relê o `localStorage`; se o token já mudou, outra aba renovou, e ela
  usa o novo sem chamar a API. Fallback sem `navigator.locks`: promessa única por aba.
- Evento `storage` sincroniza logout entre abas.

### Dinheiro e datas

- Valores sempre enviados como texto com 2 casas (`"150.50"`).
- Campo de valor aceita digitação pt-BR (`1.234,56`) e converte.
- Somas e diferenças em centavos inteiros (`bigint` não é necessário: até
  `Decimal(12,2)` cabe em `Number` como centavos).
- Vencimentos são meia-noite UTC: formatados com `timeZone: "UTC"` para não
  aparecer um dia antes em Brasília. Datas de transação usam o fuso local.

### Erros da API

| Situação | Exibição |
|---|---|
| `400` com `detalhes` (Zod) | mensagem embaixo de cada campo |
| `400`/`404`/`409` com `erro` de regra | mensagem amigável mapeada (ex.: `SALDO INSUFICIENTE` → "Saldo insuficiente nesta conta") |
| `409` de concorrência | toast "Outra pessoa alterou este registro. Tente de novo." |
| `429` | toast "Muitas tentativas. Aguarde alguns minutos." |
| falha de rede | toast "Sem conexão com o servidor." |

Código de erro sem mapeamento: mostra o texto da API com só a primeira letra maiúscula.

### Diferenças de contrato absorvidas pelo front

- Paginação: `page/limit` (transações, contas, categorias, transferências,
  contas a pagar, usuários) e `pagina/limite` (contas a receber, pagamentos,
  recebimentos).
- Total de páginas: `totalPaginas` na maioria, `totalPagina` em contas a receber.
- O front normaliza tudo para `{ itens, pagina, totalPaginas, total }` em `lib/api.ts`.
  Não alterar o back-end sem aprovação; entra no relatório final.

### Cache

Chaves do TanStack Query por recurso. Cada mutation invalida as chaves afetadas:
um lançamento invalida transações, saldos, painel e, se for pagamento/recebimento,
a lista de compromissos.

## 6. Back-end (repositório `sistema_financeiro`)

### `GET /auth/status` (pública)

`200 { precisaAdmin: boolean }`. `true` quando não existe nenhum usuário com
papel ADMIN.

### `POST /auth/primeiro-admin` (pública, com rate limit)

- Corpo `{ email, senha }`, validado com as mesmas regras do cadastro.
- Dentro de uma transação: `pg_advisory_xact_lock` fixo, conta ADMINs; se houver,
  `409 { erro: "JÁ EXISTE UM ADMINISTRADOR" }`; senão cria o usuário com papel
  ADMIN.
- E-mail já cadastrado (como USUARIO): `409 { erro: "USUÁRIO JÁ EXISTE" }`.
- Sucesso: `201 { accessToken, refreshToken }`, para entrar direto.
- Rate limit: o mesmo limitador por IP do login.

### Risco

Enquanto não há ADMIN, qualquer pessoa que acessar o site primeiro vira ADMIN.
Em produção, criar o admin logo após o deploy (ou com `npm run criar-admin`).

### Testes (Vitest + supertest)

- `status` retorna `true` com banco sem admin e `false` com admin.
- Criação funciona sem admin e devolve tokens válidos.
- `409` quando já existe admin.
- Dois pedidos simultâneos criam só um admin.
- Os 89 testes existentes continuam passando.

## 7. Testes do front-end

- Vitest + Testing Library + jsdom.
- `lib/`: conversão e formatação de dinheiro, datas UTC, mapeamento de erros,
  normalização de paginação, renovação de token (uma por vez, repete após `401`,
  logout quando falha).
- Componentes: login e primeiro acesso, botões escondidos por papel, formulário
  de transação mostrando erro de campo.
- Verificação: `tsc --noEmit`, ESLint, `vitest run`, `vite build`.
- Navegador: Playwright contra o back-end ligado ao banco `_test`.

## 8. Etapas (um commit por etapa)

1. Back-end: rotas de primeiro acesso + testes.
2. Scaffold: Vite, Tailwind v4, tokens Fluxo, fontes, ESLint, Vitest.
3. Base: `lib/` (api, auth, dinheiro, datas, erros), rotas protegidas, layout.
4. Componentes de UI.
5. Login + primeiro acesso.
6. Visão geral.
7. Transações + transferências.
8. Contas a pagar + contas a receber.
9. Contas + categorias.
10. Configurações + usuários.
11. Revisão de código, correção de erros, teste no navegador, README.

## 9. Fora do escopo

- Rota `/resumo` no back-end, cookie `httpOnly`, padronização da paginação da API.
- Tema claro.
- Deploy.
