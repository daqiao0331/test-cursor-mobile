import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useTranslatedHelpItems } from "@/hooks/useTranslatedHelpItems";
import { useThemeStore } from "@/stores/useThemeStore";
import { helpItems } from "..";
import {
  type Cell,
  type GameState,
  MINES,
  createEmptyBoard,
  placeMines,
  revealCell,
  checkWin,
  revealAllMines,
} from "../utils/boardUtils";

export function useMinesweeperLogic({
  instanceId,
}: {
  instanceId: string;
  isWindowOpen: boolean;
  isForeground: boolean;
}) {
  const { t } = useTranslation();
  const translatedHelpItems = useTranslatedHelpItems("minesweeper", helpItems);
  const currentTheme = useThemeStore((state) => state.current);
  const isXpTheme = currentTheme === "xp" || currentTheme === "win98";

  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const [isAboutDialogOpen, setIsAboutDialogOpen] = useState(false);
  const [board, setBoard] = useState<Cell[][]>(createEmptyBoard);
  const [gameState, setGameState] = useState<GameState>("playing");
  const [firstClick, setFirstClick] = useState(true);
  const [timer, setTimer] = useState(0);
  const [flagCount, setFlagCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((prev) => Math.min(prev + 1, 999));
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleNewGame = useCallback(() => {
    stopTimer();
    setBoard(createEmptyBoard());
    setGameState("playing");
    setFirstClick(true);
    setTimer(0);
    setFlagCount(0);
  }, [stopTimer]);

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (gameState !== "playing") return;
      if (board[row][col].isFlagged || board[row][col].isRevealed) return;

      let currentBoard = board;
      if (firstClick) {
        currentBoard = placeMines(board, row, col);
        setFirstClick(false);
        startTimer();
      }

      if (currentBoard[row][col].isMine) {
        const finalBoard = revealAllMines(currentBoard);
        setBoard(finalBoard);
        setGameState("lost");
        stopTimer();
        return;
      }

      const newBoard = revealCell(currentBoard, row, col);
      setBoard(newBoard);

      if (checkWin(newBoard)) {
        setGameState("won");
        stopTimer();
      }
    },
    [board, gameState, firstClick, startTimer, stopTimer]
  );

  const handleCellRightClick = useCallback(
    (e: React.MouseEvent, row: number, col: number) => {
      e.preventDefault();
      if (gameState !== "playing") return;
      if (board[row][col].isRevealed) return;

      const newBoard = board.map((r) => r.map((c) => ({ ...c })));
      newBoard[row][col].isFlagged = !newBoard[row][col].isFlagged;
      setBoard(newBoard);
      setFlagCount((prev) =>
        newBoard[row][col].isFlagged ? prev + 1 : prev - 1
      );
    },
    [board, gameState]
  );

  return {
    t,
    translatedHelpItems,
    isXpTheme,
    isHelpDialogOpen,
    setIsHelpDialogOpen,
    isAboutDialogOpen,
    setIsAboutDialogOpen,
    board,
    gameState,
    timer,
    flagCount,
    mineCount: MINES,
    handleNewGame,
    handleCellClick,
    handleCellRightClick,
    instanceId,
  };
}
