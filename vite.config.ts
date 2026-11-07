import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

// CSP só no build: no dev o HMR do Vite usa script inline.
// 'unsafe-inline' em style é exigido pelo Recharts (estilos inline nos gráficos).
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

function cspNoBuild(): Plugin {
  return {
    name: "fluxo-csp",
    apply: "build",
    transformIndexHtml: () => [
      {
        tag: "meta",
        attrs: { "http-equiv": "Content-Security-Policy", content: CSP },
        injectTo: "head-prepend",
      },
    ],
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), cspNoBuild()],
  server: {
    proxy: {
      // O front chama /api/...; o Vite repassa para a API sem o prefixo
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (caminho) => caminho.replace(/^\/api/, ""),
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["src/test/setup.ts"],
    css: false,
    // Os testes de data assumem o fuso de Brasília
    env: { TZ: "America/Sao_Paulo" },
  },
});
