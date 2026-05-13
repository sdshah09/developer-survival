# Multi-Tenant AI Agent Platform — Build Plan

A self-hosted ChatGPT-style platform where users create custom AI agents with tools, knowledge bases, and per-tenant isolation. Built to learn production AI engineering end-to-end.

---

## The Vision (one paragraph)

A SaaS-style platform where a user signs up, creates one or more "agents" (each with a custom system prompt, uploaded knowledge documents, and a selection of tools), and chats with them through a streaming UI. Conversations are private per user, agents can be shared at the team level, every interaction is traced and cost-attributed, and the inference layer eventually runs on self-hosted GPUs. The goal is to touch every layer of production AI engineering in one coherent project.

---

## Tech Stack

Do not churn on these. They are chosen and final.

**Backend**
- Python 3.12
- FastAPI (web framework)
- SQLAlchemy 2.0 (ORM)
- Pydantic v2 (validation)
- Alembic (DB migrations)

**Frontend**
- Next.js 14 (App Router)
- Tailwind CSS + shadcn/ui
- Vercel AI SDK (for streaming)

**Data layer**
- PostgreSQL (primary database)
- Redis (cache, queues, rate limiting)
- Qdrant (vector database)

**AI layer**
- Anthropic API (initial, replaced later by self-hosted)
- LangGraph (agent orchestration)
- Langfuse (LLM observability, self-hosted)
- vLLM (self-hosted inference, later phases)
- LoRAX (multi-LoRA serving, optional final phase)

**Infra**
- Docker + Docker Compose (local + early deployment)
- Celery (background jobs)
- Railway or Fly.io (early deployment)
- RunPod or Vast.ai (GPU rental for Phase 7+)
- Kubernetes (final phase only, optional)

---

## Phase 0 — Streaming Chat MVP

**Duration:** One evening, 2-3 hours.
**Goal:** A FastAPI endpoint that streams Claude responses, with a minimal HTML frontend.

**Tasks**
- Initialize Python project with venv
- Install FastAPI, uvicorn, anthropic, python-dotenv
- Create single `main.py` with a `/chat` endpoint that streams from Anthropic
- Build minimal `index.html` that posts to the endpoint and renders streaming output
- Initialize git, push to GitHub

**Definition of done**
- You type a message into the browser, see tokens stream back in real time
- Code is committed to a public GitHub repo
- README exists with one paragraph describing the project

**What you've learned**
- How LLM streaming APIs work
- Server-sent streaming responses in FastAPI
- The core loop every AI chat product is built on

---

## Phase 1 — Persistent Conversations

**Duration:** 1 week (4-6 hours of work).
**Goal:** Conversations are stored in Postgres, multi-turn chat works, basic Next.js frontend.

**Tasks**
- Add Postgres via Docker Compose
- Define schemas: `users`, `conversations`, `messages` (start with a fake `user_id` for now)
- Add SQLAlchemy models + Alembic for migrations
- Modify `/chat` endpoint to accept a `conversation_id`, load history, append new messages, send full history to Claude
- Add `/conversations` GET and POST endpoints
- Spin up Next.js project; build chat UI with sidebar listing conversations
- Use Vercel AI SDK's `useChat` hook to handle streaming + state

**Definition of done**
- Multi-turn conversation works (the model remembers earlier turns in the same conversation)
- You can create a new conversation, switch between conversations, see message history
- Refreshing the browser preserves state

**What you've learned**
- Multi-turn LLM context management
- Modern frontend streaming patterns
- Schema design for chat applications

---

## Phase 2 — Auth and Multi-Tenancy

**Duration:** 1 week.
**Goal:** Real user accounts, conversations isolated per user.

**Tasks**
- Add `auth` table or use a library (suggested: `fastapi-users` or roll your own with JWT)
- Email + password signup, login, JWT token in cookies or headers
- Add `user_id` foreign key to `conversations`
- Middleware that extracts current user from JWT, attaches to request
- All queries filtered by `user_id` (tenant isolation)
- Frontend: signup page, login page, logout, protected routes

**Definition of done**
- Two different users can sign up and only see their own conversations
- Logging out clears state
- Unauthenticated requests to protected endpoints are rejected

**What you've learned**
- Multi-tenant data isolation patterns
- JWT auth flows
- Why row-level security matters in SaaS

---

## Phase 3 — Custom Agents

**Duration:** 1 week.
**Goal:** Users can create multiple "agents," each with its own system prompt and config. Chats happen with a specific agent.

**Tasks**
- New `agents` table: `id`, `user_id`, `name`, `system_prompt`, `model`, `created_at`
- CRUD endpoints for agents
- `conversations` table gets a `agent_id` foreign key
- When chatting, the agent's `system_prompt` is prepended to the conversation
- Frontend: agents list page, create/edit agent form, agent picker in chat UI

**Definition of done**
- A user can create "Coding Helper" and "Writing Coach" agents with different system prompts
- Starting a new conversation requires picking an agent
- The agent's personality is clearly different in responses

**What you've learned**
- The product surface that makes "Custom GPTs" possible
- Configuration vs code — agents are data, not deployed services

---

## Phase 4 — RAG (Knowledge Bases)

**Duration:** 2 weeks.
**Goal:** Each agent can have uploaded documents that it retrieves from during chat.

**Tasks**
- Add Qdrant via Docker Compose
- File upload endpoint (accept PDF, TXT, MD)
- Document parsing (use `unstructured` or `pypdf` + a markdown parser)
- Chunking (start simple: ~500 tokens with 50 token overlap)
- Embedding generation (use Voyage AI, Cohere, or OpenAI embeddings — pick one)
- Store chunks in Qdrant with one collection per agent
- On chat, embed the user's query, retrieve top-K chunks, inject into the prompt
- Add citations to responses (model references which chunks it used)
- Move document ingestion to Celery so the API doesn't block on big uploads
- Frontend: upload UI per agent, list of uploaded docs, citations rendered in chat

**Definition of done**
- You upload your resume to an agent and ask "what's my most recent job?" — it answers correctly
- Citations appear inline and link back to the source document
- Large file uploads don't freeze the UI

**What you've learned**
- The full RAG pipeline
- Vector search internals
- Background job patterns
- Why chunking strategy matters (you'll see bad retrieval and fix it)

---

## Phase 5 — Tools and Agent Loops

**Duration:** 2 weeks.
**Goal:** Agents can call tools (web search, code execution, DB queries) using LangGraph.

**Tasks**
- Install LangGraph
- Build a registry of tools: `web_search` (use Tavily or Brave API), `fetch_url`, `calculator`, `query_user_db`
- Define agent state schema with LangGraph: messages, tool calls, retrieved context
- Build a ReAct-style graph: plan → tool call → reflect → respond
- Per-agent tool permissions (stored in the `agents` table as a JSON column)
- Tool execution with timeouts, retries, and graceful failure
- Frontend: render tool calls inline ("🔍 Searching the web for..."), show results

**Definition of done**
- An agent can answer "what's the latest news on X" by calling web search
- An agent can do multi-step reasoning: search → read result → search again → answer
- Tool failures don't crash the conversation

**What you've learned**
- Agent state machines
- Tool calling patterns
- Why agents are hard (loops, infinite recursion, hallucinated tool args)
- LangGraph specifically — the most-used agent framework in 2026

---

## Phase 6 — Observability

**Duration:** 1 week.
**Goal:** Every LLM call, tool call, and agent step is traced. Cost dashboards exist.

**Tasks**
- Self-host Langfuse via Docker Compose
- Instrument all LLM calls and tool calls with Langfuse traces
- Build a simple "Activity" dashboard page: tokens used today, cost today, per-agent breakdown
- Add structured logging throughout (use `structlog`)
- Add basic Prometheus metrics: requests per second, latency percentiles, error rate

**Definition of done**
- You can open Langfuse and see every conversation as a trace tree
- Your dashboard shows cost per user and per agent
- A failing tool call is immediately visible

**What you've learned**
- LLM-specific tracing (different from regular APM)
- Cost engineering
- The discipline that separates senior from junior AI engineers

---

## Phase 7 — Self-Hosted Inference

**Duration:** 2 weeks.
**Goal:** Replace the Anthropic API with a self-hosted open-source model running on a real GPU.

**Tasks**
- Rent a GPU on RunPod (start with an A10 or L4, ~$0.50/hr)
- Deploy vLLM serving Qwen 2.5 7B or Llama 3.1 8B (OpenAI-compatible API)
- Benchmark: tokens per second, time to first token, max concurrent requests
- Build a "model router" abstraction in your backend: requests can go to Anthropic, OpenAI, or your vLLM endpoint based on agent config
- Add prompt caching (Anthropic) and KV cache awareness (vLLM)
- Add semantic caching in Redis: embed queries, check for near-duplicates, return cached response

**Definition of done**
- A user can pick "self-hosted Qwen" as the model for their agent and it works
- You have real numbers: tokens/sec, cost per million tokens, P95 latency
- Cache hit rate is visible in your dashboard

**What you've learned**
- Why inference is expensive
- Continuous batching, KV cache, prefill vs decode (by watching them work)
- The actual tradeoffs of self-hosting vs APIs

---

## Phase 8 — Production Infrastructure (Optional Deep End)

**Duration:** 3-4 weeks.
**Goal:** Run the platform like a real company would.

**Tasks**
- Move from Docker Compose to Kubernetes (managed K8s on DigitalOcean or GKE)
- Deploy vLLM behind a GPU node pool with autoscaling on queue depth
- Implement multi-LoRA serving with LoRAX so each user can fine-tune their own adapter
- Set up CI/CD: every push runs evals (golden questions, LLM-as-judge scoring)
- Add canary deployments for model changes
- Build a real evals pipeline with regression detection
- Configure HPA, network policies, secrets management

**Definition of done**
- The platform survives a load test of 50 concurrent users
- A bad prompt change is caught by evals before it ships
- You can deploy a new version with zero downtime

**What you've learned**
- Real production ops for AI systems
- Why eval-driven development matters
- Infrastructure that 90% of AI engineers never touch

---

## Timeline Summary

| Phase | Duration | Total Elapsed |
|-------|----------|---------------|
| 0     | 1 evening | Day 1 |
| 1     | 1 week    | Week 1 |
| 2     | 1 week    | Week 2 |
| 3     | 1 week    | Week 3 |
| 4     | 2 weeks   | Week 5 |
| 5     | 2 weeks   | Week 7 |
| 6     | 1 week    | Week 8 |
| 7     | 2 weeks   | Week 10 |
| 8     | 3-4 weeks | Week 14 |

**Realistic estimate:** 3-4 months for Phases 0-6 (the portfolio-ready version), 5-6 months for the full Phase 8 finish. Working evenings and weekends.

If you push hard and have free time: cut these in half. If life gets busy: double them. Either way, the order doesn't change.

---

## Rules of Engagement

These are not suggestions. Following them is the difference between finishing and not finishing.

1. **One phase at a time.** Do not start Phase 2 before Phase 1 ships. Do not "just peek" at Phase 5 while building Phase 3.

2. **Ship every phase.** Each phase must be deployable, demoable, and committed to GitHub before moving on. No half-finished phases.

3. **No stack churn.** The tech stack above is locked. If you find a "better" library mid-project, write it down for v2 and keep building.

4. **No new frameworks until the current one hurts.** Don't introduce LangGraph in Phase 0. Don't use Kubernetes before Phase 8. Each new tool must be justified by pain you've personally hit.

5. **Bugs are the curriculum.** When something breaks, that's the learning. Spend 30 minutes trying yourself, then ask for help with the specific error message.

6. **Write a public dev log.** A tweet thread, blog, or even a Notion page. One entry per phase: what you built, what broke, what you learned. This is half the value of the project.

7. **No comparison shopping.** Stop looking at how Perplexity or OpenAI do it. You are building a learning artifact, not competing with billion-dollar companies.

8. **Time-box meta-questions.** "Should I refactor this?" → 10 min decision, then move on. "Is this the right approach?" → ship it first, refactor later.

---

## Failure Modes to Watch For

- **Quitting at Phase 2** because auth feels boring. Push through, it's 5 days.
- **Rewriting Phase 0** because you "found a better way." Don't.
- **Reading instead of building** when stuck. 30 min reading max, then code something.
- **Switching to a new project** at week 4. This is the project.
- **Skipping evals and observability** because they're not flashy. They're the most important parts.

---

## What You'll Have at the End

**A working product**
- Multi-tenant SaaS-style AI agent platform
- Deployed and accessible at a real URL
- Real users (you and friends) can sign up and use it

**A portfolio artifact**
- Public GitHub repo with clean README and architecture diagram
- Dev log documenting your learning journey
- Screenshots and demo video

**A skillset**
- Production AI engineering across the full stack
- Comfort with: FastAPI, Postgres, Redis, Qdrant, LangGraph, vLLM, Langfuse, Docker, K8s
- Concrete experience with: streaming, RAG, agents, tool calling, multi-tenancy, observability, self-hosted inference

**A new version of yourself**
- You went from asking what to learn to having built the thing
- Every concept in modern AI engineering is no longer abstract
- You can interview at any AI company and have specific stories for every question

---

## The Only Question That Matters Now

Has Phase 0 shipped?

If yes — congratulations, you're in the 10% who actually start. Now ship Phase 1.

If no — that's the work. Everything in this document is worthless until `uvicorn main:app --reload` is running on your machine.

Go.
