import { cn } from "../../lib/cn";

// Classes compartilhadas entre componentes (fora dos .tsx por causa do fast refresh)

export const estiloCard =
  "rounded-[18px] border border-linha bg-[linear-gradient(180deg,#0C110E_0%,#090C0A_100%)] transition-colors duration-300 hover:border-[#27342D]";

export const estiloCampo = cn(
  "w-full min-h-11 rounded-xl border border-[#1E2722] bg-poco px-3.5 text-[14px] text-nevoa",
  "transition-[border-color,box-shadow] duration-200 placeholder:text-musgo-2 hover:border-[#2C3832]",
  "focus:border-verde focus:shadow-[0_0_0_4px_rgb(61_245_143/.13)] focus:outline-none",
  "aria-invalid:border-coral aria-invalid:focus:shadow-[0_0_0_4px_rgb(255_139_102/.13)]",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

export const estiloFundoModal =
  "fixed inset-0 z-40 bg-black/70 backdrop-blur-sm data-[state=open]:animate-[fade_.2s_ease]";

// No celular vira folha que sobe de baixo; a partir de sm fica centralizado
export const estiloCaixaModal = cn(
  "fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col gap-5 overflow-y-auto rounded-t-[22px] border border-linha",
  "bg-[linear-gradient(180deg,#0D1310,#090C0A)] p-6 shadow-[0_24px_64px_-12px_rgb(0_0_0/.9)] focus:outline-none",
  "data-[state=open]:animate-[subir_.22s_ease-out]",
  "sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-[min(520px,calc(100vw-32px))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[22px]",
);
