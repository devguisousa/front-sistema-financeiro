# Fluxo — front-end

Interface web da API **sistema_financeiro**: contas, categorias, transações,
transferências e contas a pagar/receber. Cada pessoa cria a própria conta e vê só
os próprios dados.
Visual da marca Fluxo (preto e verde), feito a partir dos mockups em
`projetos/design-fluxo`.

**Stack:** Vite 8, React 19, TypeScript (strict), Tailwind CSS 4, React Router 8,
TanStack Query 5, Radix UI, Recharts, lucide-react e sonner. Testes com Vitest
e Testing Library.

## Como rodar

Requisitos: Node 22 ou mais novo e o back-end rodando em `http://localhost:3000`
(veja o README do `sistema_financeiro`).

```bash
npm install
npm run dev        # http://localhost:5173
```

Em desenvolvimento, o front chama `/api/...` e o Vite repassa para
`http://localhost:3000` sem o prefixo, então não é preciso configurar CORS.

## Scripts

| Script | O que faz |
|---|---|
| `dev` | Servidor de desenvolvimento com recarga |
| `build` | Checa os tipos e gera `dist/` |
| `preview` | Serve o `dist/` localmente |
| `check` | Checagem de tipos (`tsc -b`) |
| `lint` | oxlint (React, acessibilidade, Vitest), avisos contam como erro |
| `test` | Testes (Vitest + jsdom) |

## Cadastro e primeiro acesso

O cadastro é aberto: a tela **Entrar** tem a aba **Criar conta** (`POST /auth/cadastro`),
que cria um `USUARIO` com dados próprios e já entra no sistema.

Enquanto o banco não tem nenhum ADMIN, a tela também oferece "Criar conta de
administrador" (`GET /auth/status` e `POST /auth/primeiro-admin`).

> Enquanto não houver ADMIN, quem abrir o site primeiro vira administrador.
> Em produção, crie o admin logo depois do deploy (pelo site ou com
> `npm run criar-admin` no back-end).

## Papéis

- **USUARIO e ADMIN:** usam todas as telas financeiras (contas, categorias, transações,
  transferências, contas a pagar/receber), sempre só com os próprios dados.
- **ADMIN:** além disso, gerencia usuários em **Configurações** (criar, mudar papel e
  apagar; apagar um usuário apaga os dados dele).

O front esconde o que o papel não pode usar, mas quem bloqueia de verdade é a API.

## Estrutura

```
src/
  lib/            api (fetch, sessão, renovação), auth, dinheiro, datas, erros, tipos
  components/ui/  peças visuais (botão, campo, diálogo, tabela...), sem acesso à API
  layouts/        sidebar, gaveta do celular, rota protegida
  features/       uma pasta por tela: página, hooks de dados e formulários
  test/           mock do fetch, fábricas de dados e render com provedores
```

## Detalhes que importam

- **Dinheiro:** sempre enviado como texto com 2 casas (`"150.50"`); somas em
  centavos inteiros. O campo de valor aceita `1.234,56`, `150,5`, `R$ 10`.
- **Datas:** vencimentos são meia-noite UTC e aparecem em UTC (senão voltariam um
  dia em Brasília). Transações levam data e hora; um dia escolhido no passado é
  enviado como meio-dia local.
- **Sessão:** o access token fica só na memória; o refresh token fica no
  `localStorage` (a API o devolve no corpo). A renovação roda uma vez por vez,
  inclusive entre abas (`navigator.locks`), porque reutilizar um refresh antigo
  derruba todas as sessões. Sair numa aba sai em todas.
- **Visão geral:** os cartões de receitas, despesas e resultado seguem o período
  escolhido (mesmos atalhos e datas do Relatório, na URL) e comparam com o
  período anterior do mesmo tamanho: o mês (ou meses) antes, para meses
  inteiros; a mesma quantidade de dias logo antes, para datas livres. Os totais
  vêm de `GET /transacao/resumo`. O gráfico de fluxo junta as transações dos
  últimos 6 meses página a página (até 10 páginas de 100); se passar disso,
  mostra "Dados parciais". Saldo, fluxo e vencimentos não dependem do período.
  Transferências não contam como receita nem despesa.
- **Relatório:** receitas e despesas do período escolhido (atalhos ou datas De/Até),
  com totais por categoria e a lista de lançamentos. Os totais vêm da API
  (`GET /transacao/resumo`); o período fica na URL (`?de=AAAA-MM-DD&ate=AAAA-MM-DD`)
  e vai para a API como começo e fim do dia no fuso de quem usa.

## Produção

Publicado na Vercel (projeto `sistema-financeiro-front`), em
https://sistema-financeiro-front-nine.vercel.app. O push na `main` publica sozinho.
`vercel.json` reescreve todas as rotas para `index.html` (as rotas são do navegador).

- API em outro domínio: defina `VITE_API_URL` (URL da API) no build. O `vite.config.ts`
  libera só essa origem no `connect-src` da Content-Security-Policy.
- A API precisa liberar a origem do front em `CORS_ORIGENS`. Se o domínio do front
  mudar, atualize essa variável na API e publique a API de novo.
- Sem `VITE_API_URL`, o front chama `/api` no mesmo domínio. Exemplo com Nginx:

  ```nginx
  location /api/ { proxy_pass http://127.0.0.1:3000/; }
  location /     { try_files $uri /index.html; }
  ```

- Build local: `npm run build` gera o `dist/`.

## Riscos aceitos

- Refresh token no `localStorage`: um XSS conseguiria lê-lo. Mitigação: CSP no
  build e nenhum HTML injetado. Melhoria sugerida: cookie `httpOnly` no back-end.
- Primeiro acesso aberto até existir um ADMIN (veja acima).
- Cadastro aberto: qualquer pessoa pode criar conta. A API limita as tentativas por IP.
