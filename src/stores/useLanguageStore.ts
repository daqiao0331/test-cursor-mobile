import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LanguageState {
  current: string;
  setLanguage: (lang: string) => void;
  hydrate: () => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      current: "en",
      setLanguage: (lang) => set({ current: lang }),
      hydrate: () => {
        const stored = localStorage.getItem("language-storage");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            const lang = parsed?.state?.current || "en";
            set({ current: lang });
          } catch {
            // Use default
          }
        }
      },
    }),
    { name: "language-storage" }
  )
);
