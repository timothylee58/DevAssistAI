import { HF_INFERENCE_API_BASE } from "../constants.js";
import type {
  ChatMessage,
  HfInferenceErrorBody,
  HfTextGenerationResponseItem,
} from "../types.js";

/**
 * Formats a chat transcript into the instruction format each model family
 * expects. This is best-effort — pass a pre-formatted `prompt` directly to
 * the tool to bypass templating entirely.
 */
export function formatPrompt(modelId: string, messages: ChatMessage[]): string {
  const systemMessages = messages.filter((m) => m.role === "system");
  const turns = messages.filter((m) => m.role !== "system");
  const systemText = systemMessages.map((m) => m.content).join("\n").trim();

  if (modelId.includes("Llama-2")) {
    const sysBlock = systemText ? `<<SYS>>\n${systemText}\n<</SYS>>\n\n` : "";
    let prompt = "";
    turns.forEach((message, index) => {
      if (message.role === "user") {
        const prefix = index === 0 ? sysBlock : "";
        prompt += `<s>[INST] ${prefix}${message.content} [/INST]`;
      } else {
        prompt += ` ${message.content} </s>`;
      }
    });
    return prompt;
  }

  if (modelId.includes("Mistral") || modelId.includes("Mixtral")) {
    let prompt = "<s>";
    turns.forEach((message) => {
      if (message.role === "user") {
        prompt += `[INST] ${message.content} [/INST]`;
      } else {
        prompt += `${message.content}</s>`;
      }
    });
    return prompt;
  }

  // Generic ChatML-style fallback (covers Zephyr, OpenChat, and others).
  const lines: string[] = [];
  if (systemText) {
    lines.push(`<|system|>\n${systemText}`);
  }
  for (const message of turns) {
    lines.push(`<|${message.role}|>\n${message.content}`);
  }
  lines.push("<|assistant|>");
  return lines.join("\n");
}

export class HuggingFaceInferenceError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly estimatedTime?: number
  ) {
    super(message);
    this.name = "HuggingFaceInferenceError";
  }
}

export interface GenerateOptions {
  model: string;
  prompt: string;
  maxNewTokens: number;
  temperature: number;
  topP: number;
}

export async function generateText(
  apiKey: string,
  options: GenerateOptions
): Promise<string> {
  const { model, prompt, maxNewTokens, temperature, topP } = options;

  let response: Response;
  try {
    response = await fetch(`${HF_INFERENCE_API_BASE}/${model}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: maxNewTokens,
          temperature,
          top_p: topP,
          return_full_text: false,
        },
        options: {
          wait_for_model: true,
        },
      }),
      signal: AbortSignal.timeout(60_000),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new HuggingFaceInferenceError(
        "Request timed out after 60s. The model may be cold-starting — try again in a few seconds."
      );
    }
    throw new HuggingFaceInferenceError(
      `Network error contacting Hugging Face: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  if (!response.ok) {
    let body: HfInferenceErrorBody = {};
    try {
      body = (await response.json()) as HfInferenceErrorBody;
    } catch {
      // response body wasn't JSON; fall through with empty body
    }

    if (response.status === 401 || response.status === 403) {
      throw new HuggingFaceInferenceError(
        "Authentication failed. Check that HUGGING_FACE_API_KEY is set to a valid token with Inference API permissions.",
        response.status
      );
    }
    if (response.status === 404) {
      throw new HuggingFaceInferenceError(
        `Model '${model}' was not found, or is not served by the free Inference API. Try huggingface_list_models for known-good IDs.`,
        response.status
      );
    }
    if (response.status === 429) {
      throw new HuggingFaceInferenceError(
        "Rate limit exceeded on the free Inference API tier. Wait a moment before retrying.",
        response.status
      );
    }
    if (response.status === 503) {
      throw new HuggingFaceInferenceError(
        `Model is loading${body.estimated_time ? ` (~${Math.ceil(body.estimated_time)}s)` : ""}. Retry shortly.`,
        response.status,
        body.estimated_time
      );
    }
    throw new HuggingFaceInferenceError(
      `Hugging Face Inference API request failed with status ${response.status}: ${body.error ?? "unknown error"}`,
      response.status
    );
  }

  const data = (await response.json()) as
    | HfTextGenerationResponseItem[]
    | HfTextGenerationResponseItem;

  const item = Array.isArray(data) ? data[0] : data;
  if (!item?.generated_text) {
    throw new HuggingFaceInferenceError(
      "Hugging Face returned an empty response. The model may not support text-generation via this endpoint."
    );
  }

  return item.generated_text.trim();
}
