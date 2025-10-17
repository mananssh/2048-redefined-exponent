// lib/tileLogic.ts
// Pure logic for tile-object moves. No React here.

export type TileObj = {
    id: string;
    value: number;
    r: number;
    c: number;
    merged?: boolean; // for UI
};

export type MoveStep = {
    id: string;
    to: { r: number; c: number };
    willMergeInto?: string | null; // id of tile it will merge into (phase2)
};

export type MoveResult = {
    moved: boolean;
    steps: MoveStep[]; // new positions for each tile
    merges: { targetId: string; fromIds: string[] }[]; // final merges to apply after animation
};

function cloneTiles(tiles: TileObj[]) {
    return tiles.map(t => ({ ...t }));
}

/**
 * Compute move result for direction on an n x n board.
 * tiles: array of TileObj with current r,c
 * dir: 'left'|'right'|'up'|'down'
 */
export function computeMove(tiles: TileObj[], n: number, dir: 'left' | 'right' | 'up' | 'down'): MoveResult {
    // Build grid of ids (or null)
    const grid: (string | null)[][] = Array.from({ length: n }, () => Array.from({ length: n }, () => null));
    const idToTile = new Map<string, TileObj>();
    tiles.forEach(t => {
        grid[t.r][t.c] = t.id;
        idToTile.set(t.id, t);
    });

    const steps: MoveStep[] = [];
    const merges: { targetId: string; fromIds: string[] }[] = [];

    const range = (start: number, end: number, step: number) => {
        const arr = [];
        for (let i = start; step > 0 ? i <= end : i >= end; i += step) arr.push(i);
        return arr;
    };

    // helper to process a single line (array of ids) and compute new positions left-justified
    function processLine(idsInOrder: (string | null)[], coordsForIndex: (idx: number) => { r: number; c: number }) {
        const compact: string[] = idsInOrder.filter(Boolean) as string[];
        const output: (string | null)[] = [];
        let i = 0;
        while (i < compact.length) {
            if (i + 1 < compact.length && idToTile.get(compact[i])!.value === idToTile.get(compact[i + 1])!.value) {
                // merge: compact[i] will be target (left one). compact[i+1] will be merged into it.
                const targetId = compact[i];
                const fromId = compact[i + 1];
                output.push(targetId);
                merges.push({ targetId, fromIds: [fromId] });
                i += 2;
            } else {
                output.push(compact[i]);
                i += 1;
            }
        }
        // fill with nulls to same length
        while (output.length < idsInOrder.length) output.push(null);
        // record steps:
        for (let idx = 0; idx < output.length; idx++) {
            const id = output[idx];
            const { r, c } = coordsForIndex(idx);
            if (id) steps.push({ id, to: { r, c }, willMergeInto: null });
        }
        // but we must also record willMergeInto for merged-from tiles (they move to same coord and will be removed)
        // merges currently contains pairs where target kept same id; merged from id should move to same target coord
        // We'll later add willMergeInto for merged-from tiles.
    }

    // Process based on direction by iterating lines and mapping coordinates
    if (dir === 'left' || dir === 'right') {
        for (let r = 0; r < n; r++) {
            const rowIds = grid[r].slice();
            // if moving right, reverse the conceptual left processing and map indices accordingly
            if (dir === 'left') {
                processLine(rowIds, (idx) => ({ r, c: idx }));
            } else {
                // moving right: reverse row, process, then map output index to columns from right
                const rev = [...rowIds].reverse();
                // temp collect steps differently: implement by creating local merges/steps then remap coords
                const localCompact: string[] = rev.filter(Boolean) as string[];
                const localOutput: (string | null)[] = [];
                let i2 = 0;
                while (i2 < localCompact.length) {
                    if (i2 + 1 < localCompact.length && idToTile.get(localCompact[i2])!.value === idToTile.get(localCompact[i2 + 1])!.value) {
                        const targetId = localCompact[i2];
                        const fromId = localCompact[i2 + 1];
                        localOutput.push(targetId);
                        merges.push({ targetId, fromIds: [fromId] });
                        i2 += 2;
                    } else {
                        localOutput.push(localCompact[i2]);
                        i2 += 1;
                    }
                }
                while (localOutput.length < rowIds.length) localOutput.push(null);
                // map localOutput index j to col = n-1 - j
                for (let j = 0; j < localOutput.length; j++) {
                    const id = localOutput[j];
                    const col = n - 1 - j;
                    if (id) steps.push({ id, to: { r, c: col }, willMergeInto: null });
                }
            }
        }
    } else { // up / down => process columns
        for (let c = 0; c < n; c++) {
            const colIds = [];
            for (let r = 0; r < n; r++) colIds.push(grid[r][c]);
            if (dir === 'up') {
                processLine(colIds, (idx) => ({ r: idx, c }));
            } else { // down
                const rev = [...colIds].reverse();
                const localCompact: string[] = rev.filter(Boolean) as string[];
                const localOutput: (string | null)[] = [];
                let i2 = 0;
                while (i2 < localCompact.length) {
                    if (i2 + 1 < localCompact.length && idToTile.get(localCompact[i2])!.value === idToTile.get(localCompact[i2 + 1])!.value) {
                        const targetId = localCompact[i2];
                        const fromId = localCompact[i2 + 1];
                        localOutput.push(targetId);
                        merges.push({ targetId, fromIds: [fromId] });
                        i2 += 2;
                    } else {
                        localOutput.push(localCompact[i2]);
                        i2 += 1;
                    }
                }
                while (localOutput.length < colIds.length) localOutput.push(null);
                for (let j = 0; j < localOutput.length; j++) {
                    const id = localOutput[j];
                    const row = n - 1 - j;
                    if (id) steps.push({ id, to: { r: row, c }, willMergeInto: null });
                }
            }
        }
    }

    // Now we have steps for surviving (target) tile ids. We must make sure merged-from tiles also move to target pos
    // For each merge entry we recorded earlier, ensure the fromId step moves to the same target coord
    // BUT merges list only has targetId + fromIds; we must find coordinate assigned to targetId in steps
    const idToStep = new Map<string, MoveStep>();
    steps.forEach(s => idToStep.set(s.id, s));
    // merges may have duplicates (if multiple tiles merged into same target in different lines); handle accordingly
    const finalMerges: { targetId: string; fromIds: string[] }[] = [];
    merges.forEach(m => {
        // find target's step coords
        const targetStep = idToStep.get(m.targetId);
        if (!targetStep) {
            // This can happen if target got removed - fallback skip
            return;
        }
        const targetCoord = targetStep.to;
        const validFrom: string[] = [];
        m.fromIds.forEach(fromId => {
            // push a step for the fromId moving to targetCoord
            steps.push({ id: fromId, to: { ...targetCoord }, willMergeInto: m.targetId });
            validFrom.push(fromId);
        });
        if (validFrom.length) finalMerges.push({ targetId: m.targetId, fromIds: validFrom });
    });

    // Compute whether any tile moves or merges at all by comparing desired coordinates to current
    let moved = false;
    tiles.forEach(t => {
        const desired = steps.find(s => s.id === t.id);
        if (!desired) {
            // tile got removed? maybe merged-from; but if it stays same coord it's not moved.
            // We'll assume if there's no step and tile still exists at same r,c, it didn't move.
            return;
        }
        if (desired.to.r !== t.r || desired.to.c !== t.c) moved = true;
    });
    if (finalMerges.length > 0) moved = true;

    return { moved, steps, merges: finalMerges };
}

/* helper to produce a fresh tile id */
export function makeId(): string {
    // lightweight id. Could use nanoid instead.
    return Math.random().toString(36).slice(2, 9);
}

/* utility: spawn a random tile in empty cell given current tiles */
export function spawnRandomTile(tiles: TileObj[], n: number): TileObj | null {
    const occupied = new Set<string>();
    tiles.forEach(t => occupied.add(`${t.r},${t.c}`));
    const empties: { r: number; c: number }[] = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (!occupied.has(`${r},${c}`)) empties.push({ r, c });
    if (empties.length === 0) return null;
    const pos = empties[Math.floor(Math.random() * empties.length)];
    const value = Math.random() < 0.9 ? 2 : 4;
    return { id: makeId(), value, r: pos.r, c: pos.c };
}
