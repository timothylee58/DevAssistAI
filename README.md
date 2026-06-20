# DevAssist — AI Pair Programmer
> An intelligent developer-focused chatbot with code execution, GitHub context, and technical tooling. Built on Next.js App Router + Vercel AI SDK.

![DevAssist Banner](app/(chat)/opengraph-image.png)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/templates/next.js/nextjs-ai-chatbot)
![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Tool Integrations](#tool-integrations)
- [Deployment](#deployment)
- [Roadmap](#roadmap)

---

## Overview

DevAssist is a developer-focused AI pair programmer that understands code context, executes code in a sandbox, fetches live documentation, and explains errors. It differs from generic chatbots by being purpose-built for software engineering workflows.

**Target users:** Developers who want an AI coding assistant embedded in their workflow without leaving the browser.

---

## Features

### Core

- **Multi-model support** — xAI Grok, OpenAI GPT-4o, switchable via UI dropdown
- **Auth.js authentication** — secure login with GitHub OAuth
- **Persistent chat history** — stored in Neon Serverless Postgres
- **File storage** — Vercel Blob for attachments and code files

### Developer-Specific

- **🔧 Code execution** — run Python/JS/Bash snippets via sandboxed API (Piston)
- **📖 Docs lookup** — real-time MDN, Next.js, React documentation fetching
- **🐛 Error explainer** — paste a stack trace, get root cause + fix
- **🔗 GitHub integration** — connect a repo, read files, suggest changes
- **✨ Syntax highlighting** — Shiki-powered code blocks with language detection
- **🧠 Model comparison** — side-by-side xAI vs OpenAI responses

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                   Next.js App Router                  │
│  ┌─────────────┐   ┌──────────────┐   ┌───────────┐  │
│  │  Chat UI    │   │  Tool Calls  │   │  Auth.js  │  │
│  │ (shadcn/ui) │   │  (AI SDK)    │   │  (GitHub) │  │
│  └──────┬──────┘   └──────┬───────┘   └─────┬─────┘  │
│         └─────────────────┼─────────────────┘        │
│                     ┌─────▼──────┐                   │
│                     │  AI Route  │                   │
│                     │ /api/chat  │                   │
│                     └─────┬──────┘                   │
└───────────────────────────┼──────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
  ┌──────────┐      ┌──────────────┐    ┌──────────────┐
  │ xAI/OAI  │      │ Piston API   │    │  Neon Postgres│
  │ (models) │      │ (code exec)  │    │  (history)    │
  └──────────┘      └──────────────┘    └──────────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 15 (App Router) | SSR, routing, server actions |
| Language | TypeScript 5 | Type safety |
| AI SDK | Vercel AI SDK 4 | Streaming, tool calls, model switching |
| UI | shadcn/ui + Tailwind CSS | Component library |
| Auth | Auth.js v5 | GitHub OAuth |
| Database | Neon Serverless Postgres | Chat history, user sessions |
| ORM | Drizzle ORM | Type-safe DB queries |
| Storage | Vercel Blob | File uploads |
| Code Exec | Piston API | Sandboxed code execution |
| Syntax HL | Shiki | Code block rendering |
| Testing | Playwright | E2E tests |
| Linting | Biome | Fast linting + formatting |

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- A Neon Postgres database
- GitHub OAuth app credentials

### Installation

```bash
# Clone the repository
git clone https://github.com/timothylee58/nextjs-ai-chatbot.git
cd nextjs-ai-chatbot

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Run database migrations
pnpm db:migrate

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## Environment Variables

```env
# Hugging Face Inference API
HUGGING_FACE_API_KEY=your_hugging_face_api_key

# Auth
AUTH_SECRET=your_auth_secret
AUTH_GITHUB_ID=your_github_oauth_app_id
AUTH_GITHUB_SECRET=your_github_oauth_app_secret

# Database
POSTGRES_URL=your_neon_postgres_url

# Storage
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

---

## Tool Integrations

### Code Execution (`run_code`)

Executes code snippets in an isolated sandbox. Supports Python, JavaScript, TypeScript, Bash.

```typescript
// lib/ai/tools/run-code.ts
export const runCode = tool({
  description: 'Execute code in a sandboxed environment',
  parameters: z.object({
    language: z.enum(['python', 'javascript', 'typescript', 'bash']),
    code: z.string(),
  }),
  execute: async ({ language, code }) => {
    // Calls Piston API
  },
})
```

### Documentation Lookup (`search_docs`)

Fetches live documentation from MDN, Next.js, React, and Tailwind.

### Error Explainer (`explain_error`)

Accepts a stack trace and returns a structured analysis with root cause and suggested fix.

---

## Deployment

### Vercel (Recommended)

```bash
vercel deploy
```

Set environment variables in the Vercel dashboard under **Project → Settings → Environment Variables**.

### Docker

```bash
docker build -t devassist .
docker run -p 3000:3000 --env-file .env.local devassist
```

---

## Roadmap

- [ ] GitHub repo file explorer in sidebar
- [ ] Multi-file diff viewer
- [ ] Saved code snippets library
- [ ] Shareable chat sessions
- [ ] VS Code extension

---

## Contributing

Pull requests are welcome. For major changes, open an issue first.

## License

[MIT](LICENSE)

---

*Built by [Timothy Lee](https://github.com/timothylee58)*
