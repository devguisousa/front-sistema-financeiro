import { Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Empty,
  ErroCarregar,
  Pagination,
  Select,
  Skeleton,
} from "../../components/ui";
import { formatarData } from "../../lib/datas";
import { mensagemDoErro } from "../../lib/erros";
import type { Papel, Usuario } from "../../lib/tipos";
import { useAuth } from "../../lib/useAuth";
import { FormUsuario } from "./FormUsuario";
import { useListaUsuarios, useMudarPapel, useRemoverUsuario } from "./useUsuarios";

/** Só para ADMIN. Na própria linha não há ações (evita se trancar fora). */
export function SecaoUsuarios() {
  const { usuario: eu } = useAuth();
  const [pagina, setPagina] = useState(1);
  const lista = useListaUsuarios(pagina);
  const mudarPapel = useMudarPapel();
  const remover = useRemoverUsuario();
  const [paraRemover, setParaRemover] = useState<Usuario | null>(null);

  async function trocarPapel(u: Usuario, papel: Papel) {
    try {
      await mudarPapel.mutateAsync({ id: u.id, papel });
      toast.success(`${u.email} agora é ${papel}`);
    } catch (erro) {
      toast.error(mensagemDoErro(erro));
    }
  }

  async function confirmarRemover() {
    if (!paraRemover) return;
    try {
      await remover.mutateAsync(paraRemover.id);
      toast.success("Usuário removido");
    } catch (erro) {
      toast.error(mensagemDoErro(erro));
    }
    setParaRemover(null);
  }

  return (
    <Card aria-labelledby="titulo-usuarios" className="flex min-w-0 flex-col">
      <div className="flex flex-col gap-2 px-6 pt-6 pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="titulo-usuarios" className="text-[18px] font-semibold tracking-[-.02em]">
            Usuários
          </h2>
          <Badge tom="verde">Só ADMIN</Badge>
        </div>
        <p className="text-[13px] text-musgo">
          USUARIO vê tudo e faz lançamentos. ADMIN faz tudo, inclusive cadastros e estornos.
        </p>
      </div>

      <div className="border-y border-superficie-3 bg-[#080B09] px-6 py-5">
        <FormUsuario />
      </div>

      {lista.isError ? (
        <ErroCarregar erro={lista.error} aoTentar={() => void lista.refetch()} />
      ) : !lista.data ? (
        <div className="flex flex-col gap-2 p-6" aria-hidden="true">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : lista.data.itens.length === 0 ? (
        <Empty icone={Users} titulo="Nenhum usuário" />
      ) : (
        <>
          <ul className="flex flex-col">
            {lista.data.itens.map((u) => {
              const souEu = u.id === eu?.id;
              return (
                <li
                  key={u.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-t border-superficie-2 px-6 py-3 first:border-t-0"
                >
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate">
                      {u.email}
                      {souEu && <span className="ml-2 text-[12px] text-musgo">(você)</span>}
                    </span>
                    <span className="font-mono text-[12px] text-musgo">Desde {formatarData(u.criadoEm)}</span>
                  </span>
                  {souEu ? (
                    <Badge tom={u.papel === "ADMIN" ? "verde" : "neutro"}>{u.papel}</Badge>
                  ) : (
                    <span className="flex items-center gap-2">
                      <label htmlFor={`papel-${u.id}`} className="sr-only">
                        Papel de {u.email}
                      </label>
                      <Select
                        id={`papel-${u.id}`}
                        value={u.papel}
                        disabled={mudarPapel.isPending}
                        onChange={(e) => void trocarPapel(u, e.target.value as Papel)}
                        className="w-36 [&_select]:min-h-10 [&_select]:rounded-full [&_select]:text-[13px]"
                      >
                        <option value="USUARIO">USUARIO</option>
                        <option value="ADMIN">ADMIN</option>
                      </Select>
                      <Button
                        tamanho="icone"
                        variante="fantasma"
                        aria-label={`Remover ${u.email}`}
                        onClick={() => setParaRemover(u)}
                        className="hover:text-coral"
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </Button>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          <Pagination pagina={lista.data.pagina} totalPaginas={lista.data.totalPaginas} aoMudar={setPagina} />
        </>
      )}

      <ConfirmDialog
        aberto={paraRemover !== null}
        aoMudar={(aberto) => !aberto && setParaRemover(null)}
        titulo={`Remover ${paraRemover?.email ?? ""}?`}
        descricao="A pessoa perde o acesso na hora e todos os dados financeiros dela (contas, categorias, transações, contas a pagar e a receber) são apagados. Não dá para desfazer."
        textoConfirmar="Remover"
        perigo
        carregando={remover.isPending}
        aoConfirmar={() => void confirmarRemover()}
      />
    </Card>
  );
}
