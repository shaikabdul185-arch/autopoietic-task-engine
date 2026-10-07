# Autopoietic Task Engine

A self-decomposing task engine. Give it one big goal and it keeps **breaking the goal into smaller sub-tasks** until each one is simple enough to do directly, then carries out those simple ("atomic") tasks. The growing task tree is drawn live as it works.

*Autopoietic* means "self-making": the engine builds its own structure of work from a single goal.

## How it works

1. You enter a **primary objective**.
2. A worker loop picks the next pending task every 500 ms.
3. **Non-atomic task:** Gemini decomposes it into 2–4 sub-tasks and marks each one atomic or not (structured JSON output).
4. **Atomic task:** Gemini executes it and returns a concrete result.
5. Repeat until no pending tasks are left. Each task moves through `pending → decomposing/executing → completed/failed`.

## Features

- **Live task tree:** D3 tree layout that grows as tasks split
- **Recursive decomposition:** guided by a JSON schema, so the model returns well-formed sub-tasks every time
- **Execution log:** time-stamped record of every split and completion
- **Status tracking:** see which branches are still working, done or failed
- **Smooth transitions:** status changes animate with Motion

## Tech stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · D3 · Motion · Google Gen AI SDK (`gemini-3-flash-preview`)

## Run locally

Requires Node.js 18.18+.

```bash
git clone https://github.com/shaikabdul185-arch/autopoietic-task-engine.git
cd autopoietic-task-engine
npm install
cp .env.example .env.local   # then add your key
npm run dev
```

Open http://localhost:3000. Get a free Gemini API key at https://aistudio.google.com/apikey.

Production build: `npm run build && npm start`.

## Project structure

```
app/page.tsx          Main UI: objective input, tree, log
app/layout.tsx        Root layout and fonts
app/globals.css       Theme
lib/useTaskEngine.ts  The engine: worker loop, decompose/execute calls
lib/TaskTree.tsx      D3 tree visualization
lib/types.ts          Task model and JSON schemas
```

## A note on API keys

`NEXT_PUBLIC_` variables are sent to the browser. That's fine for local use, but for a public deployment, move the Gemini calls into a server route so your key stays private.
