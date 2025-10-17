"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';

const ClientGame = dynamic(() => import('@/components/ClientGame'), { ssr: false });

export default function Page() {
  const [boardSize, setBoardSize] = useState<number | null>(null);

  const handleSizeSelection = (size: number) => {
    if (size > 8) {
      const confirmed = window.confirm(`Dude, really? Are you sure you want a ${size}x${size} board?`);
      if (confirmed) {
        setBoardSize(size);
      }
    } else {
      setBoardSize(size);
    }
  };

  if (boardSize === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-8 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-6">
        <div className="text-center">
          <h1 className="text-6xl font-light tracking-widest text-amber-950" style={{ letterSpacing: '0.08em' }}>
            2048 REDEFINED
          </h1>
          <p className="text-lg text-amber-700 font-light tracking-wide mt-3">
            Select Your Board Size
          </p>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-md items-center">
          <p className="text-amber-900 font-light text-center">Choose your preferred board size:</p>
          <div className="grid grid-cols-3 gap-3">
            {[2, 3, 4, 5, 6, 7, 8].map((size) => (
              <button
                key={size}
                onClick={() => handleSizeSelection(size)}
                className="px-4 py-3 rounded-lg bg-gradient-to-br from-amber-600 to-orange-600 text-white font-light tracking-widest text-sm uppercase hover:from-amber-500 hover:to-orange-500 transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
              >
                {size}×{size}
              </button>
            ))}
            <button
              onClick={() => {
                const customSize = prompt('Enter board size (2-12):', '4');
                if (customSize) {
                  const size = Math.max(2, Math.min(12, parseInt(customSize) || 4));
                  handleSizeSelection(size);
                }
              }}
              className="px-4 py-3 rounded-lg bg-gradient-to-br from-stone-600 to-stone-700 text-white font-light tracking-widest text-sm uppercase hover:from-stone-500 hover:to-stone-600 transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
            >
              Custom
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <ClientGame boardSize={boardSize} />;
}