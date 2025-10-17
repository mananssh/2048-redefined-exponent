'use client';

import { useState } from 'react';
import { generateBackgroundImage } from '../actions/imagegen';

export default function BackgroundGenerator() {
  const [theme, setTheme] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      // Directly call the server action
      const url = await generateBackgroundImage(theme);
      setImageUrl(url);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4">
      <input
        type="text"
        placeholder="Enter a theme"
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
        className="border p-2 mr-2"
      />
      <button onClick={handleGenerate} className="bg-blue-600 text-white px-4 py-2">
        Generate Background
      </button>

      {loading && <p>Generating image...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {imageUrl && (
        <img
          src={imageUrl}
          alt={`Background for ${theme}`}
          className="mt-4 max-w-full rounded-lg shadow-lg"
        />
      )}
    </div>
  );
}
