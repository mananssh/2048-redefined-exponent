'use client';
import React, { useState, useTransition, useEffect } from 'react';
import GridAnimated from './GridAnimated';
import { useTileGame } from '@/hooks/useTileGame';
import { structuredColorPicker } from '@/actions/structured_output';
import { generateBackgroundImage } from '@/actions/imagegen'; // server action
import { gameReviewAgent } from '@/actions/gamereview';
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

interface ClientGameProps {
  boardSize: number;
}

export default function ClientGame({ boardSize }: ClientGameProps) {
  const [theme, setTheme] = useState('');
  const [colors, setColors] = useState<ColorSchemeType>(DEFAULT_DARK_THEME);
  const [themeSet, setThemeSet] = useState(false);
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reviewContent, setReviewContent] = useState<string | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Initialize the game hook AFTER boardSize is properly set
  const { tiles, size, score, isAnimating, handleMove, resetGame, undo, addRandomTile, isGameOver, historyRef } =
    useTileGame(boardSize);

  // Show game over modal when game ends
  useEffect(() => {
    if (isGameOver && themeSet) {
      setShowGameOverModal(true);
    }
  }, [isGameOver, themeSet]);

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

        const imageUrl = await generateBackgroundImage(theme);
        setBgImage(imageUrl);

      } catch (err: unknown) {
        console.error(err);
        setColors(DEFAULT_DARK_THEME);
        setThemeSet(true);
      }
    });
  };

  const defaultTheme = async (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      setColors(DEFAULT_DARK_THEME);
      setTheme('Dark Minimalist');
      setThemeSet(true);
    });
  };

  const handleNewGame = () => {
    setShowGameOverModal(false);
    setShowReport(false);
    setReviewContent(null);
    setReviewError(null);
    resetGame();
  };

  const handleViewReport = async () => {
    setShowReport(true);
    setReviewLoading(true);
    setReviewError(null);
    setReviewContent(null);

    if (!reviewContent) {
      try {
        const formData = new FormData();
        formData.append('history', JSON.stringify(historyRef.current));
        const result = await gameReviewAgent(formData);

        if ('error' in result && result.error) {
          setReviewError(result.error);
        } else {
          setReviewContent(result.content ?? null);
        }
      } catch (err: unknown) {
        setReviewError(err instanceof Error ? err.message : 'Failed to generate review');
      } finally {
        setReviewLoading(false);
      }
    }
    else {
      setReviewLoading(false);
    }
  };

  const containerStyle = bgImage
    ? {
      backgroundImage: `url(${bgImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      minHeight: '100vh',
      width: '100%',
    }
    : { minHeight: '100vh', width: '100%', backgroundColor: '#000' };

  if (!themeSet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-8 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-6">
        <div className="text-center">
          <h1 className="text-6xl font-light tracking-widest text-amber-950" style={{ letterSpacing: '0.08em' }}>
            2048 REDEFINED
          </h1>
          <p className="text-lg text-amber-700 font-light tracking-wide mt-3">
            Select Your Theme
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md">
          <input
            type="text"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="Enter theme, e.g., Harry Potter"
            className="px-6 py-3 rounded-lg bg-white border-2 border-amber-200 text-amber-950 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent shadow-md transition-all duration-200 font-light text-base"
          />
          <button
            type="submit"
            disabled={isPending}
            className={`px-6 py-3 rounded-lg text-white font-light tracking-widest text-sm uppercase transition-all duration-200 shadow-lg hover:shadow-xl ${isPending
              ? 'bg-amber-300 text-amber-800 cursor-not-allowed'
              : 'bg-gradient-to-br from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 active:scale-95'
              }`}
          >
            {isPending ? 'Generating Theme...' : 'Start Game'}
          </button>
          <button
            type="button"
            onClick={defaultTheme}
            disabled={isPending}
            className={`px-6 py-3 rounded-lg text-white font-light tracking-widest text-sm uppercase transition-all duration-200 shadow-lg hover:shadow-xl ${isPending
              ? 'bg-amber-300 text-amber-800 cursor-not-allowed hidden'
              : 'bg-gradient-to-br from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 active:scale-95'
              }`}
          >
            {isPending ? 'Generating Theme...' : 'Use Default Theme'}
          </button>
        </form>

        {isPending && (
          <div className="text-amber-700 text-sm font-light tracking-wide">
            Creating your personalized theme...
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={containerStyle} className="flex flex-col items-center justify-center min-h-screen gap-8 p-6">
      {/* Header Section */}
      <div className="w-full flex flex-col items-center gap-4">
        <h1 className="text-6xl font-light text-center tracking-widest text-white drop-shadow-lg" style={{ letterSpacing: '0.12em' }}>
          2048 REDEFINED
        </h1>

        <div className="text-lg text-gray-300 font-light tracking-wide">
          THEME: <span className="text-stone-50">{theme.toUpperCase()}</span>
        </div>

        {/* Score and Controls Row */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
          <div className="bg-gradient-to-br from-[#36454F] to-[#000] border border-white px-10 py-6 rounded-lg shadow-2xl">
            <div className="text-white text-center text-xs font-light tracking-widest mb-2">SCORE</div>
            <div className="text-6xl font-light text-center text-stone-100 tracking-tight tabular-nums">{score}</div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => resetGame()}
              className="px-7 py-3 rounded-md bg-gradient-to-br from-orange-600 to-orange-700 text-stone-50 font-light tracking-widest text-xs uppercase hover:from-orange-500 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-orange-900/50 hover:scale-105 border border-orange-500 border-opacity-40 active:scale-95"
            >
              New Game
            </button>
            <button
              onClick={() => undo()}
              disabled={isAnimating}
              className="px-7 py-3 rounded-md bg-stone-700 hover:bg-stone-600 text-stone-100 font-light tracking-widest text-xs uppercase transition-all duration-200 shadow-lg hover:shadow-stone-900/50 disabled:opacity-40 disabled:cursor-not-allowed border border-stone-600 hover:border-stone-500 active:scale-95"
            >
              Undo
            </button>
            <button
              onClick={() => addRandomTile()}
              disabled={isAnimating}
              className="px-7 py-3 rounded-md bg-stone-700 hover:bg-stone-600 text-stone-100 font-light tracking-widest text-xs uppercase transition-all duration-200 shadow-lg hover:shadow-stone-900/50 disabled:opacity-40 disabled:cursor-not-allowed border border-stone-600 hover:border-stone-500 active:scale-95"
            >
              Spawn Tile
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <GridAnimated
        size={boardSize}
        tiles={tiles}
        colors={colors}
        onMove={handleMove}
        onReset={() => resetGame()}
      />

      {/* Game Over Modal */}
      {showGameOverModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-[#2C2C2C] to-[#1A1A1A] border-2 border-orange-500 rounded-lg shadow-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            {!showReport ? (
              <>
                <h2 className="text-4xl font-light text-center text-white tracking-widest mb-2">
                  GAME OVER
                </h2>
                <div className="h-1 w-20 bg-gradient-to-r from-orange-600 to-orange-500 mx-auto mb-6"></div>

                <div className="mb-8 text-center">
                  <p className="text-gray-400 text-sm font-light tracking-wide mb-3">FINAL SCORE</p>
                  <p className="text-5xl font-light text-orange-400 tracking-tight tabular-nums mb-4">{score}</p>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleNewGame}
                    className="px-6 py-3 rounded-md bg-gradient-to-br from-orange-600 to-orange-700 text-stone-50 font-light tracking-widest text-sm uppercase hover:from-orange-500 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-orange-900/50 active:scale-95"
                  >
                    Play Again
                  </button>
                  <button
                    onClick={handleViewReport}
                    disabled={reviewLoading}
                    className="px-6 py-3 rounded-md bg-stone-700 hover:bg-stone-600 text-stone-100 font-light tracking-widest text-sm uppercase transition-all duration-200 shadow-lg hover:shadow-stone-900/50 border border-stone-600 hover:border-stone-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {reviewLoading ? 'Generating Review...' : 'View Report'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-3xl font-light text-center text-white tracking-widest mb-2">
                  GAME REPORT
                </h2>
                <div className="h-1 w-20 bg-gradient-to-r from-orange-600 to-orange-500 mx-auto mb-6"></div>

                <div className="mb-8 space-y-4 text-gray-300">
                  <div className="bg-stone-800 bg-opacity-50 p-4 rounded">
                    <p className="text-xs font-light tracking-widest text-gray-500 mb-1">FINAL SCORE</p>
                    <p className="text-3xl font-light text-orange-400 tracking-tight tabular-nums">{score}</p>
                  </div>
                  <div className="bg-stone-800 bg-opacity-50 p-4 rounded">
                    <p className="text-xs font-light tracking-widest text-gray-500 mb-1">GRID SIZE</p>
                    <p className="text-3xl font-light text-stone-100 tracking-tight">{size}×{size}</p>
                  </div>
                </div>

                {/* AI Review Section */}
                <div className="mb-8">
                  <h3 className="text-sm font-light tracking-widest text-gray-400 mb-3 uppercase">AI REVIEW</h3>
                  <div className="bg-stone-800 bg-opacity-50 p-4 rounded min-h-[120px]">
                    {reviewLoading && (
                      <p className="text-gray-400 font-light text-sm">Analyzing your game...</p>
                    )}
                    {reviewError && (
                      <p className="text-red-400 font-light text-sm">{reviewError}</p>
                    )}
                    {reviewContent && !reviewLoading && (
                      <p className="text-stone-200 font-light text-sm leading-relaxed whitespace-pre-wrap">
                        {reviewContent}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setShowReport(false)}
                    className="px-6 py-3 rounded-md bg-stone-700 hover:bg-stone-600 text-stone-100 font-light tracking-widest text-sm uppercase transition-all duration-200 shadow-lg hover:shadow-stone-900/50 border border-stone-600 hover:border-stone-500 active:scale-95"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleNewGame}
                    className="px-6 py-3 rounded-md bg-gradient-to-br from-orange-600 to-orange-700 text-stone-50 font-light tracking-widest text-sm uppercase hover:from-orange-500 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-orange-900/50 active:scale-95"
                  >
                    Play Again
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}