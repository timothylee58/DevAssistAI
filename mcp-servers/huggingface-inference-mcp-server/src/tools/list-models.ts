import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { CURATED_MODELS, DEFAULT_MODEL_ID } from "../constants.js";

const ListModelsInputSchema = z
  .object({
    response_format: z
      .enum(["markdown", "json"])
      .default("markdown")
      .describe("Output format: 'markdown' for human-readable or 'json' for machine-readable"),
  })
  .strict();

type ListModelsInput = z.infer<typeof ListModelsInputSchema>;

export function registerListModelsTool(server: McpServer): void {
  server.registerTool(
    "huggingface_list_models",
    {
      title: "List DevAssist Hugging Face Models",
      description: `List the curated open source chat models configured for DevAssist's Hugging Face Inference integration (lib/ai/models.ts). Use this before calling huggingface_chat to confirm a valid model ID.

Args:
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  The list of curated models with id, display name, provider family, and description, plus the default model ID used when none is specified.

This tool makes no network calls — it returns a static local list, so it is safe to call at any time.`,
      inputSchema: ListModelsInputSchema.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (params: ListModelsInput) => {
      const output = {
        default_model: DEFAULT_MODEL_ID,
        count: CURATED_MODELS.length,
        models: CURATED_MODELS,
      };

      if (params.response_format === "json") {
        return {
          content: [{ type: "text" as const, text: JSON.stringify(output, null, 2) }],
          structuredContent: output,
        };
      }

      const lines = [
        "# DevAssist Hugging Face Models",
        "",
        `Default model: \`${DEFAULT_MODEL_ID}\``,
        "",
      ];
      for (const model of CURATED_MODELS) {
        lines.push(`## ${model.name} (\`${model.id}\`)`);
        lines.push(`- **Provider**: ${model.provider}`);
        lines.push(`- **Description**: ${model.description}`);
        lines.push("");
      }

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
        structuredContent: output,
      };
    }
  );
}
