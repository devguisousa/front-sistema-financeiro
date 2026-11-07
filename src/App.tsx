import type { RouteObject } from "react-router";
import { PaginaLogin } from "./features/login/PaginaLogin";
import { PaginaNaoEncontrada } from "./features/nao-encontrada/PaginaNaoEncontrada";
import { AppLayout } from "./layouts/AppLayout";
import { RotaProtegida } from "./layouts/RotaProtegida";

// Telas internas carregam sob demanda: o login abre sem baixar o app inteiro
// (o Recharts da visão geral é a maior dependência)
export const rotas: RouteObject[] = [
  { path: "/entrar", element: <PaginaLogin /> },
  {
    element: <RotaProtegida />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            lazy: async () => ({
              Component: (await import("./features/visao-geral/PaginaVisaoGeral")).PaginaVisaoGeral,
            }),
          },
          {
            path: "transacoes",
            lazy: async () => ({
              Component: (await import("./features/transacoes/PaginaTransacoes")).PaginaTransacoes,
            }),
          },
          {
            path: "transferencias",
            lazy: async () => ({
              Component: (await import("./features/transferencias/PaginaTransferencias")).PaginaTransferencias,
            }),
          },
          {
            path: "contas-a-pagar",
            lazy: async () => ({
              Component: (await import("./features/contas-pagar/PaginaContasPagar")).PaginaContasPagar,
            }),
          },
          {
            path: "contas-a-receber",
            lazy: async () => ({
              Component: (await import("./features/contas-receber/PaginaContasReceber")).PaginaContasReceber,
            }),
          },
          {
            path: "contas",
            lazy: async () => ({
              Component: (await import("./features/contas/PaginaContas")).PaginaContas,
            }),
          },
          {
            path: "categorias",
            lazy: async () => ({
              Component: (await import("./features/categorias/PaginaCategorias")).PaginaCategorias,
            }),
          },
          {
            path: "configuracoes",
            lazy: async () => ({
              Component: (await import("./features/configuracoes/PaginaConfiguracoes")).PaginaConfiguracoes,
            }),
          },
          { path: "*", element: <PaginaNaoEncontrada /> },
        ],
      },
    ],
  },
];
