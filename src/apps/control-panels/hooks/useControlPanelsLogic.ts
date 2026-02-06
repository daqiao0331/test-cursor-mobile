import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTranslatedHelpItems } from "@/hooks/useTranslatedHelpItems";
import { useThemeStore, type ThemeId } from "@/stores/useThemeStore";
import { helpItems } from "..";

interface ThemeOption {
  id: ThemeId;
  name: string;
  description: string;
  emoji: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "system7",
    name: "System 7",
    description: "Classic Macintosh look",
    emoji: "🖥️",
  },
  {
    id: "macosx",
    name: "macOS Aqua",
    description: "Modern macOS appearance",
    emoji: "🍎",
  },
  {
    id: "xp",
    name: "Windows XP",
    description: "Luna theme experience",
    emoji: "🪟",
  },
  {
    id: "win98",
    name: "Windows 98",
    description: "Classic Windows style",
    emoji: "💾",
  },
];

export function useControlPanelsLogic({
  instanceId,
}: {
  instanceId: string;
  isWindowOpen: boolean;
  isForeground: boolean;
}) {
  const { t } = useTranslation();
  const translatedHelpItems = useTranslatedHelpItems("control-panels", helpItems);
  const currentTheme = useThemeStore((state) => state.current);
  const setTheme = useThemeStore((state) => state.setTheme);
  const isXpTheme = currentTheme === "xp" || currentTheme === "win98";

  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const [isAboutDialogOpen, setIsAboutDialogOpen] = useState(false);

  return {
    t,
    translatedHelpItems,
    isXpTheme,
    isHelpDialogOpen,
    setIsHelpDialogOpen,
    isAboutDialogOpen,
    setIsAboutDialogOpen,
    currentTheme,
    setTheme,
    themeOptions: THEME_OPTIONS,
    instanceId,
  };
}
