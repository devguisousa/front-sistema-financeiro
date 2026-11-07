import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";

type PaginationProps = {
  pagina: number;
  totalPaginas: number;
  aoMudar(pagina: number): void;
};

/** Anterior/Próxima. Não aparece com uma página só. */
export function Pagination({ pagina, totalPaginas, aoMudar }: PaginationProps) {
  if (totalPaginas <= 1) return null;

  return (
    <nav
      aria-label="Paginação"
      className="flex items-center justify-between gap-3 border-t border-superficie-3 px-5 py-3"
    >
      <span className="num font-mono text-[12px] text-musgo">
        Página {pagina} de {totalPaginas}
      </span>
      <div className="flex gap-2">
        <Button tamanho="sm" disabled={pagina <= 1} onClick={() => aoMudar(pagina - 1)}>
          <ChevronLeft size={14} aria-hidden="true" />
          Anterior
        </Button>
        <Button
          tamanho="sm"
          disabled={pagina >= totalPaginas}
          onClick={() => aoMudar(pagina + 1)}
        >
          Próxima
          <ChevronRight size={14} aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
