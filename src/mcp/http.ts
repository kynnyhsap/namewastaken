import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

import { registerAllTools } from "./tools";

const DEFAULT_PORT = 3000;

interface HttpServerOptions {
  port?: number;
}

export async function startHttpServer(options: HttpServerOptions = {}) {
  const port = options.port ?? DEFAULT_PORT;

  const server = new McpServer({
    name: "namewastaken",
    version: "1.0.0",
  });

  registerAllTools(server);

  // Stateless mode - each request is independent
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
  });

  await server.connect(transport);

  Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url);

      // Only handle /mcp endpoint
      if (url.pathname !== "/mcp") {
        return new Response("Not Found", { status: 404 });
      }

      return transport.handleRequest(req);
    },
  });

  console.log(`MCP server running at http://localhost:${port}/mcp`);
  console.log(`Transport: Streamable HTTP`);
  console.log(`\nConnect with MCP Inspector:`);
  console.log(`  npx @modelcontextprotocol/inspector`);
  console.log(`  URL: http://localhost:${port}/mcp`);
  console.log(`  Transport: Streamable HTTP`);
}
