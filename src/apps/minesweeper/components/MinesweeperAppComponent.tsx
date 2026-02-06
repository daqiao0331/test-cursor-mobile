import { WindowFrame } from "@/components/layout/WindowFrame";
import { MinesweeperMenuBar } from "./MinesweeperMenuBar";
import { AppProps } from "@/apps/base/types";
import { useMinesweeperLogic } from "../hooks/useMinesweeperLogic";
import { HelpDialog } from "@/components/dialogs/HelpDialog";
import { AboutDialog } from "@/components/dialogs/AboutDialog";
import { appMetadata } from "..";

const NUMBER_COLORS: Record<number, string> = {
  1: "text-blue-600",
  2: "text-green-600",
  3: "text-red-600",
  4: "text-purple-800",
  5: "text-red-800",
  6: "text-teal-600",
  7: "text-black",
  8: "text-gray-500",
};

export function MinesweeperAppComponent({
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
    board,
    gameState,
    timer,
    flagCount,
    handleNewGame,
    handleCellClick,
    handleCellRightClick,
  } = useMinesweeperLogic({ isWindowOpen, isForeground, instanceId });

  const menuBar = (
    <MinesweeperMenuBar
      onClose={onClose}
      onShowHelp={() => setIsHelpDialogOpen(true)}
      onShowAbout={() => setIsAboutDialogOpen(true)}
      onNewGame={handleNewGame}
    />
  );

  if (!isWindowOpen) return null;

  const smiley = gameState === "won" ? "😎" : gameState === "lost" ? "😵" : "🙂";

  function getCellContent(cell: { isMine: boolean; isRevealed: boolean; isFlagged: boolean; adjacentMines: number }) {
    if (cell.isFlagged) return "🚩";
    if (!cell.isRevealed) return "";
    if (cell.isMine) return "💥";
    if (cell.adjacentMines > 0) return String(cell.adjacentMines);
    return "";
  }

  return (
    <>
      {!isXpTheme && isForeground && menuBar}
      <WindowFrame
        title={t("apps.minesweeper.title")}
        onClose={onClose}
        isForeground={isForeground}
        appId="minesweeper"
        skipInitialSound={skipInitialSound}
        instanceId={instanceId}
        menuBar={isXpTheme ? menuBar : undefined}
      >
        <div className="flex flex-col h-full bg-[#C0C0C0] p-2">
          {/* Header */}
          <div className="flex items-center justify-between bg-[#C0C0C0] border-2 border-t-[#808080] border-l-[#808080] border-b-white border-r-white p-1 mb-2">
            <div className="bg-black text-red-500 font-mono font-bold text-lg px-1 min-w-[40px] text-center">
              {String(Math.max(10 - flagCount, 0)).padStart(3, "0")}
            </div>
            <button
              onClick={handleNewGame}
              className="text-xl px-1 border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] bg-[#C0C0C0] active:border-t-[#808080] active:border-l-[#808080] active:border-b-white active:border-r-white cursor-pointer"
            >
              {smiley}
            </button>
            <div className="bg-black text-red-500 font-mono font-bold text-lg px-1 min-w-[40px] text-center">
              {String(timer).padStart(3, "0")}
            </div>
          </div>
          {/* Grid */}
          <div className="flex-1 flex items-center justify-center">
            <div
              className="grid border-2 border-t-[#808080] border-l-[#808080] border-b-white border-r-white"
              style={{
                gridTemplateColumns: `repeat(8, 1fr)`,
              }}
            >
              {board.map((row, r) =>
                row.map((cell, c) => {
                  const content = getCellContent(cell);
                  return (
                    <button
                      key={`${r}-${c}`}
                      onClick={() => handleCellClick(r, c)}
                      onContextMenu={(e) => handleCellRightClick(e, r, c)}
                      className={`w-8 h-8 text-xs font-bold flex items-center justify-center cursor-pointer select-none ${
                        cell.isRevealed
                          ? "bg-[#C0C0C0] border border-[#808080]"
                          : "border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] bg-[#C0C0C0]"
                      } ${
                        cell.isRevealed && cell.adjacentMines > 0
                          ? NUMBER_COLORS[cell.adjacentMines] || ""
                          : ""
                      }`}
                    >
                      {content}
                    </button>
                  );
                })
              )}
            </div>
          </div>
          {/* Status */}
          <div className="text-center text-xs mt-1 text-gray-700">
            {gameState === "won" && "🎉 You Win!"}
            {gameState === "lost" && "💀 Game Over!"}
            {gameState === "playing" && "Left-click to reveal, Right-click to flag"}
          </div>
        </div>
      </WindowFrame>
      <HelpDialog
        isOpen={isHelpDialogOpen}
        onOpenChange={setIsHelpDialogOpen}
        appId="minesweeper"
        helpItems={translatedHelpItems}
      />
      <AboutDialog
        isOpen={isAboutDialogOpen}
        onOpenChange={setIsAboutDialogOpen}
        metadata={appMetadata}
        appId="minesweeper"
      />
    </>
  );
}
