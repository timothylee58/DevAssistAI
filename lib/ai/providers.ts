/**
 * @file providers.ts
 * @description AI provider configuration and model resolution. Sets up the Vercel AI
 * Gateway as the primary LLM provider and provides helper functions to resolve model
 * instances: getLanguageModel (resolves a model ID, applying reasoning middleware for
 * thinking models), getTitleModel (returns the model used for chat title generation),
 * and getArtifactModel (returns the model used for artifact/document operations).
 * In test environments, all models are swapped with mock implementations.
 */

import { gateway } from "@ai-sdk/gateway";
import { google } from "@ai-sdk/google";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

const THINKING_SUFFIX_REGEX = /-thinking$/;

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        artifactModel,
        chatModel,
        reasoningModel,
        titleModel,
      } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "chat-model-reasoning": reasoningModel,
          "title-model": titleModel,
          "artifact-model": artifactModel,
        },
      });
    })()
  : null;

export function getLanguageModel(modelId: string) {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel(modelId);
  }

  const isReasoningModel =
    modelId.includes("reasoning") || modelId.endsWith("-thinking");

  const baseModelId = isReasoningModel
    ? modelId.replace(THINKING_SUFFIX_REGEX, "")
    : modelId;

  const provider = baseModelId.startsWith("google/") ? google : gateway;

  const model = provider.languageModel(baseModelId);

  if (isReasoningModel) {
    return wrapLanguageModel({
      model,
      middleware: extractReasoningMiddleware({ tagName: "thinking" }),
    });
  }

  return model;
}

export function getTitleModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("title-model");
  }
  return gateway.languageModel("anthropic/claude-haiku-4.5");
}

export function getArtifactModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("artifact-model");
  }
  return gateway.languageModel("anthropic/claude-haiku-4.5");
}
