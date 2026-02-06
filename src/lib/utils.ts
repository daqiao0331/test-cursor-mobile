import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resolve a public asset path with the Vite base URL prefix.
 * Ensures assets work correctly when deployed under a sub-path (e.g. GitHub Pages).
 */
export function assetPath(path: string): string {
  const base = import.meta.env.BASE_URL || "/";
  // Remove leading slash from path if base already ends with one
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${base}${cleanPath}`;
}
