import { useQueryClient } from "@tanstack/react-query";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import {
  aoPerderSessao,
  definirSessao,
  lerRefreshToken,
  limparSessao,
  requisicao,
  temSessao,
} from "./api";
import type { Tokens, Usuario } from "./tipos";
import { type ContextoAuth, ContextoAuthReact } from "./useAuth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(() => temSessao());
  const usuarioRef = useRef<Usuario | null>(null);

  useEffect(() => {
    usuarioRef.current = usuario;
  }, [usuario]);

  const recarregarUsuario = useCallback(async () => {
    setUsuario(await requisicao<Usuario>("/auth/me"));
  }, []);

  // Página aberta com sessão salva: descobre quem está logado
  useEffect(() => {
    if (!temSessao()) return;
    let ativo = true;

    requisicao<Usuario>("/auth/me")
      .then((dados) => ativo && setUsuario(dados))
      .catch(() => {
        // sessão recusada (api.ts já limpou) ou sem conexão: vai para o login
      })
      .finally(() => ativo && setCarregando(false));

    return () => {
      ativo = false;
    };
  }, []);

  const encerrarLocalmente = useCallback(() => {
    limparSessao();
    setUsuario(null);
    queryClient.clear();
  }, [queryClient]);

  // Renovação recusada ou logout em outra aba
  useEffect(
    () =>
      aoPerderSessao(() => {
        const estavaLogado = usuarioRef.current !== null;
        setUsuario(null);
        queryClient.clear();
        if (estavaLogado) toast.error("Sua sessão expirou. Entre de novo.");
      }),
    [queryClient],
  );

  const entrarCom = useCallback(
    async (caminho: string, email: string, senha: string) => {
      const tokens = await requisicao<Tokens>(caminho, {
        metodo: "POST",
        corpo: { email, senha },
        publica: true,
      });
      definirSessao(tokens);
      await recarregarUsuario();
    },
    [recarregarUsuario],
  );

  const sair = useCallback(async () => {
    const refreshToken = lerRefreshToken();
    encerrarLocalmente();
    if (refreshToken) {
      await requisicao("/auth/logout", {
        metodo: "POST",
        corpo: { refreshToken },
        publica: true,
      }).catch(() => {
        // o token expira sozinho em 7 dias
      });
    }
  }, [encerrarLocalmente]);

  const valor = useMemo<ContextoAuth>(
    () => ({
      usuario,
      carregando,
      ehAdmin: usuario?.papel === "ADMIN",
      entrar: (email, senha) => entrarCom("/auth/login", email, senha),
      criarPrimeiroAdmin: (email, senha) => entrarCom("/auth/primeiro-admin", email, senha),
      sair,
      encerrarLocalmente,
      recarregarUsuario,
    }),
    [usuario, carregando, entrarCom, sair, encerrarLocalmente, recarregarUsuario],
  );

  return <ContextoAuthReact.Provider value={valor}>{children}</ContextoAuthReact.Provider>;
}
