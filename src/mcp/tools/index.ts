import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerCheckUsername } from "./check-username";
import { registerCheckPlatform } from "./check-platform";
import { registerCheckUrl } from "./check-url";
import { registerListPlatforms } from "./list-platforms";

export function registerAllTools(server: McpServer) {
  registerCheckUsername(server);
  registerCheckPlatform(server);
  registerCheckUrl(server);
  registerListPlatforms(server);
}
