import {
  ArrowDownLeft,
  ArrowDownUp,
  ArrowLeftRight,
  ArrowUpRight,
  LayoutGrid,
  type LucideIcon,
  SlidersHorizontal,
  Tag,
  WalletCards,
} from "lucide-react";

export type ItemNav = { rotulo: string; caminho: string; icone: LucideIcon };

// Mesma ordem e grupos da sidebar dos mockups
export const GRUPOS_NAV: { titulo: string; itens: ItemNav[] }[] = [
  { titulo: "Geral", itens: [{ rotulo: "Visão geral", caminho: "/", icone: LayoutGrid }] },
  {
    titulo: "Movimentações",
    itens: [
      { rotulo: "Transações", caminho: "/transacoes", icone: ArrowDownUp },
      { rotulo: "Transferências", caminho: "/transferencias", icone: ArrowLeftRight },
    ],
  },
  {
    titulo: "Compromissos",
    itens: [
      { rotulo: "Contas a pagar", caminho: "/contas-a-pagar", icone: ArrowUpRight },
      { rotulo: "Contas a receber", caminho: "/contas-a-receber", icone: ArrowDownLeft },
    ],
  },
  {
    titulo: "Cadastros",
    itens: [
      { rotulo: "Contas", caminho: "/contas", icone: WalletCards },
      { rotulo: "Categorias", caminho: "/categorias", icone: Tag },
    ],
  },
  {
    titulo: "Sistema",
    itens: [{ rotulo: "Configurações", caminho: "/configuracoes", icone: SlidersHorizontal }],
  },
];

const TODOS = GRUPOS_NAV.flatMap((grupo) => grupo.itens);

/** Nome da tela pelo caminho (para o breadcrumb). */
export function telaDoCaminho(caminho: string): string {
  return TODOS.find((item) => item.caminho === caminho)?.rotulo ?? "";
}
