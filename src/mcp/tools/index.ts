import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerCheckUsername, registerCheckUsernamesBulk } from "./check-username";

export function registerAllTools(server: McpServer) {
  registerCheckUsername(server);
  registerCheckUsernamesBulk(server);
}
