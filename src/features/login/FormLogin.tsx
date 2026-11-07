import { ArrowRight, Info, Lock } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button, CampoSenha, Field, Input } from "../../components/ui";
import { separarErros } from "../../lib/erros";
import { useAuth } from "../../lib/useAuth";

export function FormLogin() {
  const { entrar } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [geral, setGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const faltando: Record<string, string> = {};
    if (!email.trim()) faltando.email = "Informe o e-mail.";
    if (!senha) faltando.senha = "Informe a senha.";
    setCampos(faltando);
    setGeral(null);
    if (Object.keys(faltando).length) return;

    setEnviando(true);
    try {
      await entrar(email.trim(), senha);
    } catch (erro) {
      const separados = separarErros(erro);
      setCampos(separados.campos);
      setGeral(separados.geral);
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} noValidate aria-labelledby="titulo-login" className="flex flex-col gap-5">
      <div className="flex flex-col gap-2.5">
        <h2 id="titulo-login" className="text-[30px] font-semibold tracking-[-.04em]">
          Entrar
        </h2>
        <p className="text-musgo">Use o e-mail e a senha que um administrador criou para você.</p>
      </div>

      {geral && (
        <p
          role="alert"
          className="rounded-xl border border-coral/35 bg-coral/10 px-3.5 py-3 text-[13px] text-coral"
        >
          {geral}
        </p>
      )}

      <Field rotulo="E-mail" erro={campos.email}>
        {(props) => (
          <Input
            {...props}
            type="email"
            autoComplete="email"
            placeholder="voce@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-h-[50px]"
          />
        )}
      </Field>

      <Field rotulo="Senha" erro={campos.senha}>
        {(props) => (
          <CampoSenha
            {...props}
            autoComplete="current-password"
            placeholder="Sua senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="min-h-[50px]"
          />
        )}
      </Field>

      <Button type="submit" variante="primario" carregando={enviando} className="min-h-[52px] w-full text-[15px]">
        Entrar
        <ArrowRight size={16} aria-hidden="true" />
      </Button>

      <div className="flex flex-col gap-2.5 border-t border-superficie-3 pt-4 text-[12px] text-musgo">
        <p className="flex items-start gap-1.5">
          <Info size={14} className="mt-0.5 flex-none" aria-hidden="true" />
          Não tem acesso? Peça a um ADMIN — o cadastro não é aberto.
        </p>
        <p className="flex items-start gap-1.5">
          <Lock size={14} className="mt-0.5 flex-none" aria-hidden="true" />
          5 senhas erradas seguidas travam a conta por até 15 min.
        </p>
      </div>
    </form>
  );
}
