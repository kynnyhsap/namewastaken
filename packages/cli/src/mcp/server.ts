import { StreamableHTTPTransport } from "@hono/mcp";
import { serve } from "@hono/node-server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Hono } from "hono";

import { registerTools } from "./tools";

interface McpServerOptions {
  port?: number;
}

function createMcpServer() {
  const server = new McpServer({
    name: "namewastaken",
    version: "1.0.0",
  });

  registerTools(server);

  return server;
}

export function createApp() {
  const app = new Hono();
  const mcpServer = createMcpServer();

  app.all("/mcp", async (c) => {
    const transport = new StreamableHTTPTransport();
    await mcpServer.connect(transport);
    return transport.handleRequest(c);
  });

  return app;
}

export async function startMcpServer(options: McpServerOptions = {}) {
  const app = createApp();

  // Use port 0 to let OS pick a free port, or use specified port
  const server = serve({ fetch: app.fetch, port: options.port ?? 0 }, (info) => {
    const url = `http://localhost:${info.port}/mcp`;
    console.log(`MCP server running at ${url}`);
    console.log(`\nConnect with MCP Inspector:`);
    console.log(`  npx @modelcontextprotocol/inspector`);
    console.log(`  URL: ${url}`);
    console.log(`  Transport: Streamable HTTP`);
  });

  return server;
}
