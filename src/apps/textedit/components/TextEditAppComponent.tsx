import { WindowFrame } from "@/components/layout/WindowFrame";
import { TextEditMenuBar } from "./TextEditMenuBar";
import { AppProps } from "@/apps/base/types";
import { useTextEditLogic } from "../hooks/useTextEditLogic";
import { HelpDialog } from "@/components/dialogs/HelpDialog";
import { AboutDialog } from "@/components/dialogs/AboutDialog";
import { appMetadata } from "..";

export function TextEditAppComponent({
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
    text,
    setText,
    wordCount,
    charCount,
    handleNew,
  } = useTextEditLogic({ isWindowOpen, isForeground, instanceId });

  const menuBar = (
    <TextEditMenuBar
      onClose={onClose}
      onShowHelp={() => setIsHelpDialogOpen(true)}
      onShowAbout={() => setIsAboutDialogOpen(true)}
      onNew={handleNew}
    />
  );

  if (!isWindowOpen) return null;

  return (
    <>
      {!isXpTheme && isForeground && menuBar}
      <WindowFrame
        title={t("apps.textedit.title")}
        onClose={onClose}
        isForeground={isForeground}
        appId="textedit"
        skipInitialSound={skipInitialSound}
        instanceId={instanceId}
        menuBar={isXpTheme ? menuBar : undefined}
      >
        <div className="flex flex-col h-full bg-white">
          <textarea
            className="flex-1 w-full p-3 resize-none border-none outline-none font-mono text-sm"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Start typing..."
          />
          <div className="border-t border-gray-200 px-3 py-1 text-xs text-gray-500 flex justify-between">
            <span>{wordCount} words</span>
            <span>{charCount} characters</span>
          </div>
        </div>
      </WindowFrame>
      <HelpDialog
        isOpen={isHelpDialogOpen}
        onOpenChange={setIsHelpDialogOpen}
        appId="textedit"
        helpItems={translatedHelpItems}
      />
      <AboutDialog
        isOpen={isAboutDialogOpen}
        onOpenChange={setIsAboutDialogOpen}
        metadata={appMetadata}
        appId="textedit"
      />
    </>
  );
}
