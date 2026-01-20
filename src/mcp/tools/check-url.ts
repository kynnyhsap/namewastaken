import { z } from "zod";
import { Effect } from "effect";
import { checkSingle } from "../../lib/check";
import { setCacheEnabled } from "../../lib/cache";
import { providers, parseUrl, isUrl } from "../../providers";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerCheckUrl(server: McpServer) {
  server.tool(
    "check_url",
    "Check username availability by parsing a social media profile URL",
    {
      url: z.string().describe("Profile URL (e.g., https://tiktok.com/@username)"),
      useCache: z.boolean().optional().describe("Whether to use cached results (default: true)"),
    },
    async (args: { url: string; useCache?: boolean }) => {
      const { url, useCache = true } = args;

      if (!isUrl(url)) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Invalid URL: ${url}. Please provide a valid URL starting with http:// or https://`,
            },
          ],
          isError: true,
        };
      }

      const parsed = parseUrl(url);
      if (!parsed) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Unsupported URL format. Supported platforms: ${providers.map((p) => p.displayName).join(", ")}`,
            },
          ],
          isError: true,
        };
      }

      if (!useCache) setCacheEnabled(false);

      try {
        const result = await Effect.runPromise(checkSingle(parsed.provider, parsed.username));

        const status = result.error
          ? `Error: ${result.error}`
          : result.taken
            ? "taken"
            : "available";

        return {
          content: [
            {
              type: "text" as const,
              text: `${parsed.provider.displayName}: Username "${parsed.username}" is ${status}\nProfile URL: ${parsed.provider.profileUrl(parsed.username)}`,
            },
          ],
        };
      } finally {
        setCacheEnabled(true);
      }
    },
  );
}
