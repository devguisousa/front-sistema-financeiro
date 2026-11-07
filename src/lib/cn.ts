import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Junta classes condicionais; em conflito do Tailwind, a última vence. */
export function cn(...classes: ClassValue[]) {
  return twMerge(clsx(classes));
}
