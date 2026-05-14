# AI Platform

A self-hosted, ChatGPT-style platform where users create custom AI agents with system prompts, knowledge bases, and tools. Built as a learning project to touch every layer of production AI engineering — from token streaming in the browser down to self-hosted GPU inference. Currently at Phase 0: a FastAPI backend that streams LLM responses over SSE to a Next.js frontend.

## Stack

- **Backend:** Python 3.12, FastAPI, streaming via SSE (AI SDK UI Message Stream protocol)
- **Frontend:** Next.js (App Router), Tailwind CSS, Vercel AI SDK (`useChat`)
- **LLM:** DeepSeek (OpenAI-compatible API)

## Running locally

**Backend:**
```bash
cd backend
uv sync
uv run fastapi dev src/main.py
```
Needs `backend/.env` with `DEEPSEEK_API_KEY`, `AI_BASE_URL`.

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 and type a message — tokens stream back in real time.
