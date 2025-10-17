'use client';
import React, { useState, useTransition } from 'react';
import GridAnimated from './GridAnimated';
import { useTileGame } from '@/hooks/useTileGame';
import { structuredColorPicker } from '@/actions/structured_output';
import type { ColorSchemeType } from '@/types/ColorSchema';

const DEFAULT_DARK_THEME: ColorSchemeType = {
  below4: '2C2C2C,FFFFFF',
  below8: '383838,FFFFFF',
  below16: '454545,FFFFFF',
  below64: '525252,FFFFFF',
  below256: '606060,FFFFFF',
  below1024: '6D6D6D,FFFFFF',
  above1024: '7A7A7A,FFFFFF',
};

export default function ClientGame() {
  const [theme, setTheme] = useState('');
  const [colors, setColors] = useState<ColorSchemeType>(DEFAULT_DARK_THEME);
  const [themeSet, setThemeSet] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { tiles, size, score, isAnimating, handleMove, resetGame, undo, addRandomTile } =
    useTileGame(4);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('prompt', theme);
        const result = await structuredColorPicker(formData);

        if ('error' in result) {
          console.warn('Color fetch failed, using default dark theme', result.error);
          setColors(DEFAULT_DARK_THEME);
        } else {
          setColors(result as ColorSchemeType);
        }

        setThemeSet(true);
      } catch (err: any) {
        console.error(err);
        setColors(DEFAULT_DARK_THEME);
        setThemeSet(true);
      }
    });
  };

  if (!themeSet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gray-100 p-6">
        <h1 className="text-3xl font-bold">Choose a 2048 Theme</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="Enter theme, e.g., Harry Potter"
            className="px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isPending}
            className={`px-4 py-2 rounded text-white font-semibold ${
              isPending ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isPending ? 'Loading...' : 'Set Theme'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-gray-100 p-6">
      <h1 className="text-3xl font-bold">2048 Redefined - Theme: {theme}</h1>
      <div>Score: {score}</div>

      <GridAnimated
        size={size}
        tiles={tiles}
        colors={colors} // pass the structured JSON to GridAnimated
        onMove={handleMove}
        onReset={() => resetGame()}
      />

      <div className="flex gap-2 mt-4">
        <button onClick={() => resetGame()} className="px-3 py-1 rounded bg-blue-600 text-white">New</button>
        <button onClick={() => undo()} disabled={isAnimating} className="px-3 py-1 rounded bg-gray-600 text-white">Undo</button>
        <button onClick={() => addRandomTile()} disabled={isAnimating} className="px-3 py-1 rounded bg-gray-600 text-white">Spawn</button>
      </div>
    </div>
  );
}
