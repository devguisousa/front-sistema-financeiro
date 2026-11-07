import { UserPlus } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button, CampoSenha, Field, Input, Select } from "../../components/ui";
import { tratarErroDeFormulario } from "../../lib/formulario";
import { erroDeNovaSenha } from "../../lib/senha";
import type { Papel } from "../../lib/tipos";
import { useCadastrarUsuario } from "./useUsuarios";

export function FormUsuario() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [papel, setPapel] = useState<Papel>("USUARIO");
  const [campos, setCampos] = useState<Record<string, string>>({});
  const cadastrar = useCadastrarUsuario();

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const erros: Record<string, string> = {};
    if (!email.trim()) erros.email = "Informe o e-mail.";
    const erroSenha = erroDeNovaSenha(senha);
    if (erroSenha) erros.senha = erroSenha;
    setCampos(erros);
    if (Object.keys(erros).length) return;

    try {
      await cadastrar.mutateAsync({ email: email.trim(), senha, papel });
      toast.success("Usuário cadastrado");
      setEmail("");
      setSenha("");
      setPapel("USUARIO");
    } catch (erro) {
      tratarErroDeFormulario(erro, setCampos);
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="grid items-start gap-4 md:grid-cols-[1.4fr_1fr_.8fr_auto]">
      <Field rotulo="E-mail" erro={campos.email}>
        {(props) => (
          <Input
            {...props}
            type="email"
            autoComplete="off"
            placeholder="pessoa@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        )}
      </Field>
      <Field rotulo="Senha provisória" erro={campos.senha}>
        {(props) => (
          <CampoSenha {...props} autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} />
        )}
      </Field>
      <Field rotulo="Papel" erro={campos.papel}>
        {(props) => (
          <Select {...props} value={papel} onChange={(e) => setPapel(e.target.value as Papel)}>
            <option value="USUARIO">USUARIO</option>
            <option value="ADMIN">ADMIN</option>
          </Select>
        )}
      </Field>
      <Button type="submit" variante="primario" carregando={cadastrar.isPending} className="min-h-11 md:mt-[27px]">
        <UserPlus size={16} aria-hidden="true" />
        Cadastrar
      </Button>
    </form>
  );
}
