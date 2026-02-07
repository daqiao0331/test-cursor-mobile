import { createContext } from "react";
import { type ThemeId } from "@/stores/useThemeStore";

export interface ThemeContextValue {
  osTheme: ThemeId;
  setTheme: (theme: ThemeId) => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  osTheme: "system7",
  setTheme: () => {},
});
