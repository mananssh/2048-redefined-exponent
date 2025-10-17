// FILE: hooks/useGame.ts
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Board, Direction } from '../lib/gameLogic';
import * as logic from '../lib/gameLogic';

type MoveHistoryEntry = {
  moveNumber: number;
  direction: Direction;
  boardBefore: Board;
  boardAfter: Board;
  scoreGained: number;
  timestamp: number;
};

type UseGameReturn = {
  board: Board;
  size: number;
  score: number;
  bestScore: number;
  moveCount: number;
  history: MoveHistoryEntry[];
  status: 'playing' | 'won' | 'lost';
  gameOver: boolean;
  won: boolean;
  setSize: (n: number) => void;
  handleMove: (dir: Direction) => void;
  resetGame: (n?: number) => void;
  undo: () => void;
};

const STORAGE_PREFIX = '2048_v1_';
function storageKeyForSize(size: number) {
  return `${STORAGE_PREFIX}size_${size}`;
}

export function useGame(initialSize = 4): UseGameReturn {
  const [size, setSizeState] = useState<number>(initialSize);
  const [board, setBoard] = useState<Board>(() => logic.initializeBoard(initialSize));
  const [score, setScore] = useState<number>(0);
  const [bestScore, setBestScore] = useState<number>(() => {
    try { return Number(localStorage.getItem(`${STORAGE_PREFIX}best`) ?? 0); } catch { return 0; }
  });
  const [moveCount, setMoveCount] = useState<number>(0);
  const [history, setHistory] = useState<MoveHistoryEntry[]>([]);
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKeyForSize(size));
      console.log('loaded snapshot for size', size, raw);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          board: Board; score: number; moveCount: number; history: MoveHistoryEntry[]; status: string;
        };
        setBoard(parsed.board);
        setScore(parsed.score);
        setMoveCount(parsed.moveCount);
        setHistory(parsed.history ?? []);
        setStatus((parsed.status as any) ?? 'playing');
        return;
      }
    } catch (e) {
      // ignore parsing errors
    }
    // otherwise initialize fresh board for this size
    // NOTE: avoid calling resetGame here (defined later). Initialize inline for clarity.
    const newBoard = logic.initializeBoard(size);
    setBoard(newBoard);
    setScore(0);
    setMoveCount(0);
    setHistory([]);
    setStatus('playing');
  }, [size]);

  // Persist snapshot on important changes
  useEffect(() => {
    try {
      const payload = JSON.stringify({ board, score, moveCount, history, status });
      localStorage.setItem(storageKeyForSize(size), payload);
      // persist best score globally
      if (score > bestScore) {
        localStorage.setItem(`${STORAGE_PREFIX}best`, String(score));
        setBestScore(score);
      }
    } catch (e) {
      // ignore
    }
  }, [board, score, moveCount, history, status, size, bestScore]);

  const setSize = useCallback((n: number) => {
    if (n < 2) n = 2;
    setSizeState(n);
  }, []);

  const resetGame = useCallback((n?: number) => {
    const newSize = n ?? size;
    const newBoard = logic.initializeBoard(newSize);
    setBoard(newBoard);
    setScore(0);
    setMoveCount(0);
    setHistory([]);
    setStatus('playing');
    setSizeState(newSize);
  }, [size]);

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setBoard(last.boardBefore);
      setScore(s => s - last.scoreGained);
      setMoveCount(s => Math.max(0, s - 1));
      const next = prev.slice(0, -1);
      return next;
    });
  }, []);

  const handleMove = useCallback((dir: Direction) => {
    if (status !== 'playing') return;
    const result = logic.move(board, dir);
    if (!result.moved) return; // invalid move

    // create history entry
    const entry: MoveHistoryEntry = {
      moveNumber: moveCount + 1,
      direction: dir,
      boardBefore: logic.cloneBoard(board),
      boardAfter: logic.cloneBoard(result.board),
      scoreGained: result.scoreGained,
      timestamp: Date.now(),
    };

    // apply the move, then add a random tile
    const afterBoard = logic.cloneBoard(result.board);
    logic.addRandomTile(afterBoard);

    setBoard(afterBoard);
    setScore(s => s + result.scoreGained);
    setMoveCount(c => c + 1);
    setHistory(h => [...h, entry]);

    if (logic.checkWin(afterBoard)) {
      setStatus('won');
    } else if (logic.checkGameOver(afterBoard)) {
      setStatus('lost');
    }
  }, [board, moveCount, status]);

  const gameOver = status === 'lost';
  const won = status === 'won';

  return useMemo(() => ({
    board, size, score, bestScore, moveCount, history, status,
    gameOver, won, setSize, handleMove, resetGame, undo
  }), [board, size, score, bestScore, moveCount, history, status, gameOver, won, setSize, handleMove, resetGame, undo]);
}
