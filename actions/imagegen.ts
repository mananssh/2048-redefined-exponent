'use server';

export async function generateBackgroundImage(theme: string) {
  theme = theme?.trim();
  if (!theme) throw new Error("Theme is required");

  try {
    const prompt = `
      Generate a visually stunning, dark-themed background image inspired by "${theme}".
      It should have rich colors, depth, and contrast.
      If the theme is a book, movie, or show, include their main characters subtly in the background.
      The image should feel dynamic and immersive.
      Avoid including any game UI elements or recognizable 2048 tiles.
      Prefer a cinematic or abstract art style.
      Resolution: 1920x1080 pixels.
    `;

    const response = await fetch(
      "https://router.huggingface.co/fal-ai/fal-ai/lightning-models",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sync_mode: true, prompt }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API returned ${response.status}: ${text}`);
    }

    const json = await response.json();
    const imageUrl = json?.images?.[0]?.url;
    if (!imageUrl) throw new Error("No image returned from model");

    return imageUrl;
  } catch (err: any) {
    throw new Error(err?.message ?? "Unknown generation error");
  }
}
