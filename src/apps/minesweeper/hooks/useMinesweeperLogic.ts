import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useTranslatedHelpItems } from "@/hooks/useTranslatedHelpItems";
import { useThemeStore } from "@/stores/useThemeStore";
import { helpItems } from "..";

const ROWS = 8;
const COLS = 8;
const MINES = 10;

interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
}

type GameState = "playing" | "won" | "lost";

function createEmptyBoard(): Cell[][] {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      adjacentMines: 0,
    }))
  );
}

function placeMines(
  board: Cell[][],
  excludeRow: number,
  excludeCol: number
): Cell[][] {
  const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
  let placed = 0;
  while (placed < MINES) {
    const r = Math.floor(Math.random() * ROWS);
    const c = Math.floor(Math.random() * COLS);
    if (
      !newBoard[r][c].isMine &&
      !(r === excludeRow && c === excludeCol)
    ) {
      newBoard[r][c].isMine = true;
      placed++;
    }
  }
  // Calculate adjacent mines
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (newBoard[r][c].isMine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && newBoard[nr][nc].isMine) {
            count++;
          }
        }
      }
      newBoard[r][c].adjacentMines = count;
    }
  }
  return newBoard;
}

function revealCell(board: Cell[][], row: number, col: number): Cell[][] {
  const newBoard = board.map((r) => r.map((c) => ({ ...c })));

  function flood(r: number, c: number) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
    if (newBoard[r][c].isRevealed || newBoard[r][c].isFlagged) return;
    newBoard[r][c].isRevealed = true;
    if (newBoard[r][c].adjacentMines === 0 && !newBoard[r][c].isMine) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          flood(r + dr, c + dc);
        }
      }
    }
  }

  flood(row, col);
  return newBoard;
}

function checkWin(board: Cell[][]): boolean {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!board[r][c].isMine && !board[r][c].isRevealed) return false;
    }
  }
  return true;
}

function revealAllMines(board: Cell[][]): Cell[][] {
  return board.map((row) =>
    row.map((cell) => (cell.isMine ? { ...cell, isRevealed: true } : cell))
  );
}

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
    handleNewGame,
    handleCellClick,
    handleCellRightClick,
    instanceId,
  };
}
