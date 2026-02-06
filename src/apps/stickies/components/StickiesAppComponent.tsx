import { WindowFrame } from "@/components/layout/WindowFrame";
import { StickiesMenuBar } from "./StickiesMenuBar";
import { AppProps } from "@/apps/base/types";
import { useStickiesLogic } from "../hooks/useStickiesLogic";
import { HelpDialog } from "@/components/dialogs/HelpDialog";
import { AboutDialog } from "@/components/dialogs/AboutDialog";
import { appMetadata } from "..";

const COLOR_MAP: Record<string, string> = {
  yellow: "bg-yellow-200 border-yellow-300",
  pink: "bg-pink-200 border-pink-300",
  blue: "bg-blue-200 border-blue-300",
  green: "bg-green-200 border-green-300",
};

export function StickiesAppComponent({
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
    notes,
    selectedNoteId,
    setSelectedNoteId,
    handleAddNote,
    handleDeleteNote,
    handleUpdateNote,
    handleChangeColor,
  } = useStickiesLogic({ isWindowOpen, isForeground, instanceId });

  const handleSetColor = (color: "yellow" | "pink" | "blue" | "green") => {
    if (selectedNoteId) {
      handleChangeColor(selectedNoteId, color);
    } else {
      handleAddNote(color);
    }
  };

  const menuBar = (
    <StickiesMenuBar
      onClose={onClose}
      onShowHelp={() => setIsHelpDialogOpen(true)}
      onShowAbout={() => setIsAboutDialogOpen(true)}
      onNewNote={() => handleAddNote("yellow")}
      onSetColor={handleSetColor}
    />
  );

  if (!isWindowOpen) return null;

  return (
    <>
      {!isXpTheme && isForeground && menuBar}
      <WindowFrame
        title={t("apps.stickies.title")}
        onClose={onClose}
        isForeground={isForeground}
        appId="stickies"
        skipInitialSound={skipInitialSound}
        instanceId={instanceId}
        menuBar={isXpTheme ? menuBar : undefined}
      >
        <div className="flex flex-col h-full bg-white">
          <div className="p-2 border-b border-gray-200 flex items-center gap-2">
            <button
              onClick={() => handleAddNote("yellow")}
              className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded cursor-pointer"
            >
              + New Note
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-3 auto-rows-min">
            {notes.map((note) => (
              <div
                key={note.id}
                onClick={() => setSelectedNoteId(note.id)}
                className={`relative p-3 rounded border-2 ${COLOR_MAP[note.color]} ${
                  selectedNoteId === note.id ? "ring-2 ring-blue-400" : ""
                }`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNote(note.id);
                  }}
                  className="absolute top-1 right-1 text-gray-500 hover:text-red-500 text-xs cursor-pointer"
                >
                  ✕
                </button>
                <textarea
                  value={note.content}
                  onChange={(e) => handleUpdateNote(note.id, e.target.value)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNoteId(note.id);
                  }}
                  className="w-full h-24 bg-transparent border-none outline-none resize-none text-sm"
                  placeholder="Type a note..."
                />
                <div className="flex gap-1 mt-1">
                  {(["yellow", "pink", "blue", "green"] as const).map((color) => (
                    <button
                      key={color}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChangeColor(note.id, color);
                      }}
                      className={`w-4 h-4 rounded-full border cursor-pointer ${
                        color === "yellow"
                          ? "bg-yellow-300 border-yellow-400"
                          : color === "pink"
                            ? "bg-pink-300 border-pink-400"
                            : color === "blue"
                              ? "bg-blue-300 border-blue-400"
                              : "bg-green-300 border-green-400"
                      } ${note.color === color ? "ring-1 ring-black" : ""}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 px-3 py-1 text-xs text-gray-500">
            {notes.length} {notes.length === 1 ? "note" : "notes"}
          </div>
        </div>
      </WindowFrame>
      <HelpDialog
        isOpen={isHelpDialogOpen}
        onOpenChange={setIsHelpDialogOpen}
        appId="stickies"
        helpItems={translatedHelpItems}
      />
      <AboutDialog
        isOpen={isAboutDialogOpen}
        onOpenChange={setIsAboutDialogOpen}
        metadata={appMetadata}
        appId="stickies"
      />
    </>
  );
}
