# DevAssist

**AI Pair Programmer for developers**

DevAssist is a purpose-built developer tool powered by the Vercel AI SDK. It helps you debug code, explain errors, write and review code, and find documentation — all in a chat interface designed for developers.

---

## Table of Contents

- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [AI Tools Deep-Dive](#ai-tools-deep-dive)
- [Supported Models](#supported-models)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
  - [Local Dev Workflow](#local-dev-workflow)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Code Execution** — Run Python, JavaScript, TypeScript, and Bash directly in chat via the [Piston API](https://github.com/engineer-man/piston) sandbox. No API key required.
- **Error Explanation** — Paste any stack trace and get a structured breakdown: root cause, step-by-step fix, and a relevant docs link.
- **Documentation Lookup** — Search MDN, Next.js, React, Tailwind CSS, and Node.js documentation without leaving the chat.
- **Syntax Highlighting** — All code blocks are rendered with [Shiki](https://shiki.style) using the `github-dark` theme, with async loading and a plain-text fallback.
- **Multi-Model Support** — Switch between Anthropic Claude, OpenAI GPT, Google Gemini, and xAI Grok models from the chat input.
- **Artifact Pane** — Long-form outputs (documents, code files, spreadsheets) open in a side-by-side editor panel with real-time updates.
- **Persistent Chat History** — All conversations are saved to Postgres and paginated in the sidebar.
- **Resumable Streams** — AI responses survive page navigation via Redis-backed stream checkpoints (optional).
- **Auth** — Secure email/password sign-in powered by Auth.js (NextAuth v5).

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Browser (React 19)                │
│  ┌──────────────┐  ┌────────────────┐  ┌─────────┐  │
│  │  Chat UI     │  │  Artifact Pane │  │ Sidebar │  │
│  │ (multimodal- │  │ (code/doc/     │  │ history │  │
│  │  input.tsx)  │  │  sheet editor) │  │         │  │
│  └──────┬───────┘  └───────┬────────┘  └────┬────┘  │
│         │  useChat (AI SDK React)            │       │
└─────────┼──────────────────┼────────────────┼───────┘
          │ POST /api/chat   │                │ SWR
          ▼                  ▼                ▼
┌─────────────────────────────────────────────────────┐
│               Next.js App Router (Server)            │
│                                                      │
│  app/(chat)/api/chat/route.ts                        │
│  ┌─────────────────────────────────────────────┐    │
│  │  Auth check → Rate limit → streamText()     │    │
│  │                                             │    │
│  │  Tools:  run_code  explain_error  search_docs│    │
│  │          getWeather  createDocument  ...    │    │
│  └──────────────────┬──────────────────────────┘    │
│                     │                               │
│       ┌─────────────▼──────────────┐                │
│       │   Vercel AI Gateway         │                │
│       │  (model routing + billing)  │                │
│       └─────────────────────────────┘                │
└─────────────────────────────────────────────────────┘
          │ Drizzle ORM          │ Redis (optional)
          ▼                      ▼
   Neon Postgres           Resumable Streams
   (users, chats,          (stream checkpoints
    messages, docs)         for page nav)
```

**Request lifecycle:**

1. The browser sends a `POST /api/chat` with the message history and selected model ID.
2. The route authenticates the session (Auth.js), checks the daily rate limit, and saves/loads the chat record.
3. `streamText()` (Vercel AI SDK) calls the selected model via the AI Gateway with the available tools.
4. The model streams a response back through a `UIMessageStream`, which the client consumes via `useChat`.
5. On stream completion, all assistant messages and tool results are persisted to Postgres.

---

## AI Tools Deep-Dive

### `run_code`

Executes code in a secure sandbox using the [Piston API](https://emkc.org/api/v2/piston/execute). No API key or account required.

| Parameter | Type | Description |
|---|---|---|
| `language` | `python \| javascript \| typescript \| bash` | Runtime to use |
| `code` | `string` | Source code to execute |

**Returns:** `{ output: string, error: string, exitCode: number }`

**Example prompt:** *"Write a Python function to find all prime numbers up to 100 and run it."*

---

### `explain_error`

A structured schema tool — the AI itself fills in the fields when analysing a stack trace. No external API call.

| Field | Type | Description |
|---|---|---|
| `stackTrace` | `string` | The raw error or stack trace |
| `language` | `string?` | Optional language/framework hint |
| `rootCause` | `string` | What caused the error |
| `suggestedFix` | `string` | Step-by-step fix |
| `docsLink` | `string \| null` | Relevant docs URL |

**Example prompt:** *"Explain this error: TypeError: Cannot read properties of undefined (reading 'map')"*

---

### `search_docs`

Constructs a direct documentation search URL for the requested source.

| Source | Destination |
|---|---|
| `mdn` | `developer.mozilla.org/en-US/search?q=…` |
| `nextjs` | `nextjs.org/docs` |
| `react` | `react.dev/search?q=…` |
| `tailwind` | `tailwindcss.com/docs` |
| `nodejs` | `nodejs.org/en/search?q=…` |

**Example prompt:** *"Find the Next.js docs on server actions."*

---

## Supported Models

DevAssist routes all model requests through the Vercel AI Gateway. Available models:

| Provider | Model |
|---|---|
| Anthropic | Claude Haiku 4.5, Claude Sonnet 4.5, Claude Opus 4.5 |
| OpenAI | GPT-4.1 Mini, GPT-5.2 |
| Google | Gemini 2.5 Flash Preview, Gemini 1.5 Pro, Gemini 3 Pro |
| xAI | Grok 4.1 Fast, and others |

Switch models from the selector in the chat input toolbar.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| AI | [Vercel AI SDK](https://sdk.vercel.ai) + [AI Gateway](https://vercel.com/ai-gateway) |
| UI | [shadcn/ui](https://ui.shadcn.com) + [Tailwind CSS v4](https://tailwindcss.com) |
| Auth | [Auth.js v5](https://authjs.dev) (NextAuth) |
| Database | [Neon Postgres](https://neon.tech) + [Drizzle ORM](https://orm.drizzle.team) |
| Caching | [Redis](https://vercel.com/docs/redis) (optional, for resumable streams) |
| File storage | [Vercel Blob](https://vercel.com/docs/vercel-blob) |
| Syntax highlighting | [Shiki](https://shiki.style) (`github-dark` theme) |
| Code execution | [Piston API](https://github.com/engineer-man/piston) |

---

## Getting Started

### Prerequisites

- **Node.js** 20+ — [download](https://nodejs.org)
- **pnpm** 9+ — `npm install -g pnpm`
- **Postgres** database — [Neon free tier](https://neon.tech) is recommended
- **Vercel AI Gateway** account (or a direct model provider API key)

### Installation

```bash
git clone https://github.com/your-org/devassist.git
cd devassist
pnpm install
```

### Environment Variables

Copy the example file and fill in each value:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `AUTH_SECRET` | ✅ | Random secret for Auth.js session signing. Generate with `openssl rand -base64 32` |
| `POSTGRES_URL` | ✅ | Neon (or any Postgres) connection string, e.g. `postgresql://user:pass@host/db?sslmode=require` |
| `AI_GATEWAY_API_KEY` | ✅* | Vercel AI Gateway API key. Not needed on Vercel (OIDC tokens used automatically) |
| `BLOB_READ_WRITE_TOKEN` | ✅ | Vercel Blob token for file attachment uploads |
| `REDIS_URL` | ☑️ | Optional. Enables resumable AI streams after page navigation |

> **Tip:** Generate `AUTH_SECRET` quickly: `openssl rand -base64 32`

### Database Setup

DevAssist uses Drizzle ORM with Neon Postgres. Run migrations before starting the app:

```bash
# Apply all pending migrations to your database
pnpm db:migrate
```

Other database commands:

```bash
pnpm db:generate   # Generate new migration files after editing lib/db/schema.ts
pnpm db:studio     # Open Drizzle Studio — a visual browser for your database
pnpm db:push       # Push schema directly (skips migration files, dev only)
pnpm db:pull       # Introspect an existing database into schema.ts
```

The schema defines these tables:

| Table | Description |
|---|---|
| `User` | Registered accounts (email + hashed password) |
| `Chat` | Chat sessions with title and visibility |
| `Message_v2` | Individual messages with multi-part content (text, tool calls, attachments) |
| `Vote_v2` | Thumbs up/down votes on assistant messages |
| `Document` | Versioned artifacts (code, documents, sheets) |
| `Suggestion` | Inline AI suggestions on documents |
| `Stream` | Redis stream IDs for resumable responses |

### Local Dev Workflow

```bash
# Start the development server with Turbopack
pnpm dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

**Sign up:** Navigate to `/register` to create a local account. Auth.js stores a bcrypt-hashed password in Postgres — no OAuth provider is required for local dev.

**Useful commands:**

```bash
pnpm lint        # Run Biome linter + type check
pnpm format      # Auto-fix lint and formatting issues
pnpm test        # Run Playwright end-to-end tests
```

---

## Deployment

### Deploy to Vercel (recommended)

1. Push your repo to GitHub.
2. Import the project at [vercel.com/new](https://vercel.com/new).
3. Add the following environment variables in the Vercel dashboard:
   - `AUTH_SECRET`
   - `POSTGRES_URL` (create a Neon Postgres integration in the Vercel marketplace)
   - `BLOB_READ_WRITE_TOKEN` (create a Vercel Blob store)
   - `REDIS_URL` (optional — create a Vercel KV/Redis store)
4. Vercel injects `AI_GATEWAY_API_KEY` automatically via OIDC — no manual setup needed.
5. Click **Deploy**.

The `build` script (`tsx lib/db/migrate && next build`) runs migrations automatically before each deployment.

### Self-hosted

```bash
# Build
pnpm build

# Start production server
pnpm start
```

Ensure all environment variables are set in your hosting environment. You will need to set `AI_GATEWAY_API_KEY` explicitly since OIDC is Vercel-specific.

---

## Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository and create a feature branch:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Install** dependencies:
   ```bash
   pnpm install
   ```

3. **Make your changes.** Key directories:
   - `app/(chat)/api/chat/route.ts` — AI streaming endpoint
   - `lib/ai/tools/` — AI tool definitions (`run-code.ts`, `explain-error.ts`, `search-docs.ts`, …)
   - `lib/ai/prompts.ts` — System prompts
   - `lib/ai/models.ts` — Supported model list
   - `lib/db/schema.ts` — Database schema (run `pnpm db:generate` after changes)
   - `components/` — React UI components

4. **Lint and format** before committing:
   ```bash
   pnpm format
   pnpm lint
   ```

5. **Test** your changes:
   ```bash
   pnpm test
   ```

6. **Open a pull request** against `main` with a clear description of what changed and why.

### Adding a New AI Tool

1. Create `lib/ai/tools/your-tool.ts` and export a `tool()` using the Vercel AI SDK:
   ```ts
   import { tool } from "ai";
   import { z } from "zod";

   export const yourTool = tool({
     description: "What the tool does",
     parameters: z.object({ ... }),
     execute: async (params) => { ... },
   });
   ```

2. Import and register it in `app/(chat)/api/chat/route.ts`:
   - Add to the `tools` object
   - Add the tool name to `experimental_activeTools`

3. Update the system prompt in `lib/ai/prompts.ts` if needed so the model knows when to invoke it.

---

## License

MIT
