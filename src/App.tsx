import type { RouteObject } from "react-router";
import { PaginaCategorias } from "./features/categorias/PaginaCategorias";
import { PaginaContas } from "./features/contas/PaginaContas";
import { PaginaConfiguracoes } from "./features/configuracoes/PaginaConfiguracoes";
import { PaginaContasPagar } from "./features/contas-pagar/PaginaContasPagar";
import { PaginaContasReceber } from "./features/contas-receber/PaginaContasReceber";
import { PaginaLogin } from "./features/login/PaginaLogin";
import { PaginaNaoEncontrada } from "./features/nao-encontrada/PaginaNaoEncontrada";
import { PaginaTransacoes } from "./features/transacoes/PaginaTransacoes";
import { PaginaTransferencias } from "./features/transferencias/PaginaTransferencias";
import { PaginaVisaoGeral } from "./features/visao-geral/PaginaVisaoGeral";
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
          { path: "contas-a-pagar", element: <PaginaContasPagar /> },
          { path: "contas-a-receber", element: <PaginaContasReceber /> },
          { path: "contas", element: <PaginaContas /> },
          { path: "categorias", element: <PaginaCategorias /> },
          { path: "configuracoes", element: <PaginaConfiguracoes /> },
          { path: "*", element: <PaginaNaoEncontrada /> },
        ],
      },
    ],
  },
];
