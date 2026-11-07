import type { Usuario } from "../lib/tipos";

export const ADMIN: Usuario = {
  id: 1,
  email: "admin@fluxo.dev",
  papel: "ADMIN",
  criadoEm: "2026-11-01T12:00:00.000Z",
};

export const USUARIO: Usuario = {
  id: 2,
  email: "ana@fluxo.dev",
  papel: "USUARIO",
  criadoEm: "2026-11-02T12:00:00.000Z",
};
