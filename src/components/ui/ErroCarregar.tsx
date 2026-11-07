import { RotateCw } from "lucide-react";
import { mensagemDoErro } from "../../lib/erros";
import { Button } from "./Button";

/** Bloco que não carregou: mensagem + "Tentar de novo". */
export function ErroCarregar({ erro, aoTentar }: { erro: unknown; aoTentar(): void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-6">
      <p role="alert" className="text-[13px] text-coral">
        Não foi possível carregar. {mensagemDoErro(erro)}
      </p>
      <Button tamanho="sm" onClick={aoTentar}>
        <RotateCw size={14} aria-hidden="true" />
        Tentar de novo
      </Button>
    </div>
  );
}
