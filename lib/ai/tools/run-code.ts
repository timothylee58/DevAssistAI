import { tool } from "ai";
import { z } from "zod";

export const runCode = tool({
  description:
    "Execute code in a sandboxed environment and return the output. Supports Python, JavaScript, TypeScript, and Bash.",
  parameters: z.object({
    language: z.enum(["python", "javascript", "typescript", "bash"]),
    code: z.string().describe("The source code to execute"),
  }),
  execute: async ({ language, code }) => {
    const response = await fetch("https://emkc.org/api/v2/piston/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language,
        version: "*",
        files: [{ content: code }],
      }),
    });

    if (!response.ok) {
      return {
        output: "",
        error: `Piston API error: ${response.status} ${response.statusText}`,
        exitCode: 1,
      };
    }

    const data = await response.json();
    const run = data.run ?? {};

    return {
      output: run.stdout ?? "",
      error: run.stderr ?? "",
      exitCode: run.code ?? 0,
    };
  },
});
