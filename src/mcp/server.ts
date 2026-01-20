import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Elysia } from "elysia";
import { mcp } from "elysia-mcp";

import { registerAllTools } from "./tools";

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
        registerAllTools(server);
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
