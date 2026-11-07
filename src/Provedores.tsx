import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "./lib/auth";

/** Cache, sessão e toasts. O roteador fica dentro (main.tsx e testes). */
export function Provedores({
  queryClient,
  children,
}: {
  queryClient: QueryClient;
  children: ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
      <Toaster
        theme="dark"
        position="top-right"
        richColors
        closeButton
        toastOptions={{ className: "font-sans" }}
      />
    </QueryClientProvider>
  );
}
