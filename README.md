# DevAssist

**AI Pair Programmer for developers**

DevAssist is a purpose-built developer tool powered by the Vercel AI SDK. It helps you debug code, explain errors, write and review code, and find documentation — all in a chat interface designed for developers.

## Features

- **Code Execution** — Run Python, JavaScript, TypeScript, and Bash directly in chat via the Piston API sandbox
- **Error Explanation** — Paste a stack trace and get a structured root cause analysis with a suggested fix
- **Documentation Lookup** — Search MDN, Next.js, React, Tailwind CSS, and Node.js docs without leaving the chat
- **Syntax Highlighting** — Code blocks rendered with Shiki using the `github-dark` theme
- **Persistent History** — Chats are saved to Neon Postgres via Drizzle ORM
- **Auth** — Secure sign-in with Auth.js

## Tech Stack

- [Next.js](https://nextjs.org) (App Router)
- [Vercel AI SDK](https://sdk.vercel.ai)
- [shadcn/ui](https://ui.shadcn.com) + [Tailwind CSS](https://tailwindcss.com)
- [Auth.js](https://authjs.dev)
- [Neon Postgres](https://neon.tech) + [Drizzle ORM](https://orm.drizzle.team)
- [Shiki](https://shiki.style) for syntax highlighting
- [Piston API](https://github.com/engineer-man/piston) for sandboxed code execution

## Getting Started

```bash
pnpm install
pnpm dev
```

Copy `.env.example` to `.env.local` and fill in the required environment variables before running.

## Environment Variables

| Variable | Description |
|---|---|
| `AUTH_SECRET` | Auth.js secret |
| `POSTGRES_URL` | Neon Postgres connection string |
| `AI_GATEWAY_URL` | Vercel AI Gateway URL |

## License

MIT
