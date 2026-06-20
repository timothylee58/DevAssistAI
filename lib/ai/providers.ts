/**
 * @file providers.ts
 * @description AI provider configuration and model resolution. Sets up the Hugging Face
 * Inference API as the primary LLM provider and provides helper functions to resolve model
 * instances: getLanguageModel (resolves a model ID), getTitleModel (returns the model used
 * for chat title generation), and getArtifactModel (returns the model used for artifact/
 * document operations). In test environments, all models are swapped with mock implementations.
 */

import { huggingface } from "@ai-sdk/huggingface";
import {
  customProvider,
} from "ai";
import { isTestEnvironment } from "../constants";

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        artifactModel,
        chatModel,
        titleModel,
      } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
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

  return huggingface.languageModel(modelId);
}

export function getTitleModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("title-model");
  }
  return huggingface.languageModel("mistralai/Mistral-7B-Instruct-v0.1");
}

export function getArtifactModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("artifact-model");
  }
  return huggingface.languageModel("mistralai/Mistral-7B-Instruct-v0.1");
}
