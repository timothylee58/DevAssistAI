export const HF_INFERENCE_API_BASE = "https://api-inference.huggingface.co/models";
export const CHARACTER_LIMIT = 25_000;

export type CuratedModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
};

// Mirrors the curated list in lib/ai/models.ts of the DevAssist app.
// Kept as a local copy so this server has no dependency on the Next.js app.
export const CURATED_MODELS: CuratedModel[] = [
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

export const DEFAULT_MODEL_ID = "mistralai/Mistral-7B-Instruct-v0.1";
