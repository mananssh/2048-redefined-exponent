'use client';

import React, { useState, useTransition } from 'react';
import { agentAction } from '@/actions/agent';
import { structuredColorPicker } from '@/actions/structured_output';

type AgentResult = { content?: string; finishReason?: string } | { error: string };

export default function GeneratePage() {
  const [prompt, setPrompt] = useState('');
  const [output, setOutput] = useState<AgentResult | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) {
      setOutput({ error: 'Prompt is required' });
      return;
    }

    startTransition(async () => {
      try {
        const form = new FormData();
        form.set('prompt', prompt);
        const result = (await structuredColorPicker(form)) as any;

        // result is expected to be either { content, finishReason } or { error }
        if (!result) {
          setOutput({ error: 'No response from server action' });
        } else if (result?.error) {
          setOutput({ error: String(result.error) });
        } else {
          setOutput({
            content: result.below16,
            finishReason: result.finishReason ? String(result.finishReason) : undefined,
          });
        }
      } catch (err: any) {
        setOutput({ error: err?.message ?? String(err) });
      }
    });
  }

  return (
    <div className="min-h-screen flex justify-center p-8 bg-gray-50">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">Gemini Chat</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <textarea
            name="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            placeholder="Enter your prompt..."
            className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            disabled={isPending || !prompt.trim()}
            className={`px-4 py-2 rounded-xl text-white font-semibold ${
              isPending || !prompt.trim() ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isPending ? 'Generating...' : 'Generate'}
          </button>
        </form>

        {output && (
          <div className="mt-6 p-4 bg-gray-100 rounded-xl border border-gray-200">
            {'error' in output ? (
              <>
                <h2 className="font-semibold mb-2 text-red-600">Error</h2>
                <pre className="whitespace-pre-wrap text-red-800">{output.error}</pre>
              </>
            ) : (
              <>
                <h2 className="font-semibold mb-2">Output</h2>
                <pre className="whitespace-pre-wrap text-gray-800">{output.content}</pre>
                {output.finishReason && (
                  <div className="mt-3 text-sm text-gray-600">
                    <strong>Finish reason:</strong> {output.finishReason}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
