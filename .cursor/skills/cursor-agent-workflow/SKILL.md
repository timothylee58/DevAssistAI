---
name: cursor-agent-workflow
description: Standard workflow for Cursor Agent in this repo (Next.js AI chatbot). Use when implementing features, fixing bugs, or preparing changes for review.
---

# Cursor Agent workflow (this repository)

Follow this procedure whenever you change code in this workspace so results stay consistent with team expectations and CI.

## Repository facts

- **Stack**: Next.js (App Router), React 19, AI SDK, Drizzle ORM, Auth.js, Tailwind CSS 4, shadcn-style components.
- **Package manager**: `pnpm` (see `packageManager` in `package.json`).
- **Lint / format**: Ultracite (Biome) via `pnpm lint` and `pnpm format`.
- **Database**: Drizzle; migrations via `pnpm db:migrate` (also runs in `pnpm build`).
- **E2E tests**: Playwright via `pnpm test` (requires `PLAYWRIGHT=True` as set in the script).

## Before you edit

1. Read nearby code and match existing patterns (imports, naming, error handling, Server vs Client Components).
2. Prefer small, focused diffs; avoid unrelated refactors.
3. Check `.env.example` for required environment variables; never commit secrets.

## While you implement

1. Keep accessibility and type-safety constraints from project rules (Ultracite / Biome) in mind.
2. After substantive edits, run `pnpm lint` and fix reported issues (use `pnpm format` when appropriate).
3. If you touch the database schema or migrations, run `pnpm db:migrate` locally when applicable and ensure `pnpm build` still succeeds.

## Before you finish

1. Run `pnpm lint` (and `pnpm test` if you changed user-visible flows or routing).
2. Stage with `git add`, commit with a clear message, and push the working branch.
3. If this session is for a cloud agent task, update or create the pull request for the branch as required by the project workflow.

## What not to do

- Do not add `console` logging to satisfy debugging rules; use project-appropriate patterns.
- Do not commit `.env` or real API keys.
- Do not bypass lint rules with ignore comments unless the repo already uses that pattern for the same class of issue.
