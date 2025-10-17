'use client';
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TileObj } from '../lib/tileLogic';
import Tile from './Tile';
import type { ColorSchemeType } from '@/types/ColorSchema';

type Props = {
  size: number;
  tiles: TileObj[];
  colors: ColorSchemeType;
  tileSize?: number;
  gap?: number;
  onMove?: (dir: 'left' | 'right' | 'up' | 'down') => void;
  onReset?: () => void;
};

export default function GridAnimated({
  size,
  tiles,
  colors,
  tileSize = 80,
  gap = 12,
  onMove,
  onReset,
}: Props) {
  const boardPx = size * tileSize + (size - 1) * gap;

  const getXY = (r: number, c: number) => {
    const x = c * (tileSize + gap);
    const y = r * (tileSize + gap);
    return { x, y };
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!onMove) return;
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') { e.preventDefault(); onMove('left'); }
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') { e.preventDefault(); onMove('right'); }
      if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') { e.preventDefault(); onMove('up'); }
      if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') { e.preventDefault(); onMove('down'); }
      if (e.key.toLowerCase() === 'r') { e.preventDefault(); onReset && onReset(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onMove, onReset]);

  return (
    <div style={{ width: boardPx }}>
      <div className="relative rounded-lg p-2" style={{ width: boardPx + 15, height: boardPx + 15 }}>
        {/* background cells */}
        <div style={{ position: 'absolute', inset: 0 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${size}, ${tileSize}px)`,
              gap: gap,
            }}
          >
            {Array.from({ length: size * size }).map((_, i) => (
              <div
                key={i}
                className="rounded-md"
                style={{ width: tileSize, height: tileSize, background: '#cdc1b4' }}
              />
            ))}
          </div>
        </div>

        <AnimatePresence initial={false}>
          {tiles.map(tile => {
            const { x, y } = getXY(tile.r, tile.c);

            return (
              <motion.div
                key={tile.id}
                initial={false}
                animate={{ x, y }}
                transition={{
                  x: { type: 'spring', stiffness: 200, damping: 28 },
                  y: { type: 'spring', stiffness: 200, damping: 28 },
                }}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: tileSize,
                  height: tileSize,
                  zIndex: 10,
                }}
              >
                <Tile value={tile.value} structured_color_output={colors} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="flex gap-2 mt-3 justify-center">
        <button onClick={() => onMove?.('up')} className="px-3 py-1 rounded bg-gray-800 text-white">Up</button>
        <button onClick={() => onMove?.('left')} className="px-3 py-1 rounded bg-gray-800 text-white">Left</button>
        <button onClick={() => onMove?.('down')} className="px-3 py-1 rounded bg-gray-800 text-white">Down</button>
        <button onClick={() => onMove?.('right')} className="px-3 py-1 rounded bg-gray-800 text-white">Right</button>
      </div>
    </div>
  );
}
