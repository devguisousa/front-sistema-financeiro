/** Marca Fluxo: três barras verdes + nome. */
export function Logo({ tamanho = 26 }: { tamanho?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width={tamanho} height={tamanho} viewBox="0 0 32 32" aria-hidden="true">
        <path d="M5 5h23l-4.5 6.5H5z" fill="#3DF58F" />
        <path d="M5 14h15l-4.5 6.5H5z" fill="#3DF58F" fillOpacity=".7" />
        <path d="M5 23h7l-4.5 6.5H5z" fill="#3DF58F" fillOpacity=".42" />
      </svg>
      <span className="text-[20px] leading-none font-semibold tracking-[-.045em] text-nevoa">
        fluxo
      </span>
    </span>
  );
}
