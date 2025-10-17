// actions/generateBackground.ts
'use server';

import { InferenceClient } from "@huggingface/inference";

export async function generateBackgroundImage(formData: FormData) {
  const theme = String(formData.get('theme') ?? '').trim();
  if (!theme) return { error: "Theme is required" };

  try {
    const client = new InferenceClient(process.env.HF_TOKEN);

    // Construct a prompt for a dark, visually appealing background
    const prompt = `
      Generate a visually stunning, dark-themed background image inspired by "${theme}".
      It should have rich colors, depth, and contrast.
      The image should feel dynamic and immersive, suitable as a background for a game.
      Avoid including any game UI elements or recognizable 2048 tiles.
      Prefer a cinematic or abstract art style.
      Resolution: 1920x1080 pixels.
    `;

    const imageBlob = await client.textToImage({
      provider: "fal-ai",
      model: "ByteDance/SDXL-Lightning",
      inputs: prompt,
      parameters: {
        num_inference_steps: 5,
      },
    });

    return imageBlob; // This is a Blob; you can convert to URL with URL.createObjectURL on client
  } catch (err: any) {
    console.error("generateBackgroundImage error", err);
    return { error: err?.message ?? "Unknown generation error" };
  }
}
