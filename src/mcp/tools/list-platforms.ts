import { providers } from "../../providers";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerListPlatforms(server: McpServer) {
  (server.tool as Function)(
    "list_platforms",
    "List all supported social media platforms and their aliases",
    {},
    async () => {
      const lines = providers.map((p) => {
        const aliases = p.aliases.length > 1 ? ` (aliases: ${p.aliases.slice(1).join(", ")})` : "";
        return `- ${p.displayName} (${p.name})${aliases}`;
      });

      return {
        content: [
          {
            type: "text" as const,
            text: `Supported platforms:\n\n${lines.join("\n")}`,
          },
        ],
      };
    },
  );
}
