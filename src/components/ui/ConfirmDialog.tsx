import { AlertDialog } from "radix-ui";
import { Button } from "./Button";
import { estiloCaixaModal, estiloFundoModal } from "./estilos";

type ConfirmDialogProps = {
  aberto: boolean;
  aoMudar(aberto: boolean): void;
  titulo: string;
  descricao: string;
  textoConfirmar: string;
  perigo?: boolean;
  carregando?: boolean;
  aoConfirmar(): void;
};

/** Confirmação antes de apagar/estornar. Foco começa em "Cancelar". */
export function ConfirmDialog({
  aberto,
  aoMudar,
  titulo,
  descricao,
  textoConfirmar,
  perigo = false,
  carregando = false,
  aoConfirmar,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={aberto} onOpenChange={aoMudar}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className={estiloFundoModal} />
        <AlertDialog.Content className={estiloCaixaModal}>
          <div className="flex flex-col gap-1.5">
            <AlertDialog.Title className="text-[20px] font-semibold tracking-[-.03em]">
              {titulo}
            </AlertDialog.Title>
            <AlertDialog.Description className="text-[14px] text-musgo">
              {descricao}
            </AlertDialog.Description>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel asChild>
              <Button>Cancelar</Button>
            </AlertDialog.Cancel>
            {/* Não é AlertDialog.Action: só fecha quando a operação terminar */}
            <Button
              variante={perigo ? "perigo" : "primario"}
              carregando={carregando}
              onClick={aoConfirmar}
            >
              {textoConfirmar}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
