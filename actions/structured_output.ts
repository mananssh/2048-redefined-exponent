'use server';

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ColorScheme } from '@/types/ColorSchema';

export async function structuredColorPicker(formData: FormData) {
  const theme = String(formData.get('prompt') ?? '').trim();
  if (!theme) return { error: 'Prompt is required' };

  const prompt = `You are an expert UI color designer for casual games. The user will provide a theme name. For the given theme, output **only** a single JSON object (no explanation, no prose, nothing else) that exactly matches this shape:

{
  "below4": "RRGGBB,RRGGBB",
  "below8": "RRGGBB,RRGGBB",
  "below16": "RRGGBB,RRGGBB",
  "below64": "RRGGBB,RRGGBB",
  "below256": "RRGGBB,RRGGBB",
  "below1024": "RRGGBB,RRGGBB",
  "above1024": "RRGGBB,RRGGBB"
}

Rules (must follow):
1. Each value must be a valid 6-digit hex color string in the form RRGGBB,RRGGBB.
2. Colors should form a cohesive palette that evokes the theme "${theme}".
3. Give me properly contrasting text colors for each background color.
4. Use warmer/brighter backgrounds for larger values.
5. Do NOT output any extra keys, comments, or text — only the JSON object above.
6. If the theme references copyrighted IP, produce an original palette inspired by the theme.

Now produce the JSON palette for the theme: "${theme}"`;

  try {
    const model = new ChatGoogleGenerativeAI({
      model: 'gemini-2.5-flash',
      temperature: 0,
      apiKey: process.env.GOOGLE_API_KEY,
    });

    // Wrap with structured output using Zod
    const structuredModel = model.withStructuredOutput(ColorScheme);
    const response = await structuredModel.invoke(prompt);

    // `response` is already typed according to ColorScheme
    console.log('Structured palette:', response);
    return response;
  } catch (err: any) {
    console.error('structuredColorPicker error', err);
    return { error: err?.message ?? 'Unknown model error' };
  }
}
