import { X } from "lucide-react";
import { Dialog as RadixDialog } from "radix-ui";
import type { ReactNode } from "react";
import { estiloCaixaModal, estiloFundoModal } from "./estilos";

type DialogProps = {
  aberto: boolean;
  aoMudar(aberto: boolean): void;
  titulo: string;
  descricao?: string;
  children: ReactNode;
  rodape?: ReactNode;
};

export function Dialog({ aberto, aoMudar, titulo, descricao, children, rodape }: DialogProps) {
  return (
    <RadixDialog.Root open={aberto} onOpenChange={aoMudar}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={estiloFundoModal} />
        <RadixDialog.Content
          className={estiloCaixaModal}
          {...(descricao ? {} : { "aria-describedby": undefined })}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <RadixDialog.Title className="text-[20px] font-semibold tracking-[-.03em]">
                {titulo}
              </RadixDialog.Title>
              {descricao && (
                <RadixDialog.Description className="text-[13px] text-musgo">
                  {descricao}
                </RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close
              aria-label="Fechar"
              className="-mt-1 -mr-2 inline-flex size-10 flex-none items-center justify-center rounded-full text-musgo transition-colors hover:bg-[#0F1512] hover:text-nevoa"
            >
              <X size={18} aria-hidden="true" />
            </RadixDialog.Close>
          </div>
          {children}
          {rodape && (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{rodape}</div>
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
