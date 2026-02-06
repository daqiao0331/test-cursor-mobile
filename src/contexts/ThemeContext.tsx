import { createContext } from "react";
import { useThemeStore, type ThemeId } from "@/stores/useThemeStore";

interface ThemeContextValue {
  osTheme: ThemeId;
  setTheme: (theme: ThemeId) => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  osTheme: "system7",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const current = useThemeStore((s) => s.current);
  const setTheme = useThemeStore((s) => s.setTheme);
  return (
    <ThemeContext.Provider value={{ osTheme: current, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

