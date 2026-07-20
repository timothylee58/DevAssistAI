# huggingface-inference-mcp-server

An MCP server for testing DevAssist's Hugging Face Inference API integration outside of the Next.js app. It exposes two tools:

- **`huggingface_list_models`** — returns the curated open source chat models configured in DevAssist (`lib/ai/models.ts`): Llama 2 (7B/13B), Mistral 7B Instruct (v0.1/v0.2), Nous Hermes 2 Mixtral, OpenChat 3.5, Zephyr 7B. Makes no network calls.
- **`huggingface_chat`** — sends a chat transcript to a model via the free [Hugging Face Inference API](https://huggingface.co/docs/api-inference) and returns the generated completion. Applies best-effort prompt templating per model family (Llama 2's `[INST]`/`<<SYS>>` format, Mistral's `[INST]` format, and a generic ChatML-style fallback for the rest), or pass `raw_prompt: true` to bypass it.

This is a standalone package independent of a Hugging Face **Hub** MCP connector (for browsing models/datasets/papers) — this server only calls the Inference API to actually run a model.

## Setup

```bash
cd mcp-servers/huggingface-inference-mcp-server
npm install
npm run build
```

Get a token at https://huggingface.co/settings/tokens (needs Inference API permissions), then export it:

```bash
export HUGGING_FACE_API_KEY=hf_xxxxx
```

## Running standalone

```bash
npm start
```

Runs over stdio.

## Testing with MCP Inspector

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

Or headless, via the CLI:

```bash
npx @modelcontextprotocol/inspector --cli node dist/index.js --method tools/list

npx @modelcontextprotocol/inspector --cli node dist/index.js \
  --method tools/call --tool-name huggingface_chat \
  --tool-arg 'messages=[{"role":"user","content":"Say hi in one sentence."}]'
```

## Registering with Claude Code

```bash
claude mcp add huggingface-inference -- node "$(pwd)/dist/index.js"
```

Then set `HUGGING_FACE_API_KEY` in your shell profile or the MCP server's env config so it's available when Claude Code launches it.

## Notes

- Free-tier Inference API calls can 503 with a cold-start delay the first time a model is called (`estimated_time` is surfaced in the error message) — retry after a few seconds.
- `max_new_tokens`, `temperature`, and `top_p` map directly to the Inference API's generation parameters.
