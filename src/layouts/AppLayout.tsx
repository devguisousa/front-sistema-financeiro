import { LogOut, Menu, X } from "lucide-react";
import { Dialog } from "radix-ui";
import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
import { useAuth } from "../lib/useAuth";
import { cn } from "../lib/cn";
import { Logo } from "./Logo";
import { GRUPOS_NAV, telaDoCaminho } from "./navegacao";

const hojePorExtenso = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function iniciais(email: string) {
  return email.slice(0, 2).toUpperCase();
}

function Navegacao({ aoNavegar }: { aoNavegar?: () => void }) {
  return (
    <nav aria-label="Navegação principal" className="flex flex-col gap-5">
      {GRUPOS_NAV.map((grupo) => (
        <div key={grupo.titulo} className="flex flex-col gap-0.5">
          <span className="rotulo px-3 pb-2">{grupo.titulo}</span>
          {grupo.itens.map(({ rotulo, caminho, icone: Icone }) => (
            <NavLink
              key={caminho}
              to={caminho}
              end
              onClick={aoNavegar}
              className={({ isActive }) =>
                cn(
                  "group flex min-h-10 items-center gap-3 rounded-[10px] px-3 text-[14px] text-musgo transition-colors duration-200",
                  "hover:bg-[#0E1411] hover:text-nevoa",
                  isActive && "bg-[#0F1713] text-nevoa shadow-[inset_0_0_0_1px_var(--color-linha-2)]",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icone
                    size={18}
                    strokeWidth={1.7}
                    aria-hidden="true"
                    className={cn(isActive && "text-verde")}
                  />
                  <span>{rotulo}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );
}

function CartaoUsuario() {
  const { usuario, sair } = useAuth();
  if (!usuario) return null;

  return (
    <div className="flex items-center gap-3 rounded-[14px] border border-linha bg-superficie p-3.5">
      <span
        aria-hidden="true"
        className="flex size-9 flex-none items-center justify-center rounded-[10px] border border-[#1F3329] bg-[#12201A] font-mono text-[13px] font-semibold text-verde"
      >
        {iniciais(usuario.email)}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-[13px] text-nevoa">{usuario.email}</span>
        <span
          className={cn(
            "inline-flex h-5 items-center self-start rounded-full border px-2 font-mono text-[10px] font-medium tracking-[.04em]",
            usuario.papel === "ADMIN"
              ? "border-verde/30 bg-verde/10 text-verde"
              : "border-linha-3 bg-noite-2 text-nevoa-2",
          )}
        >
          {usuario.papel}
        </span>
      </span>
      <button
        type="button"
        onClick={() => void sair()}
        aria-label="Sair"
        title="Sair"
        className="inline-flex size-10 items-center justify-center rounded-full text-musgo transition-colors hover:bg-[#0F1512] hover:text-nevoa active:scale-[.97]"
      >
        <LogOut size={16} strokeWidth={1.7} aria-hidden="true" />
      </button>
    </div>
  );
}

function ConteudoSidebar({ aoNavegar }: { aoNavegar?: () => void }) {
  return (
    <>
      <NavLink
        to="/"
        onClick={aoNavegar}
        aria-label="Fluxo, ir para a visão geral"
        className="flex items-center px-2.5 py-1.5"
      >
        <Logo />
      </NavLink>
      <Navegacao aoNavegar={aoNavegar} />
      <div className="mt-auto">
        <CartaoUsuario />
      </div>
    </>
  );
}

export function AppLayout() {
  const [menuAberto, setMenuAberto] = useState(false);
  const [hoje] = useState(() => hojePorExtenso.format(new Date()));
  const { pathname } = useLocation();
  const tela = telaDoCaminho(pathname);

  return (
    <div className="min-h-dvh bg-noite">
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-full bg-verde px-4 py-2 font-medium text-tinta focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Pular para o conteúdo
      </a>

      {/* Desktop: sidebar fixa */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[248px] flex-col gap-7 overflow-y-auto border-r border-[#121915] bg-abismo px-4 py-6 lg:flex">
        <ConteudoSidebar />
      </aside>

      {/* Celular: barra no topo + gaveta */}
      <Dialog.Root open={menuAberto} onOpenChange={setMenuAberto}>
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[#121915] bg-abismo/90 px-4 backdrop-blur lg:hidden">
          <NavLink to="/" aria-label="Fluxo, ir para a visão geral">
            <Logo tamanho={22} />
          </NavLink>
          <Dialog.Trigger asChild>
            <button
              type="button"
              aria-label="Abrir menu"
              className="inline-flex size-10 items-center justify-center rounded-full border border-linha-3 bg-noite-2 text-nevoa active:scale-[.97]"
            >
              <Menu size={18} aria-hidden="true" />
            </button>
          </Dialog.Trigger>
        </header>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm data-[state=open]:animate-[fade_.2s_ease] lg:hidden" />
          <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-[min(300px,86vw)] flex-col gap-7 overflow-y-auto border-r border-linha bg-abismo px-4 py-6 data-[state=open]:animate-[gaveta_.22s_ease-out] lg:hidden">
            <Dialog.Title className="sr-only">Menu</Dialog.Title>
            <Dialog.Description className="sr-only">Navegação entre as telas do Fluxo</Dialog.Description>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Fechar menu"
                className="absolute top-5 right-4 inline-flex size-10 items-center justify-center rounded-full text-musgo hover:text-nevoa"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </Dialog.Close>
            <ConteudoSidebar aoNavegar={() => setMenuAberto(false)} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <main
        id="conteudo"
        tabIndex={-1}
        className="relative min-w-0 overflow-hidden px-4 pt-6 pb-16 outline-none sm:px-6 lg:ml-[248px] lg:px-10"
      >
        <div className="fundo-grade" aria-hidden="true" />
        <div className="halo -top-[300px] -right-40 h-[460px] w-[720px]" aria-hidden="true" />
        <div className="relative mx-auto flex max-w-[1240px] flex-col gap-8">
          <div className="flex min-h-10 flex-wrap items-center justify-between gap-4 font-mono text-[12px]">
            <span className="tracking-[.04em] text-musgo-2">
              fluxo <span aria-hidden="true">/</span>{" "}
              <span className="text-nevoa">{tela.toLocaleLowerCase("pt-BR") || "página"}</span>
            </span>
            <span className="text-musgo">{hoje}</span>
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
