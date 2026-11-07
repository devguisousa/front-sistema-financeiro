import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../lib/useAuth";

export function TelaCarregando() {
  return (
    <output className="grid min-h-dvh place-items-center bg-noite">
      <span className="flex items-center gap-3 font-mono text-[12px] tracking-[.08em] text-musgo uppercase">
        <span className="size-2 animate-pulse rounded-full bg-verde" aria-hidden="true" />
        Carregando…
      </span>
    </output>
  );
}

/** Só deixa passar quem está logado; guarda a rota para voltar depois do login. */
export function RotaProtegida() {
  const { usuario, carregando, saidaManual } = useAuth();
  const location = useLocation();

  if (carregando) return <TelaCarregando />;
  // Sessão que expirou guarda a tela para voltar; "Sair" não
  if (!usuario) return <Navigate to="/entrar" replace state={saidaManual ? undefined : { de: location }} />;
  return <Outlet />;
}
