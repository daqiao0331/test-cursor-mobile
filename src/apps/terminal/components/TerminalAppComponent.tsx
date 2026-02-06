import { WindowFrame } from "@/components/layout/WindowFrame";
import { TerminalMenuBar } from "./TerminalMenuBar";
import { AppProps } from "@/apps/base/types";
import { useTerminalLogic } from "../hooks/useTerminalLogic";
import { HelpDialog } from "@/components/dialogs/HelpDialog";
import { AboutDialog } from "@/components/dialogs/AboutDialog";
import { appMetadata } from "..";

export function TerminalAppComponent({
  isWindowOpen,
  onClose,
  isForeground,
  skipInitialSound,
  instanceId,
}: AppProps) {
  const {
    t,
    translatedHelpItems,
    isHelpDialogOpen,
    setIsHelpDialogOpen,
    isAboutDialogOpen,
    setIsAboutDialogOpen,
    isXpTheme,
    lines,
    input,
    setInput,
    handleCommand,
    handleClear,
    bottomRef,
  } = useTerminalLogic({ isWindowOpen, isForeground, instanceId });

  const menuBar = (
    <TerminalMenuBar
      onClose={onClose}
      onShowHelp={() => setIsHelpDialogOpen(true)}
      onShowAbout={() => setIsAboutDialogOpen(true)}
      onClear={handleClear}
    />
  );

  if (!isWindowOpen) return null;

  return (
    <>
      {!isXpTheme && isForeground && menuBar}
      <WindowFrame
        title={t("apps.terminal.title")}
        onClose={onClose}
        isForeground={isForeground}
        appId="terminal"
        skipInitialSound={skipInitialSound}
        instanceId={instanceId}
        menuBar={isXpTheme ? menuBar : undefined}
      >
        <div className="flex flex-col h-full bg-black text-green-400 font-mono text-sm">
          <div className="flex-1 overflow-y-auto p-3">
            {lines.map((line, i) => (
              <div key={i} className={line.type === "input" ? "text-green-300" : "text-green-500"}>
                {line.content}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="flex items-center border-t border-green-800 px-3 py-2">
            <span className="mr-2">$</span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCommand(input);
                }
              }}
              className="flex-1 bg-transparent border-none outline-none text-green-400 font-mono text-sm"
              autoFocus
            />
          </div>
        </div>
      </WindowFrame>
      <HelpDialog
        isOpen={isHelpDialogOpen}
        onOpenChange={setIsHelpDialogOpen}
        appId="terminal"
        helpItems={translatedHelpItems}
      />
      <AboutDialog
        isOpen={isAboutDialogOpen}
        onOpenChange={setIsAboutDialogOpen}
        metadata={appMetadata}
        appId="terminal"
      />
    </>
  );
}
