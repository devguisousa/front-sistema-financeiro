import type { RouteObject } from "react-router";
import { PaginaLogin } from "./features/login/PaginaLogin";
import { PaginaNaoEncontrada } from "./features/nao-encontrada/PaginaNaoEncontrada";
import { PaginaProvisoria } from "./features/PaginaProvisoria";
import { AppLayout } from "./layouts/AppLayout";
import { RotaProtegida } from "./layouts/RotaProtegida";

export const rotas: RouteObject[] = [
  { path: "/entrar", element: <PaginaLogin /> },
  {
    element: <RotaProtegida />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <PaginaProvisoria tela="Visão geral" /> },
          { path: "transacoes", element: <PaginaProvisoria tela="Transações" /> },
          { path: "transferencias", element: <PaginaProvisoria tela="Transferências" /> },
          { path: "contas-a-pagar", element: <PaginaProvisoria tela="Contas a pagar" /> },
          { path: "contas-a-receber", element: <PaginaProvisoria tela="Contas a receber" /> },
          { path: "contas", element: <PaginaProvisoria tela="Contas" /> },
          { path: "categorias", element: <PaginaProvisoria tela="Categorias" /> },
          { path: "configuracoes", element: <PaginaProvisoria tela="Configurações" /> },
          { path: "*", element: <PaginaNaoEncontrada /> },
        ],
      },
    ],
  },
];
