import { tool } from "ai";
import { z } from "zod";

export const explainError = tool({
  description:
    "Analyze a stack trace or error message and return a structured explanation with root cause, suggested fix, and relevant docs link.",
  parameters: z.object({
    stackTrace: z.string().describe("The full error message or stack trace"),
    language: z
      .string()
      .optional()
      .describe("The programming language or framework context"),
    rootCause: z.string().describe("The root cause of the error"),
    suggestedFix: z
      .string()
      .describe("A concrete step-by-step fix for the error"),
    docsLink: z
      .string()
      .nullable()
      .describe("A relevant documentation URL, or null if not applicable"),
  }),
  execute: async ({ rootCause, suggestedFix, docsLink }) => {
    return { rootCause, suggestedFix, docsLink };
  },
});
