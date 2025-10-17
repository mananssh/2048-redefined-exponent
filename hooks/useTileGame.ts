// hooks/useTileGame.ts
'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TileObj, MoveResult } from '../lib/tileLogic';
import * as logic from '../lib/tileLogic';

type UseTileGameReturn = {
    tiles: TileObj[];
    size: number;
    score: number;
    isAnimating: boolean;
    handleMove: (dir: 'left' | 'right' | 'up' | 'down') => void;
    resetGame: (n?: number) => void;
    undo: () => void;
    addRandomTile: () => void;
};

export function useTileGame(initialSize = 4): UseTileGameReturn {
    const [size, setSize] = useState<number>(initialSize);
    const [tiles, setTiles] = useState<TileObj[]>(() => {
        // start empty; we'll init on mount
        return [];
    });
    const [score, setScore] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const historyRef = useRef<TileObj[][]>([]);
    const scoreHistoryRef = useRef<number[]>([]);

    // initialization on mount or size change
    useEffect(() => {
        const initTiles: TileObj[] = [];
        // spawn two tiles
        const t1 = logic.spawnRandomTile(initTiles, size);
        if (t1) initTiles.push(t1);
        const t2 = logic.spawnRandomTile(initTiles, size);
        if (t2) initTiles.push(t2);
        setTiles(initTiles);
        setScore(0);
        historyRef.current = [];
        scoreHistoryRef.current = [];
    }, [size]);

    const resetGame = useCallback((n?: number) => {
        const newSize = n ?? size;
        setSize(newSize);
        setTiles([]);
        const initTiles: TileObj[] = [];
        const t1 = logic.spawnRandomTile(initTiles, size);
        if (t1) initTiles.push(t1);
        const t2 = logic.spawnRandomTile(initTiles, size);
        if (t2) initTiles.push(t2);
        setTiles(initTiles);
        setScore(0);
        historyRef.current = [];
        scoreHistoryRef.current = [];
    }, [size]);

    // save snapshot for undo
    const pushHistory = useCallback((snapshotTiles: TileObj[], snapshotScore: number) => {
        historyRef.current.push(snapshotTiles.map(t => ({ ...t })));
        scoreHistoryRef.current.push(snapshotScore);
        // cap history length
        if (historyRef.current.length > 50) {
            historyRef.current.shift();
            scoreHistoryRef.current.shift();
        }
    }, []);

    const undo = useCallback(() => {
        if (isAnimating) return;
        const last = historyRef.current.pop();
        const lastScore = scoreHistoryRef.current.pop();
        if (last) {
            setTiles(last);
            setScore(lastScore ?? 0);
        }
    }, [isAnimating]);

    // Add random tile helper (exposed)
    const addRandomTile = useCallback(() => {
        // clear merged flags & spawn a new random tile
        setTiles(prev => {
            const cleared = prev.map(t => ({ ...t, merged: false }));
            const spawned = logic.spawnRandomTile(cleared, size);
            if (spawned) {
                return [...cleared, spawned];
            }
            return cleared;
        });

    }, [size]);

    // handle move with animation phases
    const handleMove = useCallback(async (dir: 'left' | 'right' | 'up' | 'down') => {
        if (isAnimating) return;
        const current = tiles;
        if (current.length === 0) return;

        const result: MoveResult = logic.computeMove(current, size, dir);
        if (!result.moved) return;

        // push history for undo
        pushHistory(current, score);

        // Phase 1: update positions (tiles that stay or move). Mark willMergeInto on merging-from tiles via steps
        // Convert steps array to map
        const stepMap = new Map(result.steps.map(s => [s.id, s]));
        setTiles(prev => {
            // copy and update positions; keep merged flag false for now
            return prev.map(t => {
                const step = stepMap.get(t.id);
                if (!step) return { ...t, merged: false }; // maybe will be removed in merge phase
                return { ...t, r: step.to.r, c: step.to.c, merged: false };
            });
        });

        setIsAnimating(true);

        // wait for slide animation duration (match GridAnimated transition)
        await new Promise(res => setTimeout(res, 170));

        // Phase 2: apply merges (increase target value, remove merged-from tiles) and mark merged flag for pop animation
        setTiles(prev => {
            let working = prev.map(t => ({ ...t }));
            // apply merges
            for (const m of result.merges) {
                const target = working.find(t => t.id === m.targetId);
                if (!target) continue;
                // sum values from fromIds and remove those tiles
                let added = 0;
                for (const fid of m.fromIds) {
                    const f = working.find(x => x.id === fid);
                    if (f) {
                        added += f.value;
                    }
                }
                // remove merged-from tiles
                working = working.filter(x => !m.fromIds.includes(x.id));
                // update target value and mark merged for pop
                target.value = target.value + added;
                target.merged = true;
            }
            return working;
        });

        // add merged pop hold
        await new Promise(res => setTimeout(res, 160));

        // clear merged flags & spawn a new random tile
        setTiles(prev => {
            const cleared = prev.map(t => ({ ...t, merged: false }));
            const spawned = logic.spawnRandomTile(cleared, size);
            if (spawned) {
                return [...cleared, spawned];
            }
            return cleared;
        });

        // update score (sum of merged values added)
        let gained = 0;
        for (const m of result.merges) {
            // find target value increase: sum of from values + previous target value -> the increment is sum(from)+previous_target
            // But easier: compute gained as sum of merged values (sum of froms + their target increment)
            // We'll compute by scanning merges from previous 'current' tiles snapshot:
            // For simplicity, calculate gained as sum of values of fromIds + their target previous value (approx)
            // Here we compute gained as sum of fromIds' values (OK for scoreboard).
            for (const fid of m.fromIds) {
                const f = current.find(x => x.id === fid);
                if (f) gained += f.value;
            }
        }
        setScore(s => s + gained);

        setIsAnimating(false);
    }, [isAnimating, tiles, size, pushHistory, score]);

    return useMemo(() => ({
        tiles, size, score, isAnimating, handleMove, resetGame, undo, addRandomTile
    }), [tiles, size, score, isAnimating, handleMove, resetGame, undo, addRandomTile]);
}
