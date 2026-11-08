import { UserPlus } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button, CampoSenha, Field, Input } from "../../components/ui";
import { separarErros } from "../../lib/erros";
import { erroDeNovaSenha } from "../../lib/senha";
import { useAuth } from "../../lib/useAuth";

/** Cadastro aberto: cada pessoa cria a própria conta, com dados só dela. */
export function FormCadastro({ aoVoltar }: { aoVoltar(): void }) {
  const { cadastrar } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [geral, setGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const erros: Record<string, string> = {};
    if (!email.trim()) erros.email = "Informe o e-mail.";
    const erroSenha = erroDeNovaSenha(senha);
    if (erroSenha) erros.senha = erroSenha;
    else if (senha !== confirmar) erros.confirmar = "As senhas não conferem.";
    setCampos(erros);
    setGeral(null);
    if (Object.keys(erros).length) return;

    setEnviando(true);
    try {
      await cadastrar(email.trim(), senha);
    } catch (erro) {
      setEnviando(false);
      const separados = separarErros(erro);
      setCampos(separados.campos);
      setGeral(separados.geral);
    }
  }

  return (
    <form onSubmit={enviar} noValidate aria-labelledby="titulo-cadastro" className="flex flex-col gap-5">
      <div className="flex flex-col gap-2.5">
        <h2 id="titulo-cadastro" className="text-[28px] leading-tight font-semibold tracking-[-.04em]">
          Criar conta
        </h2>
        <p className="text-musgo">Seus dados financeiros ficam só na sua conta. Ninguém mais vê.</p>
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
          />
        )}
      </Field>

      <Field rotulo="Senha" erro={campos.senha} dica="Pelo menos 8 caracteres.">
        {(props) => (
          <CampoSenha
            {...props}
            autoComplete="new-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        )}
      </Field>

      <Field rotulo="Confirmar senha" erro={campos.confirmar}>
        {(props) => (
          <CampoSenha
            {...props}
            autoComplete="new-password"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
          />
        )}
      </Field>

      <Button type="submit" variante="primario" carregando={enviando} className="min-h-[52px] w-full text-[15px]">
        <UserPlus size={16} aria-hidden="true" />
        Criar conta
      </Button>

      <button type="button" onClick={aoVoltar} className="text-[13px] text-musgo underline">
        Já tenho conta
      </button>
    </form>
  );
}
