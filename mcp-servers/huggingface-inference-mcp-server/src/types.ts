export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface HfTextGenerationResponseItem {
  generated_text: string;
}

export interface HfInferenceErrorBody {
  error?: string;
  estimated_time?: number;
}
