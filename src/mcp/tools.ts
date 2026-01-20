import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Effect } from "effect";
import { z } from "zod";

import { checkAll, checkBulk } from "../lib/check";

export function registerTools(server: McpServer) {
  // Single username check - aligns with SDK's `check(username)`
  server.registerTool(
    "check",
    {
      description:
        "Check if a username is available on social media platforms (TikTok, Instagram, X/Twitter, Threads, YouTube, Facebook, Telegram)",
      inputSchema: {
        username: z.string().describe("The username to check"),
      },
    },
    async ({ username }) => {
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
            text: `Username "${username}":\n\n${lines.join("\n")}\n\nSummary: ${available} available, ${taken} taken`,
          },
        ],
      };
    },
  );

  // Bulk username check - aligns with SDK's `checkMany(usernames)`
  server.registerTool(
    "check_many",
    {
      description:
        "Check multiple usernames for availability on social media platforms (TikTok, Instagram, X/Twitter, Threads, YouTube, Facebook, Telegram)",
      inputSchema: {
        usernames: z.array(z.string()).describe("Array of usernames to check"),
      },
    },
    async ({ usernames }) => {
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
            text: `Checked ${usernames.length} usernames:${lines.join("\n")}\n\nTotal: ${totalAvailable} available, ${totalTaken} taken`,
          },
        ],
      };
    },
  );
}
