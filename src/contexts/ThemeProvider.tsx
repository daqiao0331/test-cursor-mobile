import { ThemeContext } from "./ThemeContext";
import { useThemeStore } from "@/stores/useThemeStore";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const current = useThemeStore((s) => s.current);
  const setTheme = useThemeStore((s) => s.setTheme);
  return (
    <ThemeContext.Provider value={{ osTheme: current, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
