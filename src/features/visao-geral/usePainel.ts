import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { buscarTodas, normalizarPagina, requisicao } from "../../lib/api";
import { paraCentavos } from "../../lib/dinheiro";
import { chaves } from "../../lib/queryClient";
import type { ContaPagar, ContaReceber, Transacao } from "../../lib/tipos";
import { useContasTodas, useSaldos } from "../contas/useContas";
import {
  buscarTransacoesDaJanela,
  inicioDaJanela,
  proximosVencimentos,
  resumirMeses,
} from "./calculos";

async function buscarVencimentos() {
  // Só o que ainda não foi quitado
  const [pendentes, parciais, aReceber, parciaisReceber] = await Promise.all([
    buscarTodas<ContaPagar>("/contaPagar", "contaPagar", { status: "PENDENTE" }),
    buscarTodas<ContaPagar>("/contaPagar", "contaPagar", { status: "PARCIALMENTE_PAGA" }),
    buscarTodas<ContaReceber>("/contaReceber", "contaReceber", { status: "PENDENTE" }, "pagina"),
    buscarTodas<ContaReceber>(
      "/contaReceber",
      "contaReceber",
      { status: "PARCIALMENTE_RECEBIDA" },
      "pagina",
    ),
  ]);
  return proximosVencimentos([...pendentes, ...parciais], [...aReceber, ...parciaisReceber], new Date());
}

/** Dados da visão geral, bloco a bloco (cada um com seu carregando/erro). */
export function usePainel() {
  const [agora] = useState(() => new Date());
  const inicio = inicioDaJanela(agora);

  const contas = useContasTodas();
  const saldos = useSaldos(contas.data);

  const janela = useQuery({
    queryKey: [...chaves.painel, "janela", inicio.toISOString()],
    queryFn: () => buscarTransacoesDaJanela(inicio),
  });

  const vencimentos = useQuery({
    queryKey: [...chaves.painel, "vencimentos"],
    queryFn: buscarVencimentos,
  });

  const ultimas = useQuery({
    queryKey: [...chaves.transacoes, "ultimas"],
    queryFn: async () =>
      normalizarPagina<Transacao>(
        await requisicao("/transacao", { query: { page: 1, limit: 8 } }),
        "transacao",
      ).itens,
  });

  const meses = janela.data ? resumirMeses(janela.data.itens, agora) : undefined;
  const saldoTotal = saldos.data
    ? Object.values(saldos.data).reduce((soma, s) => soma + paraCentavos(s.saldoAtual), 0)
    : undefined;

  return { agora, contas, saldos, saldoTotal, janela, meses, vencimentos, ultimas };
}
