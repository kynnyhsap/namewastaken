import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Effect } from "effect";
import { z } from "zod";

import { setCacheEnabled } from "../../lib/cache";
import { checkAll, checkBulk } from "../../lib/check";

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

export function registerCheckUsernamesBulk(server: McpServer) {
  server.tool(
    "check_usernames_in_bulk",
    "Check multiple usernames for availability on all social media platforms (TikTok, Instagram, X/Twitter, Threads, YouTube)",
    {
      usernames: z.array(z.string()).describe("Array of usernames to check"),
      useCache: z.boolean().optional().describe("Whether to use cached results (default: true)"),
    },
    async (args: { usernames: string[]; useCache?: boolean }) => {
      const { usernames, useCache = true } = args;
      if (!useCache) setCacheEnabled(false);

      try {
        const result = await Effect.runPromise(checkBulk(usernames));

        const lines: string[] = [];

        for (const userResult of result.results) {
          lines.push(`\n${userResult.username}:`);
          for (const r of userResult.results) {
            const status = r.error ? `error: ${r.error}` : r.taken ? "taken" : "available";
            lines.push(`  ${r.provider.displayName}: ${status}`);
          }
        }

        const totalAvailable = result.results.reduce(
          (acc, ur) => acc + ur.results.filter((r) => !r.taken && !r.error).length,
          0,
        );
        const totalTaken = result.results.reduce(
          (acc, ur) => acc + ur.results.filter((r) => r.taken).length,
          0,
        );

        return {
          content: [
            {
              type: "text" as const,
              text: `Bulk check for ${usernames.length} usernames:${lines.join("\n")}\n\nTotal: ${totalAvailable} available, ${totalTaken} taken`,
            },
          ],
        };
      } finally {
        setCacheEnabled(true);
      }
    },
  );
}
