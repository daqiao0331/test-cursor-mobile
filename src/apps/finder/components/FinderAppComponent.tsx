import { WindowFrame } from "@/components/layout/WindowFrame";
import { FinderMenuBar } from "./FinderMenuBar";
import { AppProps } from "@/apps/base/types";
import { useFinderLogic } from "../hooks/useFinderLogic";
import { HelpDialog } from "@/components/dialogs/HelpDialog";
import { AboutDialog } from "@/components/dialogs/AboutDialog";
import { appMetadata } from "..";

export function FinderAppComponent({
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
    currentPath,
    setCurrentPath,
  } = useFinderLogic({ isWindowOpen, isForeground, instanceId });

  const menuBar = (
    <FinderMenuBar
      onClose={onClose}
      onShowHelp={() => setIsHelpDialogOpen(true)}
      onShowAbout={() => setIsAboutDialogOpen(true)}
    />
  );

  if (!isWindowOpen) return null;

  return (
    <>
      {!isXpTheme && isForeground && menuBar}
      <WindowFrame
        title={t("apps.finder.title")}
        onClose={onClose}
        isForeground={isForeground}
        appId="finder"
        skipInitialSound={skipInitialSound}
        instanceId={instanceId}
        menuBar={isXpTheme ? menuBar : undefined}
      >
        <div className="flex flex-col h-full bg-white">
          {/* Sidebar + Content Layout */}
          <div className="flex flex-1">
            {/* Sidebar */}
            <div className="w-48 border-r border-gray-200 bg-gray-50 p-2">
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-2 px-2">
                Quick Access
              </h3>
              <button
                onClick={() => setCurrentPath("/")}
                className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-200 ${currentPath === "/" ? "bg-blue-100 text-blue-700" : ""}`}
              >
                📁 Root
              </button>
              <button
                onClick={() => setCurrentPath("/Documents")}
                className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-200 ${currentPath === "/Documents" ? "bg-blue-100 text-blue-700" : ""}`}
              >
                📄 Documents
              </button>
              <button
                onClick={() => setCurrentPath("/Pictures")}
                className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-200 ${currentPath === "/Pictures" ? "bg-blue-100 text-blue-700" : ""}`}
              >
                🖼️ Pictures
              </button>
            </div>
            {/* File List */}
            <div className="flex-1 p-4">
              <div className="text-sm text-gray-500 mb-4">
                📍 {currentPath}
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="flex flex-col items-center gap-1 p-2 rounded hover:bg-gray-100 cursor-pointer">
                  <span className="text-3xl">📁</span>
                  <span className="text-xs text-center">Documents</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 rounded hover:bg-gray-100 cursor-pointer">
                  <span className="text-3xl">📁</span>
                  <span className="text-xs text-center">Pictures</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 rounded hover:bg-gray-100 cursor-pointer">
                  <span className="text-3xl">📁</span>
                  <span className="text-xs text-center">Music</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 rounded hover:bg-gray-100 cursor-pointer">
                  <span className="text-3xl">📄</span>
                  <span className="text-xs text-center">readme.txt</span>
                </div>
              </div>
            </div>
          </div>
          {/* Status Bar */}
          <div className="border-t border-gray-200 px-3 py-1 text-xs text-gray-500">
            4 items
          </div>
        </div>
      </WindowFrame>
      <HelpDialog
        isOpen={isHelpDialogOpen}
        onOpenChange={setIsHelpDialogOpen}
        appId="finder"
        helpItems={translatedHelpItems}
      />
      <AboutDialog
        isOpen={isAboutDialogOpen}
        onOpenChange={setIsAboutDialogOpen}
        metadata={appMetadata}
        appId="finder"
      />
    </>
  );
}
