import { z } from "zod";
import { Effect } from "effect";
import { checkSingle } from "../../lib/check";
import { setCacheEnabled } from "../../lib/cache";
import { providers, resolveProvider } from "../../providers";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerCheckPlatform(server: McpServer) {
  (server.tool as Function)(
    "check_platform",
    "Check if a username is available on a specific platform",
    {
      platform: z
        .string()
        .describe(
          "Platform to check (tiktok, instagram, x, twitter, threads, youtube, or aliases like tt, ig, yt)",
        ),
      username: z.string().describe("The username to check"),
      useCache: z.boolean().optional().describe("Whether to use cached results (default: true)"),
    },
    async (args: { platform: string; username: string; useCache?: boolean }) => {
      const { platform, username, useCache = true } = args;
      const provider = resolveProvider(platform);
      if (!provider) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Unknown platform: ${platform}. Available platforms: ${providers.map((p) => p.name).join(", ")}`,
            },
          ],
          isError: true,
        };
      }

      if (!useCache) setCacheEnabled(false);

      try {
        const result = await Effect.runPromise(checkSingle(provider, username));

        const status = result.error
          ? `Error: ${result.error}`
          : result.taken
            ? "taken"
            : "available";

        return {
          content: [
            {
              type: "text" as const,
              text: `${provider.displayName}: Username "${username}" is ${status}\nProfile URL: ${provider.profileUrl(username)}`,
            },
          ],
        };
      } finally {
        setCacheEnabled(true);
      }
    },
  );
}
