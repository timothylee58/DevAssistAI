/**
 * @file models.ts
 * @description Available AI model definitions for the chat interface. Exports the
 * default chat model ID, the ChatModel type, and a curated list of open source
 * models from Hugging Face. Also provides a modelsByProvider grouping for rendering
 * model selection in the UI.
 */

// Curated list of open source models from Hugging Face
export const DEFAULT_CHAT_MODEL = "mistralai/Mistral-7B-Instruct-v0.1";

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  // Meta Llama
  {
    id: "meta-llama/Llama-2-7b-chat-hf",
    name: "Llama 2 7B Chat",
    provider: "meta",
    description: "Open source LLM by Meta, great for chat and instruction following",
  },
  {
    id: "meta-llama/Llama-2-13b-chat-hf",
    name: "Llama 2 13B Chat",
    provider: "meta",
    description: "Larger Llama 2 variant with better reasoning",
  },
  // Mistral
  {
    id: "mistralai/Mistral-7B-Instruct-v0.1",
    name: "Mistral 7B Instruct",
    provider: "mistral",
    description: "Fast and efficient open source model, best balance of speed and quality",
  },
  {
    id: "mistralai/Mistral-7B-Instruct-v0.2",
    name: "Mistral 7B Instruct v0.2",
    provider: "mistral",
    description: "Improved version with better instruction following",
  },
  // Other open source models
  {
    id: "NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO",
    name: "Nous Hermes 2 Mixtral",
    provider: "open-source",
    description: "High-quality open source model with strong reasoning",
  },
  {
    id: "openchat/openchat-3.5",
    name: "OpenChat 3.5",
    provider: "open-source",
    description: "Optimized for conversation and instruction following",
  },
  {
    id: "HuggingFaceH4/zephyr-7b-beta",
    name: "Zephyr 7B",
    provider: "open-source",
    description: "Aligned for helpfulness and harmlessness",
  },
];

// Group models by provider for UI
export const modelsByProvider = chatModels.reduce(
  (acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  },
  {} as Record<string, ChatModel[]>
);
