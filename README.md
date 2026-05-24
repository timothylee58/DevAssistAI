<a href="https://nextjs-ai-chatbot-six-rose-hppnwwn81y.vercel.app">
  <img alt="Next.js 14 and App Router-ready AI chatbot." src="app/(chat)/opengraph-image.png">
  <h1 align="center">Chat SDK</h1>
</a>

<p align="center">
    Chat SDK is a free, open-source template built with Next.js and the AI SDK that helps you quickly build powerful chatbot applications.
</p>

<p align="center">
  <a href="[https://chat-sdk.dev](https://nextjs-ai-chatbot-six-rose-hppnwwn81y.vercel.app)"><strong>Read Docs</strong></a> ·
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#model-providers"><strong>Model Providers</strong></a> ·
  <a href="#deploy-your-own"><strong>Deploy Your Own</strong></a> ·
  <a href="#running-locally"><strong>Running locally</strong></a>
</p>
<br/>

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
# AI Gateway
AI_GATEWAY_API_KEY=your_vercel_ai_gateway_key

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
