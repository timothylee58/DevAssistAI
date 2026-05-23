import { tool } from "ai";
import { z } from "zod";

const DOC_URLS: Record<string, (q: string) => string> = {
  mdn: (q) =>
    `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(q)}`,
  nextjs: (_q) => `https://nextjs.org/docs`,
  react: (q) =>
    `https://react.dev/search?q=${encodeURIComponent(q)}`,
  tailwind: (q) =>
    `https://tailwindcss.com/docs/installation/framework-guides`,
  nodejs: (q) =>
    `https://nodejs.org/en/search?q=${encodeURIComponent(q)}`,
};

export const searchDocs = tool({
  description:
    "Look up documentation for a given query from a specific source (MDN, Next.js, React, Tailwind, Node.js). Returns a URL the user can visit.",
  parameters: z.object({
    query: z.string().describe("The documentation search query"),
    source: z
      .enum(["mdn", "nextjs", "react", "tailwind", "nodejs"])
      .describe("The documentation source to search"),
  }),
  execute: async ({ query, source }) => {
    const url = DOC_URLS[source](query);
    return { url, source, searchQuery: query };
  },
});
