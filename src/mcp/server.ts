import { Elysia } from "elysia";
import { mcp } from "elysia-mcp";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Effect } from "effect";
import { providers, resolveProvider, parseUrl, isUrl } from "../providers";
import { checkAll, checkSingle } from "../lib/check";
import { setCacheEnabled } from "../lib/cache";

const DEFAULT_PORT = 3000;

interface McpServerOptions {
  port?: number;
}

export function createMcpServer(options: McpServerOptions = {}) {
  const port = options.port ?? DEFAULT_PORT;

  const app = new Elysia().use(
    mcp({
      basePath: "/mcp",
      serverInfo: {
        name: "namewastaken",
        version: "1.0.0",
      },
      capabilities: {
        tools: {},
      },
      setupServer: async (server: McpServer) => {
        // Tool: Check username on all platforms
        server.tool(
          "check_username",
          {
            description:
              "Check if a username is available on social media platforms (TikTok, Instagram, X/Twitter, Threads, YouTube)",
            inputSchema: {
              type: "object",
              properties: {
                username: {
                  type: "string",
                  description: "The username to check",
                },
                useCache: {
                  type: "boolean",
                  description: "Whether to use cached results (default: true)",
                },
              },
              required: ["username"],
            },
          },
          async ({ username, useCache = true }) => {
            if (!useCache) {
              setCacheEnabled(false);
            }

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

        // Tool: Check username on a specific platform
        server.tool(
          "check_platform",
          {
            description: "Check if a username is available on a specific platform",
            inputSchema: {
              type: "object",
              properties: {
                platform: {
                  type: "string",
                  description:
                    "Platform to check (tiktok, instagram, x, twitter, threads, youtube, or aliases like tt, ig, yt)",
                },
                username: {
                  type: "string",
                  description: "The username to check",
                },
                useCache: {
                  type: "boolean",
                  description: "Whether to use cached results (default: true)",
                },
              },
              required: ["platform", "username"],
            },
          },
          async ({ platform, username, useCache = true }) => {
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

            if (!useCache) {
              setCacheEnabled(false);
            }

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

        // Tool: Check from URL
        server.tool(
          "check_url",
          {
            description: "Check username availability by parsing a social media profile URL",
            inputSchema: {
              type: "object",
              properties: {
                url: {
                  type: "string",
                  description: "Profile URL (e.g., https://tiktok.com/@username)",
                },
                useCache: {
                  type: "boolean",
                  description: "Whether to use cached results (default: true)",
                },
              },
              required: ["url"],
            },
          },
          async ({ url, useCache = true }) => {
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

            if (!useCache) {
              setCacheEnabled(false);
            }

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

        // Tool: List available platforms
        server.tool(
          "list_platforms",
          {
            description: "List all supported social media platforms and their aliases",
            inputSchema: {
              type: "object",
              properties: {},
              required: [],
            },
          },
          async () => {
            const lines = providers.map((p) => {
              const aliases =
                p.aliases.length > 1 ? ` (aliases: ${p.aliases.slice(1).join(", ")})` : "";
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
      },
    }),
  );

  return { app, port };
}

export async function startMcpServer(options: McpServerOptions = {}) {
  const { app, port } = createMcpServer(options);

  app.listen(port);

  console.log(`MCP server running at http://localhost:${port}/mcp`);
  console.log(`Connect with MCP Inspector: npx @modelcontextprotocol/inspector`);

  return app;
}
