import { type FormEvent, useState } from "react";
import { Button, Card, Field, Input, Segmentado } from "../../components/ui";
import {
  ATALHOS,
  type Atalho,
  atalhoDoPeriodo,
  erroDoPeriodo,
  formatarDia,
  type Periodo,
  periodoDoAtalho,
} from "./periodos";

/**
 * Atalhos + datas livres. As datas só valem ao clicar em "Ver período".
 * Use `key` com o período para o formulário voltar às datas aplicadas.
 */
export function FiltroPeriodo({
  periodo,
  agora,
  aoMudar,
  descricao,
}: {
  periodo: Periodo;
  agora: Date;
  aoMudar(periodo: Periodo): void;
  descricao?: string;
}) {
  const [de, setDe] = useState(periodo.de);
  const [ate, setAte] = useState(periodo.ate);
  const [erro, setErro] = useState<string | null>(null);

  function aplicar(evento: FormEvent) {
    evento.preventDefault();
    const escolhido = { de, ate };
    const mensagem = erroDoPeriodo(escolhido);
    setErro(mensagem);
    if (!mensagem) aoMudar(escolhido);
  }

  const atalho: Atalho | "" = atalhoDoPeriodo(periodo, agora) ?? "";

  return (
    <Card aria-labelledby="titulo-periodo" className="flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="titulo-periodo" className="text-[16px] font-semibold tracking-[-.02em]">
            Período
          </h2>
          {descricao && <p className="text-[13px] text-musgo">{descricao}</p>}
        </div>
        <span className="font-mono text-[12px] text-musgo">
          {formatarDia(periodo.de)} a {formatarDia(periodo.ate)}
        </span>
      </div>

      <Segmentado<Atalho | "">
        rotulo="Atalhos de período"
        valor={atalho}
        aoMudar={(valor) => valor && aoMudar(periodoDoAtalho(valor, agora))}
        opcoes={ATALHOS}
        className="self-start"
      />

      <form onSubmit={aplicar} noValidate className="flex flex-col gap-2">
        <div className="flex flex-wrap items-end gap-3">
          <Field rotulo="De" className="w-[170px]">
            {(props) => (
              <Input
                {...props}
                {...(erro ? { "aria-invalid": true } : {})}
                type="date"
                value={de}
                onChange={(e) => setDe(e.target.value)}
              />
            )}
          </Field>
          <Field rotulo="Até" className="w-[170px]">
            {(props) => (
              <Input
                {...props}
                {...(erro ? { "aria-invalid": true } : {})}
                type="date"
                value={ate}
                onChange={(e) => setAte(e.target.value)}
              />
            )}
          </Field>
          <Button type="submit">Ver período</Button>
        </div>
        {erro && (
          <p role="alert" className="text-[12px] text-coral">
            {erro}
          </p>
        )}
      </form>
    </Card>
  );
}
