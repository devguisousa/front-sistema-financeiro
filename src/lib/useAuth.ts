import { createContext, useContext } from "react";
import type { Usuario } from "./tipos";

export type ContextoAuth = {
  usuario: Usuario | null;
  carregando: boolean;
  ehAdmin: boolean;
  entrar(email: string, senha: string): Promise<void>;
  criarPrimeiroAdmin(email: string, senha: string): Promise<void>;
  /** Logout normal: avisa a API e limpa tudo. */
  sair(): Promise<void>;
  /** Limpa a sessão só no navegador (a API já encerrou: troca de senha, sair de todos). */
  encerrarLocalmente(): void;
  recarregarUsuario(): Promise<void>;
};

export const ContextoAuthReact = createContext<ContextoAuth | null>(null);

/** Sessão atual. O provedor fica em auth.tsx. */
export function useAuth(): ContextoAuth {
  const contexto = useContext(ContextoAuthReact);
  if (!contexto) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return contexto;
}
