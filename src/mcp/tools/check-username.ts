import { z } from "zod";
import { Effect } from "effect";
import { checkAll } from "../../lib/check";
import { setCacheEnabled } from "../../lib/cache";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerCheckUsername(server: McpServer) {
  server.tool(
    "check_username",
    "Check if a username is available on social media platforms (TikTok, Instagram, X/Twitter, Threads, YouTube)",
    {
      username: z.string().describe("The username to check"),
      useCache: z.boolean().optional().describe("Whether to use cached results (default: true)"),
    },
    async (args: { username: string; useCache?: boolean }) => {
      const { username, useCache = true } = args;
      if (!useCache) setCacheEnabled(false);

      try {
        const result = await Effect.runPromise(checkAll(username));

        const lines = result.results.map((r) => {
          const status = r.error ? `error: ${r.error}` : r.taken ? "taken" : "available";
          return `${r.provider.displayName}: ${status}`;
        });

        const available = result.results.filter((r) => !r.taken && !r.error).length;
        const taken = result.results.filter((r) => r.taken).length;

        return {
          content: [
            {
              type: "text" as const,
              text: `Username "${username}" check results:\n\n${lines.join("\n")}\n\nSummary: ${available} available, ${taken} taken`,
            },
          ],
        };
      } finally {
        setCacheEnabled(true);
      }
    },
  );
}
