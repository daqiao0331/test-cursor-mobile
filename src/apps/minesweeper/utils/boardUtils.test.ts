import { describe, it, expect } from "vitest";
import {
  createEmptyBoard,
  placeMines,
  revealCell,
  checkWin,
  revealAllMines,
  ROWS,
  COLS,
  MINES,
} from "./boardUtils";

describe("Minesweeper Board Utils", () => {
  describe("createEmptyBoard", () => {
    it("creates an 8x8 board", () => {
      const board = createEmptyBoard();
      expect(board).toHaveLength(ROWS);
      board.forEach((row) => {
        expect(row).toHaveLength(COLS);
      });
    });

    it("creates all cells with default values", () => {
      const board = createEmptyBoard();
      board.forEach((row) => {
        row.forEach((cell) => {
          expect(cell.isMine).toBe(false);
          expect(cell.isRevealed).toBe(false);
          expect(cell.isFlagged).toBe(false);
          expect(cell.adjacentMines).toBe(0);
        });
      });
    });
  });

  describe("placeMines", () => {
    it("places the correct number of mines", () => {
      const board = createEmptyBoard();
      const result = placeMines(board, 0, 0);
      let mineCount = 0;
      result.forEach((row) => {
        row.forEach((cell) => {
          if (cell.isMine) mineCount++;
        });
      });
      expect(mineCount).toBe(MINES);
    });

    it("does not place a mine on the excluded cell", () => {
      const board = createEmptyBoard();
      // Run multiple times to reduce flakiness
      for (let i = 0; i < 20; i++) {
        const result = placeMines(board, 3, 4);
        expect(result[3][4].isMine).toBe(false);
      }
    });

    it("calculates adjacent mine counts correctly", () => {
      const board = createEmptyBoard();
      const result = placeMines(board, 0, 0);
      // Verify that non-mine cells have correct adjacent counts
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (result[r][c].isMine) continue;
          let expected = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && result[nr][nc].isMine) {
                expected++;
              }
            }
          }
          expect(result[r][c].adjacentMines).toBe(expected);
        }
      }
    });

    it("does not mutate the original board", () => {
      const board = createEmptyBoard();
      placeMines(board, 0, 0);
      board.forEach((row) => {
        row.forEach((cell) => {
          expect(cell.isMine).toBe(false);
        });
      });
    });
  });

  describe("revealCell", () => {
    it("reveals a single cell with adjacent mines", () => {
      const board = createEmptyBoard();
      board[0][0].adjacentMines = 3;
      const result = revealCell(board, 0, 0);
      expect(result[0][0].isRevealed).toBe(true);
      // Should not flood-fill because adjacentMines > 0
      expect(result[0][1].isRevealed).toBe(false);
    });

    it("flood fills from a cell with 0 adjacent mines", () => {
      const board = createEmptyBoard();
      // Put a mine at [3][3] and compute adjacency
      board[3][3].isMine = true;
      for (let r = 2; r <= 4; r++) {
        for (let c = 2; c <= 4; c++) {
          if (r === 3 && c === 3) continue;
          if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
            board[r][c].adjacentMines = 1;
          }
        }
      }
      // Revealing [0][0] should flood fill since it has 0 adjacent mines
      const result = revealCell(board, 0, 0);
      expect(result[0][0].isRevealed).toBe(true);
      // Cells far from the mine should be revealed
      expect(result[7][7].isRevealed).toBe(true);
    });

    it("does not reveal flagged cells during flood fill", () => {
      const board = createEmptyBoard();
      board[0][1].isFlagged = true;
      const result = revealCell(board, 0, 0);
      expect(result[0][0].isRevealed).toBe(true);
      expect(result[0][1].isRevealed).toBe(false);
      expect(result[0][1].isFlagged).toBe(true);
    });

    it("does not mutate the original board", () => {
      const board = createEmptyBoard();
      revealCell(board, 0, 0);
      expect(board[0][0].isRevealed).toBe(false);
    });
  });

  describe("checkWin", () => {
    it("returns false on empty board", () => {
      const board = createEmptyBoard();
      expect(checkWin(board)).toBe(false);
    });

    it("returns true when all non-mine cells are revealed", () => {
      const board = createEmptyBoard();
      board[0][0].isMine = true;
      // Reveal all non-mine cells
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (!board[r][c].isMine) {
            board[r][c].isRevealed = true;
          }
        }
      }
      expect(checkWin(board)).toBe(true);
    });

    it("returns false when some non-mine cells are hidden", () => {
      const board = createEmptyBoard();
      board[0][0].isMine = true;
      // Reveal some but not all
      board[1][0].isRevealed = true;
      board[1][1].isRevealed = true;
      expect(checkWin(board)).toBe(false);
    });
  });

  describe("revealAllMines", () => {
    it("reveals all mine cells", () => {
      const board = createEmptyBoard();
      board[0][0].isMine = true;
      board[3][5].isMine = true;
      board[7][7].isMine = true;

      const result = revealAllMines(board);
      expect(result[0][0].isRevealed).toBe(true);
      expect(result[3][5].isRevealed).toBe(true);
      expect(result[7][7].isRevealed).toBe(true);
    });

    it("does not reveal non-mine cells", () => {
      const board = createEmptyBoard();
      board[0][0].isMine = true;

      const result = revealAllMines(board);
      expect(result[1][1].isRevealed).toBe(false);
      expect(result[4][4].isRevealed).toBe(false);
    });

    it("does not mutate the original board", () => {
      const board = createEmptyBoard();
      board[0][0].isMine = true;
      revealAllMines(board);
      expect(board[0][0].isRevealed).toBe(false);
    });
  });
});
