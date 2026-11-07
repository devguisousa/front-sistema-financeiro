import type { RouteObject } from "react-router";
import { PaginaLogin } from "./features/login/PaginaLogin";
import { PaginaNaoEncontrada } from "./features/nao-encontrada/PaginaNaoEncontrada";
import { PaginaTransacoes } from "./features/transacoes/PaginaTransacoes";
import { PaginaTransferencias } from "./features/transferencias/PaginaTransferencias";
import { PaginaVisaoGeral } from "./features/visao-geral/PaginaVisaoGeral";
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
          { index: true, element: <PaginaVisaoGeral /> },
          { path: "transacoes", element: <PaginaTransacoes /> },
          { path: "transferencias", element: <PaginaTransferencias /> },
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
