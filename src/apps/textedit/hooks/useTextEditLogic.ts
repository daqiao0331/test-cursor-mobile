import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useTranslatedHelpItems } from "@/hooks/useTranslatedHelpItems";
import { useThemeStore } from "@/stores/useThemeStore";
import { helpItems } from "..";

export function useTextEditLogic({
  instanceId,
}: {
  instanceId: string;
  isWindowOpen: boolean;
  isForeground: boolean;
}) {
  const { t } = useTranslation();
  const translatedHelpItems = useTranslatedHelpItems("textedit", helpItems);
  const currentTheme = useThemeStore((state) => state.current);
  const isXpTheme = currentTheme === "xp" || currentTheme === "win98";

  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const [isAboutDialogOpen, setIsAboutDialogOpen] = useState(false);
  const [text, setText] = useState("");

  const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  const charCount = text.length;

  const handleNew = useCallback(() => {
    setText("");
  }, []);

  return {
    t,
    translatedHelpItems,
    isXpTheme,
    isHelpDialogOpen,
    setIsHelpDialogOpen,
    isAboutDialogOpen,
    setIsAboutDialogOpen,
    text,
    setText,
    wordCount,
    charCount,
    handleNew,
    instanceId,
  };
}
