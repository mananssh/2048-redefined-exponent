'use server';

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import type { TileObj } from '../lib/tileLogic';

type GameReviewResult = {
    content?: string;
    error?: string;
    finishReason?: string;
};

export async function gameReviewAgent(formData: FormData): Promise<GameReviewResult> {
    const rawHistory = formData.get('history');
    if (!rawHistory) return { error: 'Game history is required' };

    let history: TileObj[][];
    try {
        history = JSON.parse(rawHistory as string) as TileObj[][];
        if (!Array.isArray(history)) throw new Error('Invalid history format');
    } catch (err: any) {
        return { error: 'Invalid history JSON: ' + err.message };
    }

    try {
        const model = new ChatGoogleGenerativeAI({
            model: 'gemini-2.5-flash',
            temperature: 0.3,
            apiKey: process.env.GOOGLE_API_KEY,
        });

        // Build a clear prompt for the AI
        const prompt = `
You are a game analysis AI for a 2048-style tile game.
You are given the full board history as an array of tile snapshots after each move.
Each snapshot is an array of tiles with properties: id, value, r (row), c (column).
Analyze the game and provide a **concise, plain-text review** of the moves.

- Highlight good moves, mistakes, and notable merges.
- Limit summary to **under 10 key points**, do not comment on every single move.
- Focus on strategy, efficiency, and notable decisions.
- Do not use Markdown; output should be plain text suitable for HTML rendering.
- Example output: "You made strong moves combining high tiles early. One inefficient move blocked a 64 merge. Overall solid strategy."

Here is the JSON history:
${JSON.stringify(history)}
`;

        const response = await model.invoke(prompt);

        function toPlainString(resp: any): string {
            if (typeof resp === 'string') return resp;
            const cont = resp?.content ?? resp;
            if (typeof cont === 'string') return cont;
            if (Array.isArray(cont)) {
                return cont
                    .map((item: any) =>
                        typeof item === 'string' ? item : (item?.text ?? JSON.stringify(item))
                    )
                    .join('\n');
            }
            return cont?.text ?? JSON.stringify(cont ?? 'No content');
        }

        const content = toPlainString(response);

        const finishReason =
            response?.additional_kwargs?.finishReason ??
            response?.response_metadata?.finishReason ??
            'UNKNOWN';

        return { content: content as string, finishReason: finishReason as string };
    } catch (err: any) {
        console.error('gameReviewAgent error', err);
        return { error: err?.message ?? 'Unknown model error' };
    }
}
