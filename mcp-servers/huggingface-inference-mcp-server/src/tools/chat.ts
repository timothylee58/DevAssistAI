import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { CHARACTER_LIMIT, CURATED_MODELS, DEFAULT_MODEL_ID } from "../constants.js";
import { formatPrompt, generateText, HuggingFaceInferenceError } from "../services/huggingface.js";

const CURATED_MODEL_IDS = CURATED_MODELS.map((m) => m.id) as [string, ...string[]];

const ChatMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]).describe("Who this turn of the conversation belongs to"),
  content: z.string().min(1).describe("The text content of this turn"),
});

const ChatInputSchema = z
  .object({
    messages: z
      .array(ChatMessageSchema)
      .min(1, "At least one message is required")
      .describe("Chat transcript to send to the model, e.g. [{role: 'user', content: 'Explain closures in JS'}]"),
    model: z
      .union([z.enum(CURATED_MODEL_IDS), z.string().min(1)])
      .default(DEFAULT_MODEL_ID)
      .describe(
        `Hugging Face model ID to call. One of the curated IDs from huggingface_list_models (default: ${DEFAULT_MODEL_ID}), or any other model ID served by the free Inference API.`
      ),
    max_new_tokens: z
      .number()
      .int()
      .min(1)
      .max(2048)
      .default(512)
      .describe("Maximum number of tokens to generate (default: 512)"),
    temperature: z
      .number()
      .min(0)
      .max(2)
      .default(0.7)
      .describe("Sampling temperature; higher is more random (default: 0.7)"),
    top_p: z
      .number()
      .min(0)
      .max(1)
      .default(0.95)
      .describe("Nucleus sampling probability mass (default: 0.95)"),
    raw_prompt: z
      .boolean()
      .default(false)
      .describe(
        "If true, skip model-family prompt templating and send the concatenated message content as-is (advanced use)"
      ),
  })
  .strict();

type ChatInput = z.infer<typeof ChatInputSchema>;

export function registerChatTool(server: McpServer): void {
  server.registerTool(
    "huggingface_chat",
    {
      title: "Chat with a Hugging Face Model",
      description: `Send a chat transcript to an open source model on the Hugging Face free Inference API and return the generated reply. Use this to verify DevAssist's HUGGING_FACE_API_KEY works end-to-end and to sanity-check model output before wiring it into the app.

Args:
  - messages (array): Chat turns, e.g. [{role: "user", content: "..."}]. A leading system message is supported.
  - model (string): Model ID to call (default: ${DEFAULT_MODEL_ID}). Call huggingface_list_models for known-good options.
  - max_new_tokens (number): Max tokens to generate, 1-2048 (default: 512)
  - temperature (number): 0-2 (default: 0.7)
  - top_p (number): 0-1 (default: 0.95)
  - raw_prompt (boolean): Skip model-family templating (default: false)

Returns:
  The generated text completion as a string.

Error Handling:
  - Returns "Error: Authentication failed..." if HUGGING_FACE_API_KEY is missing or invalid
  - Returns "Error: Model is loading..." (HTTP 503) if the model needs a cold-start warm-up — retry after the estimated wait
  - Returns "Error: Rate limit exceeded..." (HTTP 429) on the free tier's rate limit
  - Returns "Error: Model '<id>' was not found..." (HTTP 404) for invalid or unserved model IDs`,
      inputSchema: ChatInputSchema.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params: ChatInput) => {
      const apiKey = process.env.HUGGING_FACE_API_KEY;
      if (!apiKey) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Error: HUGGING_FACE_API_KEY is not set. Get a token at https://huggingface.co/settings/tokens and set it in this MCP server's environment.",
            },
          ],
          isError: true,
        };
      }

      const prompt = params.raw_prompt
        ? params.messages.map((m) => m.content).join("\n")
        : formatPrompt(params.model, params.messages);

      try {
        const generated = await generateText(apiKey, {
          model: params.model,
          prompt,
          maxNewTokens: params.max_new_tokens,
          temperature: params.temperature,
          topP: params.top_p,
        });

        const truncated = generated.length > CHARACTER_LIMIT;
        const text = truncated ? `${generated.slice(0, CHARACTER_LIMIT)}\n\n[truncated]` : generated;

        const output = {
          model: params.model,
          response: text,
          truncated,
        };

        return {
          content: [{ type: "text" as const, text }],
          structuredContent: output,
        };
      } catch (error) {
        const message =
          error instanceof HuggingFaceInferenceError
            ? `Error: ${error.message}`
            : `Error: Unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`;
        return {
          content: [{ type: "text" as const, text: message }],
          isError: true,
        };
      }
    }
  );
}
