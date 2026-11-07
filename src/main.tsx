import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "@fontsource/instrument-serif/400-italic.css";
import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { rotas } from "./App";
import { Provedores } from "./Provedores";
import { criarQueryClient } from "./lib/queryClient";

const queryClient = criarQueryClient();
const router = createBrowserRouter(rotas);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provedores queryClient={queryClient}>
      <RouterProvider router={router} />
    </Provedores>
  </StrictMode>,
);
