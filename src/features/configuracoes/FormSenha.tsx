import { KeyRound, ShieldAlert } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button, CampoSenha, Field } from "../../components/ui";
import { requisicao } from "../../lib/api";
import { ErroApi, mensagemDoErro } from "../../lib/erros";
import { tratarErroDeFormulario } from "../../lib/formulario";
import { erroDeNovaSenha } from "../../lib/senha";
import { useAuth } from "../../lib/useAuth";

export function FormSenha() {
  const { encerrarLocalmente } = useAuth();
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const erros: Record<string, string> = {};
    if (!senhaAtual) erros.senhaAtual = "Informe a senha atual.";
    const erroNova = erroDeNovaSenha(novaSenha);
    if (erroNova) erros.novaSenha = erroNova;
    else if (novaSenha === senhaAtual) erros.novaSenha = "A nova senha deve ser diferente da atual.";
    setCampos(erros);
    if (Object.keys(erros).length) return;

    setEnviando(true);
    try {
      await requisicao("/auth/senha", { metodo: "PUT", corpo: { senhaAtual, novaSenha } });
      // A API encerra todas as sessões, inclusive esta
      toast.success("Senha alterada. Entre de novo com a nova senha.");
      encerrarLocalmente();
    } catch (erro) {
      setEnviando(false);
      if (erro instanceof ErroApi && erro.codigo === "SENHA ATUAL INCORRETA") {
        setCampos({ senhaAtual: mensagemDoErro(erro) });
        return;
      }
      tratarErroDeFormulario(erro, setCampos);
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <span className="rotulo">Trocar senha</span>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field rotulo="Senha atual" erro={campos.senhaAtual}>
          {(props) => (
            <CampoSenha
              {...props}
              autoComplete="current-password"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
            />
          )}
        </Field>
        <Field rotulo="Nova senha" erro={campos.novaSenha}>
          {(props) => (
            <CampoSenha
              {...props}
              autoComplete="new-password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
            />
          )}
        </Field>
      </div>
      <p className="flex items-start gap-1.5 text-[12px] text-musgo">
        <ShieldAlert size={14} className="mt-0.5 flex-none" aria-hidden="true" />
        Pelo menos 8 caracteres. Trocar a senha encerra todas as sessões, inclusive esta.
      </p>
      <Button type="submit" variante="primario" carregando={enviando} className="sm:self-start">
        <KeyRound size={16} aria-hidden="true" />
        Trocar senha
      </Button>
    </form>
  );
}
