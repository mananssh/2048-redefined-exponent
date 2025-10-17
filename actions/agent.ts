// actions/agent.ts
'use server';

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

export async function agentAction(formData: FormData) {
  const prompt = String(formData.get('prompt') ?? '').trim();
  if (!prompt) return { error: 'Prompt is required' };

  try {
    const model = new ChatGoogleGenerativeAI({
      model: 'gemini-2.5-flash',
      temperature: 0,
      apiKey: process.env.GOOGLE_API_KEY,
    });

    const response = await model.invoke(prompt);

    const content =
      typeof response === 'string'
        ? response
        : response?.content ?? 'No content';
    const finishReason =
      response?.additional_kwargs?.finishReason ??
      response?.response_metadata?.finishReason ??
      'UNKNOWN';

    return { content, finishReason };
  } catch (err: any) {
    console.error('agentAction error', err);
    return { error: err?.message ?? 'Unknown model error' };
  }
}
