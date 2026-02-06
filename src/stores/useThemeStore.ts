import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeId = "system7" | "macosx" | "xp" | "win98";

interface ThemeState {
  current: ThemeId;
  setTheme: (theme: ThemeId) => void;
  hydrate: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      current: "system7",
      setTheme: (theme) => {
        set({ current: theme });
        document.documentElement.setAttribute("data-theme", theme);
      },
      hydrate: () => {
        const stored = localStorage.getItem("theme-storage");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            const theme = parsed?.state?.current || "system7";
            document.documentElement.setAttribute("data-theme", theme);
          } catch {
            document.documentElement.setAttribute("data-theme", "system7");
          }
        } else {
          document.documentElement.setAttribute("data-theme", "system7");
        }
      },
    }),
    { name: "theme-storage" }
  )
);
