# Fluxo — front-end

Interface web da API **sistema_financeiro**: contas, categorias, transações,
transferências e contas a pagar/receber, com papéis ADMIN e USUARIO.
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

## Primeiro acesso

Não existe cadastro público. Enquanto o banco não tem nenhum ADMIN, a tela
**Entrar** mostra "Criar conta de administrador" (rotas `GET /auth/status` e
`POST /auth/primeiro-admin` do back-end). Depois disso, a tela mostra só o
login, e novos usuários são cadastrados por um ADMIN em **Configurações**.

> Enquanto não houver ADMIN, quem abrir o site primeiro vira administrador.
> Em produção, crie o admin logo depois do deploy (pelo site ou com
> `npm run criar-admin` no back-end).

## Papéis

- **USUARIO:** vê tudo e lança transações, transferências, pagamentos e recebimentos.
- **ADMIN:** tudo, inclusive cadastros, edição, exclusão, estornos e usuários.

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
- **Visão geral:** a API não tem rota de resumo; o painel junta as transações dos
  últimos 6 meses página a página (até 10 páginas de 100). Se passar disso, o
  gráfico mostra "Dados parciais". Transferências não contam como receita nem
  despesa.

## Produção

```bash
npm run build      # gera dist/
```

- Sirva o `dist/` como site estático, com fallback para `index.html` (as rotas
  são do navegador).
- Coloque a API no **mesmo domínio**, em `/api`: o build inclui uma
  Content-Security-Policy com `connect-src 'self'`. Exemplo com Nginx:

  ```nginx
  location /api/ { proxy_pass http://127.0.0.1:3000/; }
  location /     { try_files $uri /index.html; }
  ```

- Para apontar para outra URL, defina `VITE_API_URL` no build (e ajuste a CSP em
  `vite.config.ts`).

## Riscos aceitos

- Refresh token no `localStorage`: um XSS conseguiria lê-lo. Mitigação: CSP no
  build e nenhum HTML injetado. Melhoria sugerida: cookie `httpOnly` no back-end.
- Primeiro acesso aberto até existir um ADMIN (veja acima).
