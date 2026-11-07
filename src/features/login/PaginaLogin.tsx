import { useQuery } from "@tanstack/react-query";
import { RotateCw, WifiOff } from "lucide-react";
import { Navigate, useLocation } from "react-router";
import { Button, Skeleton } from "../../components/ui";
import { requisicao } from "../../lib/api";
import { mensagemDoErro } from "../../lib/erros";
import { chaves } from "../../lib/queryClient";
import { useTitulo } from "../../lib/titulo";
import { useAuth } from "../../lib/useAuth";
import { Logo } from "../../layouts/Logo";
import { TelaCarregando } from "../../layouts/RotaProtegida";
import { FormLogin } from "./FormLogin";
import { FormPrimeiroAdmin } from "./FormPrimeiroAdmin";
import { LetreiroMarca } from "./LetreiroMarca";

type EstadoDaRota = { de?: { pathname?: string } } | null;

function Formulario() {
  const status = useQuery({
    queryKey: chaves.statusAuth,
    queryFn: () => requisicao<{ precisaAdmin: boolean }>("/auth/status", { publica: true }),
  });

  if (status.isPending) {
    return (
      <div className="flex flex-col gap-5" aria-hidden="true">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-[50px] w-full" />
        <Skeleton className="h-[50px] w-full" />
        <Skeleton className="h-[52px] w-full rounded-full" />
      </div>
    );
  }

  if (status.isError) {
    return (
      <div className="flex flex-col items-start gap-4">
        <WifiOff size={22} className="text-coral" aria-hidden="true" />
        <p role="alert" className="text-[15px]">
          {mensagemDoErro(status.error)}
        </p>
        <Button onClick={() => void status.refetch()} carregando={status.isFetching}>
          <RotateCw size={14} aria-hidden="true" />
          Tentar de novo
        </Button>
      </div>
    );
  }

  return status.data.precisaAdmin ? <FormPrimeiroAdmin /> : <FormLogin />;
}

export function PaginaLogin() {
  useTitulo("Entrar");
  const { usuario, carregando } = useAuth();
  const location = useLocation();

  if (carregando) return <TelaCarregando />;
  if (usuario) {
    const destino = (location.state as EstadoDaRota)?.de?.pathname ?? "/";
    return <Navigate to={destino === "/entrar" ? "/" : destino} replace />;
  }

  return (
    <div className="relative flex min-h-dvh flex-wrap overflow-hidden bg-abismo">
      <div className="fundo-grade h-full" aria-hidden="true" />
      <div className="halo -bottom-[420px] -left-[200px] h-[700px] w-[900px]" aria-hidden="true" />
      <div className="halo -top-[200px] -right-[120px] h-[420px] w-[520px] opacity-60" aria-hidden="true" />

      {/* Painel da marca: só no desktop */}
      <section
        aria-label="Fluxo"
        className="relative hidden min-w-0 flex-[1.25_1_560px] flex-col justify-between gap-12 px-[clamp(20px,4vw,64px)] pt-10 pb-8 lg:flex"
      >
        <div className="flex items-center justify-between gap-4">
          <Logo tamanho={30} />
          <span className="font-mono text-[12px] text-musgo-2">v1.0 · controle financeiro</span>
        </div>

        <div className="relative flex max-w-[720px] flex-col gap-7">
          <span className="kicker">Controle financeiro</span>
          <h1 className="text-[clamp(48px,6.4vw,96px)] leading-[.95] font-semibold tracking-[-.055em]">
            Dinheiro que
            <br />
            <span className="destaque text-[1.12em] tracking-[-.02em] text-verde">flui</span>, conta que
            fecha.
          </h1>
          <p className="max-w-[520px] text-[17px] leading-relaxed text-musgo">
            Contas, transações, transferências e o que você tem a pagar e a receber — num lugar só,
            com saldo que nunca fica negativo.
          </p>
        </div>

        <LetreiroMarca />
      </section>

      <main className="relative flex min-w-0 flex-[1_1_420px] flex-col items-center justify-center gap-8 bg-[linear-gradient(180deg,rgb(6_8_7/.6),rgb(6_8_7/.9))] px-[clamp(20px,4vw,64px)] py-10 lg:border-l lg:border-[#121915]">
        <div className="lg:hidden">
          <Logo tamanho={30} />
        </div>
        <div className="borda-viva w-full max-w-[420px] rounded-3xl p-[clamp(24px,5vw,36px)] shadow-[0_40px_80px_-40px_#000]">
          <Formulario />
        </div>
      </main>
    </div>
  );
}
