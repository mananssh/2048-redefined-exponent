export type Board = number[][];
export type Direction = 'up' | 'down' | 'left' | 'right';

export function emptyBoard(size: number): Board {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => 0));
}

export function cloneBoard(b: Board): Board {
  return b.map(row => [...row]);
}

/**
 * Initialize an n x n board with two random tiles.
 * size must be >= 2.
 */
export function initializeBoard(size: number): Board {
  const b = emptyBoard(size);
  addRandomTile(b);
  addRandomTile(b);
  return b;
}

export function getEmptyCells(board: Board): { r: number; c: number }[] {
  const res: { r: number; c: number }[] = [];
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      if (board[r][c] === 0) res.push({ r, c });
    }
  }
  return res;
}

/* Add a random tile (2 with 90% or 4 with 10%) to any empty cell. Returns true if added. */
export function addRandomTile(board: Board): boolean {
  const empties = getEmptyCells(board);
  if (empties.length === 0) return false;
  const idx = Math.floor(Math.random() * empties.length);
  const cell = empties[idx];
  board[cell.r][cell.c] = Math.random() < 0.9 ? 2 : 4;
  return true;
}

/* ---------- Rotation helpers (work for any NxN) ---------- */
function rotateRight(b: Board): Board {
  const n = b.length;
  const res = emptyBoard(n);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      res[c][n - 1 - r] = b[r][c];
    }
  }
  return res;
}
function rotateLeft(b: Board): Board {
  const n = b.length;
  const res = emptyBoard(n);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      res[n - 1 - c][r] = b[r][c];
    }
  }
  return res;
}
function rotate180(b: Board): Board {
  return rotateRight(rotateRight(b));
}

/* ---------- Row sliding & merging (left only) ---------- */
/* slide and merge a single row to the left. Returns new row, score gained, and whether changed. */
function slideAndMergeRowLeft(row: number[]): { row: number[]; score: number; changed: boolean } {
  const orig = [...row];
  const compact = row.filter(v => v !== 0);
  const merged: number[] = [];
  let score = 0;
  for (let i = 0; i < compact.length; i++) {
    if (i + 1 < compact.length && compact[i] === compact[i + 1]) {
      const newVal = compact[i] * 2;
      merged.push(newVal);
      score += newVal;
      i++; // skip merged
    } else {
      merged.push(compact[i]);
    }
  }
  while (merged.length < row.length) merged.push(0);
  const changed = merged.some((v, idx) => v !== orig[idx]);
  return { row: merged, score, changed };
}

/* perform left move on the full board */
export function moveLeft(board: Board): { board: Board; scoreGained: number; moved: boolean } {
  const n = board.length;
  const newBoard = emptyBoard(n);
  let totalScore = 0;
  let moved = false;
  for (let r = 0; r < n; r++) {
    const { row, score, changed } = slideAndMergeRowLeft(board[r]);
    newBoard[r] = row;
    totalScore += score;
    if (changed) moved = true;
  }
  return { board: newBoard, scoreGained: totalScore, moved };
}

/* Unified move function supporting all directions by rotating to left-move, applying, rotating back. */
export function move(board: Board, dir: Direction): { board: Board; scoreGained: number; moved: boolean } {
  let transformed: Board;
  let after: { board: Board; scoreGained: number; moved: boolean };

  switch (dir) {
    case 'left':
      transformed = cloneBoard(board);
      after = moveLeft(transformed);
      return after;
    case 'right':
      transformed = rotate180(board);
      after = moveLeft(transformed);
      return { board: rotate180(after.board), scoreGained: after.scoreGained, moved: after.moved };
    case 'up':
      transformed = rotateRight(board); // up -> rotate right so that up becomes left
      after = moveLeft(transformed);
      return { board: rotateLeft(after.board), scoreGained: after.scoreGained, moved: after.moved };
    case 'down':
      transformed = rotateLeft(board); // down -> rotate left so that down becomes left
      after = moveLeft(transformed);
      return { board: rotateRight(after.board), scoreGained: after.scoreGained, moved: after.moved };
    default:
      return { board: cloneBoard(board), scoreGained: 0, moved: false };
  }
}

/* ---------- Game state checks ---------- */

/* true if any move is possible (empty cell or mergeable adjacent) */
export function canMove(board: Board): boolean {
  const n = board.length;
  // any empty cell => can move
  if (getEmptyCells(board).length > 0) return true;
  // check horizontal merges
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n - 1; c++) {
      if (board[r][c] === board[r][c + 1]) return true;
    }
  }
  // check vertical merges
  for (let c = 0; c < n; c++) {
    for (let r = 0; r < n - 1; r++) {
      if (board[r][c] === board[r + 1][c]) return true;
    }
  }
  return false;
}

/* check if any tile equals target (e.g., 2048) */
export function checkWin(board: Board, target = 2048): boolean {
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      if (board[r][c] === target) return true;
    }
  }
  return false;
}

/* check game over (no moves) */
export function checkGameOver(board: Board): boolean {
  return !canMove(board);
}
