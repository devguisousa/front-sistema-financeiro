import { useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button, CampoSenha, Field, Input } from "../../components/ui";
import { ErroApi, mensagemDoErro, separarErros } from "../../lib/erros";
import { chaves } from "../../lib/queryClient";
import { erroDeNovaSenha } from "../../lib/senha";
import { useAuth } from "../../lib/useAuth";

/** Aparece só enquanto o banco não tem nenhum ADMIN. */
export function FormPrimeiroAdmin() {
  const { criarPrimeiroAdmin } = useAuth();
  const queryClient = useQueryClient();
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
      await criarPrimeiroAdmin(email.trim(), senha);
    } catch (erro) {
      setEnviando(false);
      // Alguém criou o admin antes: volta para o login
      if (erro instanceof ErroApi && erro.codigo === "JÁ EXISTE UM ADMINISTRADOR") {
        toast.info(mensagemDoErro(erro));
        await queryClient.invalidateQueries({ queryKey: chaves.statusAuth });
        return;
      }
      const separados = separarErros(erro);
      setCampos(separados.campos);
      setGeral(separados.geral);
    }
  }

  return (
    <form onSubmit={enviar} noValidate aria-labelledby="titulo-primeiro" className="flex flex-col gap-5">
      <div className="flex flex-col gap-2.5">
        <span className="kicker">Primeiro acesso</span>
        <h2 id="titulo-primeiro" className="text-[28px] leading-tight font-semibold tracking-[-.04em]">
          Criar conta de administrador
        </h2>
        <p className="text-musgo">
          O sistema ainda não tem administrador. Esta conta pode tudo, inclusive cadastrar as
          outras pessoas. Isso só acontece uma vez.
        </p>
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
        <ShieldCheck size={16} aria-hidden="true" />
        Criar administrador
      </Button>
    </form>
  );
}
