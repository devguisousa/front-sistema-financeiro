import { LogOut, RefreshCw, Timer } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge, Button, Card, ConfirmDialog, PageHeader } from "../../components/ui";
import { requisicao } from "../../lib/api";
import { formatarData } from "../../lib/datas";
import { mensagemDoErro } from "../../lib/erros";
import { useTitulo } from "../../lib/titulo";
import { useAuth } from "../../lib/useAuth";
import { FormSenha } from "./FormSenha";
import { SecaoUsuarios } from "./SecaoUsuarios";

export function PaginaConfiguracoes() {
  useTitulo("Configurações");
  const { usuario, ehAdmin, encerrarLocalmente } = useAuth();
  const [confirmando, setConfirmando] = useState(false);
  const [saindo, setSaindo] = useState(false);

  async function sairDeTodos() {
    setSaindo(true);
    try {
      await requisicao("/auth/sair-de-todos", { metodo: "POST" });
      toast.success("Você saiu de todos os dispositivos.");
      encerrarLocalmente();
    } catch (erro) {
      toast.error(mensagemDoErro(erro));
      setSaindo(false);
      setConfirmando(false);
    }
  }

  if (!usuario) return null;

  return (
    <>
      <PageHeader kicker="08 — Sistema" titulo="Configurações" descricao="Sua conta, suas sessões e quem mais tem acesso." />

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Card aria-labelledby="titulo-minha-conta" className="flex min-w-0 flex-col gap-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="rotulo">Minha conta</span>
              <h2 id="titulo-minha-conta" className="truncate text-[22px] font-semibold tracking-[-.03em]">
                {usuario.email}
              </h2>
              <span className="font-mono text-[12px] text-musgo">Desde {formatarData(usuario.criadoEm)}</span>
            </div>
            <Badge tom={usuario.papel === "ADMIN" ? "verde" : "neutro"}>{usuario.papel}</Badge>
          </div>
          <hr className="border-superficie-3" />
          <FormSenha />
        </Card>

        <Card aria-labelledby="titulo-sessao" className="flex min-w-0 flex-col gap-5 p-6">
          <div className="flex flex-col gap-1.5">
            <h2 id="titulo-sessao" className="text-[18px] font-semibold tracking-[-.02em]">
              Sessão e segurança
            </h2>
            <p className="text-[13px] text-musgo">Como o login se mantém sem você perceber.</p>
          </div>
          <ul className="flex flex-col gap-4 text-[13px]">
            <li className="flex gap-3">
              <Timer size={18} className="mt-0.5 flex-none text-verde" aria-hidden="true" />
              <span className="flex flex-col gap-1">
                <span className="rotulo">Access token · 15 min</span>
                <span className="text-nevoa-2">
                  Quando acaba, o app pede outro com o refresh token, sem te deslogar.
                </span>
              </span>
            </li>
            <li className="flex gap-3">
              <RefreshCw size={18} className="mt-0.5 flex-none text-verde" aria-hidden="true" />
              <span className="flex flex-col gap-1">
                <span className="rotulo">Refresh token · troca a cada uso</span>
                <span className="text-nevoa-2">
                  Se um refresh antigo for reaproveitado, é sinal de roubo: todas as sessões caem na hora.
                </span>
              </span>
            </li>
          </ul>
          <Button variante="perigo" onClick={() => setConfirmando(true)} className="mt-auto self-start">
            <LogOut size={16} aria-hidden="true" />
            Sair de todos
          </Button>
        </Card>
      </div>

      {ehAdmin && <SecaoUsuarios />}

      <ConfirmDialog
        aberto={confirmando}
        aoMudar={setConfirmando}
        titulo="Sair de todos os dispositivos?"
        descricao="Todas as sessões, inclusive esta, serão encerradas. Você vai precisar entrar de novo."
        textoConfirmar="Sair de todos os dispositivos"
        perigo
        carregando={saindo}
        aoConfirmar={() => void sairDeTodos()}
      />
    </>
  );
}
