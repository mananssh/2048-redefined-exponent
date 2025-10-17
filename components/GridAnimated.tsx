'use client';
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowUp, FiArrowDown, FiArrowLeft, FiArrowRight } from 'react-icons/fi';
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
  tileSize = 60,
  gap = 10,
  onMove,
  onReset,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [currentTileSize, setCurrentTileSize] = useState(tileSize);
  const [currentGap, setCurrentGap] = useState(gap);

  // Update container size on mount and resize, also scale tiles based on board size
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      setContainerSize({ width: clientWidth, height: clientHeight });

      // Scale tile size based on board size and screen width
      let scaledTileSize = tileSize;
      const isMobile = window.innerWidth <= 768;

      if (isMobile) {
        scaledTileSize = Math.max(30, 50 - (size - 4) * 3);
      } else {
        scaledTileSize = Math.max(30, tileSize - (size - 4) * 4);
      }

      setCurrentTileSize(scaledTileSize);
      setCurrentGap(isMobile ? 8 : gap);
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [tileSize, gap, size]);

  const boardPx = size * currentTileSize + (size - 1) * currentGap;

  const getXY = (r: number, c: number) => {
    const x = c * (currentTileSize + currentGap);
    const y = r * (currentTileSize + currentGap);
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
    <div className="flex flex-col items-center max-w-[90vw] justify-center gap-4">
      {/* Up button */}
      <button
        onClick={() => onMove?.('up')}
        className="px-2 py-2 rounded-full bg-[#1F2937] text-[#FACC15] shadow-md transform transition-transform duration-200 hover:scale-110 hover:shadow-xl hover:bg-[#111827] hover:text-[#F59E0B] hover:cursor-pointer"
      >
        <FiArrowUp size={24} />
      </button>

      <div className="flex items-center gap-4">
        {/* Left button */}
        <button
          onClick={() => onMove?.('left')}
          className="px-2 py-2 rounded-full bg-[#1F2937] text-[#FACC15] shadow-md transform transition-transform duration-200 hover:scale-110 hover:shadow-xl hover:bg-[#111827] hover:text-[#F59E0B] hover:cursor-pointer"
        >
          <FiArrowLeft size={24} />
        </button>

        {/* Grid */}
        <div className="relative rounded-lg p-2" style={{ width: boardPx + 15, height: boardPx + 15 }}>
          {/* background cells */}
          <div style={{ position: 'absolute', inset: 0 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${size}, ${currentTileSize}px)`,
                gap: currentGap,
              }}
              ref={containerRef}
            >
              {Array.from({ length: size * size }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-md"
                  style={{ width: currentTileSize, height: currentTileSize, background: '#cdc1b4' }}
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
                    width: currentTileSize,
                    height: currentTileSize,
                    zIndex: 10,
                  }}
                >
                  <Tile value={tile.value} structured_color_output={colors} tileSize={currentTileSize} />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Right button */}
        <button
          onClick={() => onMove?.('right')}
          className="px-2 py-2 rounded-full bg-[#1F2937] text-[#FACC15] shadow-md transform transition-transform duration-200 hover:scale-110 hover:shadow-xl hover:bg-[#111827] hover:text-[#F59E0B] hover:cursor-pointer"
        >
          <FiArrowRight size={24} />
        </button>
      </div>

      {/* Down button */}
      <button
        onClick={() => onMove?.('down')}
        className="px-2 py-2 rounded-full bg-[#1F2937] text-[#FACC15] shadow-md transform transition-transform duration-200 hover:scale-110 hover:shadow-xl hover:bg-[#111827] hover:text-[#F59E0B] hover:cursor-pointer"
      >
        <FiArrowDown size={24} />
      </button>
    </div>
  );
}