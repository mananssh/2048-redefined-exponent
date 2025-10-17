# 2048-Redefined
### Deployed link: https://2048-redefined-exponent.vercel.app

An advanced, AI-enhanced reimagining of the classic 2048 game built with Next.js, React, and TypeScript. This project combines a custom tile engine, smooth Framer Motion animations, dynamic theme-aware color palettes, and AI-driven features (image generation and game review) for an immersive and intelligent 2048 experience.

Key highlights:
- Custom tile engine (`useTileGame`) supporting spawning, merging, undo, and animated move phases.
- Theme-driven, dark-first UI with AI-generated background images (Hugging Face / SDXL-Lightning) and structured color palettes (Gemini via LangChain).
- Game review agent powered by LangGraph (with Gemini as the underlying LLM) which analyzes the player's move history and returns concise strategy feedback.
- Responsive UI with polished controls, game over modal, and a compact score panel.

## TL;DR

Not just a 2048 game, a different 2048 experience that customizes the theme and background image based on a user-input prompt, with customizable board size. Post-game, an AI-powered game review is also generated which helps the user understand and analyse their gameplay better.

## Table of Contents

- Features
- Tech stack
- Quick start
- Environment variables
- How it works (architecture)
- AI integrations
- File map
- Contributing
- License

## Features

- Play on boards from 2×2 up to 12×12 (custom size allowed).
- Smooth sliding and merge animations using Framer Motion.
- Undo, spawn tile, and new game controls.
- Theme entry form: choose a theme to generate a cohesive color palette and a dark-themed background image.
- AI Review: at game end, request a concise, human-like review of the last game (good moves, mistakes, opportunities).

## Tech stack

- Next.js 15 (App Router)
- React 19 + TypeScript
- Framer Motion for animations
- Tailwind CSS for styling
- LangChain for structured AI calls (Gemini via `@langchain/google-genai`)
- Hugging Face image generation (SDXL-Lightning via direct API calls)

## Quick start

1. Install dependencies

```bash
npm install --legacy-peer-deps
```

2. Add required environment variables (see below).

3. Run the dev server

```bash
npm run dev
```

Open http://localhost:3000

## Environment variables

The project integrates with external AI services. To enable image generation and review features, set these variables in a `.env.local` file at the project root:

- `HF_TOKEN` — Hugging Face API token (used in `actions/imagegen.ts`).
- `GOOGLE_API_KEY` — Google GenAI API key (used by LangChain wrappers in `actions/structured_output.ts` and `actions/gamereview.ts`).

Notes:
- If you don't provide these keys, the app will fall back to default theme behavior for colors, and AI calls will fail with server errors (handled in UI with messages). Keep keys secret.

## How it works (architecture)

High level flow:

- The app uses Next.js App Router with a client-only `ClientGame` component that initializes `useTileGame`.
- `useTileGame` implements the tile model and move lifecycle (computeMove from `lib/tileLogic.ts`) and exposes actions to the UI: `handleMove`, `undo`, `resetGame`, and `addRandomTile`.
- `GridAnimated` and `Tile` components render tiles and run Framer Motion transitions for sliding and merge/pop visuals.
- When a player submits a theme, `actions/structured_output.ts` invokes Gemini via LangChain with a Zod schema to receive a structured color palette. `actions/imagegen.ts` calls the Hugging Face image endpoint to produce a dark-themed background image.
- At game end, `actions/gamereview.ts` sends the game's `historyRef` (an array of Tile snapshots) to Gemini via LangChain to receive a concise strategy review.

Design notes:
- Tile movement is computed entirely in `lib/tileLogic.ts` producing a MoveResult describing move steps and merges. The hook (`useTileGame`) then phases updates to enable animated transitions and keep UI in sync.
- Structured color output uses Zod and LangChain's structured output to ensure predictable JSON matching `types/ColorSchema.ts`.

## AI integrations

1) Background image generation

- Implemented in `actions/imagegen.ts`. It POSTs a prompt to Hugging Face's (Fal/FAL AI) router endpoint to request an image with a cinematic/abstract dark style. The returned image URL is used as a CSS background.

2) Structured color palettes

- Implemented in `actions/structured_output.ts`. It invokes Gemini (via LangChain) with a prompt that requests a single JSON object matching `types/ColorSchema.ts`. This ensures consistent palette shapes and colors for tile gradients and text contrast.

3) Game review agent

- Implemented in `actions/gamereview.ts`. It sends the entire tile history (TileObj[][]) to Gemini and asks for a concise, plain-text game review limited to <10 points focusing on strategy.

Security & cost notes:
- AI calls are server actions (server-only) but will consume API quotas. Use environment variables and secure your keys.
- Avoid deploying with keys in public repos.

## File map (important files)

- `app/page.tsx` — Entry that picks board size and lazy-loads the client game. 
- `components/ClientGame.tsx` — Main client component handling theme selection, calling server actions, and composing the UI.
- `components/GridAnimated.tsx` — Renders the grid and children tiles with Framer Motion (handles slide transitions).
- `components/Tile.tsx` — Visual tile component (gradient, value label, pop animations).
- `hooks/useTileGame.ts` — Core tile hook exposing game state and actions (undo, spawn, moves, historyRef).
- `lib/tileLogic.ts` — Pure move/merge logic producing MoveResult for animations.
- `lib/gameLogic.ts` — Board helpers (addRandomTile, move operations, game over checks).
- `actions/structured_output.ts` — Server action that requests structured color palettes from Gemini via LangChain and Zod.
- `actions/imagegen.ts` — Server action that requests an image from Hugging Face's SDXL-Lightning model.
- `actions/gamereview.ts` — Server action using LangChain / Gemini to analyze move history and produce a review.
- `types/ColorSchema.ts` — Zod schema that describes the color palette shape used by the client.
