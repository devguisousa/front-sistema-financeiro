import { expect, it } from "vitest";
import { cn } from "./cn";

it("junta classes e a última do mesmo grupo vence", () => {
  const desligado = false;
  expect(cn("px-2", desligado && "x", "px-4")).toBe("px-4");
});
