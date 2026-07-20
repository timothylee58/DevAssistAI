#!/usr/bin/env node
/**
 * MCP server for testing DevAssist's Hugging Face Inference API integration.
 *
 * Exposes two tools:
 *  - huggingface_list_models: static list of the curated models in lib/ai/models.ts
 *  - huggingface_chat: send a chat transcript to a model and get the completion back
 *
 * This complements (rather than replaces) a Hugging Face Hub browsing MCP connector —
 * this server only talks to the Inference API for text generation.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerChatTool } from "./tools/chat.js";
import { registerListModelsTool } from "./tools/list-models.js";

const server = new McpServer({
  name: "huggingface-inference-mcp-server",
  version: "1.0.0",
});

registerListModelsTool(server);
registerChatTool(server);

async function main(): Promise<void> {
  if (!process.env.HUGGING_FACE_API_KEY) {
    console.error(
      "WARNING: HUGGING_FACE_API_KEY is not set. huggingface_chat will return an authentication error until it is configured."
    );
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("huggingface-inference-mcp-server running via stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
