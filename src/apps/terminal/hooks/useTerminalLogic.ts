import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTranslatedHelpItems } from "@/hooks/useTranslatedHelpItems";
import { useThemeStore } from "@/stores/useThemeStore";
import { helpItems } from "..";

interface TerminalLine {
  type: "input" | "output";
  content: string;
}

const COMMANDS: Record<string, (args: string[]) => string> = {
  help: () =>
    "Available commands: help, clear, echo, date, whoami, ls, pwd",
  date: () => new Date().toString(),
  whoami: () => "guest",
  ls: () => "Documents  Pictures  Music  readme.txt",
  pwd: () => "/home/guest",
  echo: (args) => args.join(" "),
};

export function useTerminalLogic({
  instanceId,
}: {
  instanceId: string;
  isWindowOpen: boolean;
  isForeground: boolean;
}) {
  const { t } = useTranslation();
  const translatedHelpItems = useTranslatedHelpItems("terminal", helpItems);
  const currentTheme = useThemeStore((state) => state.current);
  const isXpTheme = currentTheme === "xp" || currentTheme === "win98";

  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const [isAboutDialogOpen, setIsAboutDialogOpen] = useState(false);
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: "output", content: "Welcome to ryOS Terminal. Type 'help' for available commands." },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const handleCommand = useCallback((cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    const parts = trimmed.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    const newLines: TerminalLine[] = [{ type: "input", content: `$ ${trimmed}` }];

    if (command === "clear") {
      setLines([]);
      setInput("");
      return;
    }

    const handler = COMMANDS[command];
    if (handler) {
      newLines.push({ type: "output", content: handler(args) });
    } else {
      newLines.push({
        type: "output",
        content: `command not found: ${command}`,
      });
    }

    setLines((prev) => [...prev, ...newLines]);
    setInput("");
  }, []);

  const handleClear = useCallback(() => {
    setLines([]);
  }, []);

  return {
    t,
    translatedHelpItems,
    isXpTheme,
    isHelpDialogOpen,
    setIsHelpDialogOpen,
    isAboutDialogOpen,
    setIsAboutDialogOpen,
    lines,
    input,
    setInput,
    handleCommand,
    handleClear,
    bottomRef,
    instanceId,
  };
}
