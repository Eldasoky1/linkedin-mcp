import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerProfileTools } from "./tools/profile.js";
import { registerProfileEditTools } from "./tools/profile_edit.js";
import { registerConnectionTools } from "./tools/connections.js";
import { registerMessagingTools } from "./tools/messaging.js";
import { registerFeedTools } from "./tools/feed.js";
import { registerJobTools } from "./tools/jobs.js";
import { initBrowser } from "./browser.js";

export {
  initBrowser,
  getPage,
  getContext,
  recoverSession,
} from "./browser.js";

export {
  registerProfileTools,
  registerProfileEditTools,
  registerConnectionTools,
  registerMessagingTools,
  registerFeedTools,
  registerJobTools,
};

export { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
export { z } from "zod";
export { safeInteract } from "./utils/scraper.js";
export type { ToolResult } from "./utils/types.js";
export { failure } from "./utils/types.js";

async function main() {
  const server = new McpServer({
    name: "linkedin-mcp",
    version: "1.0.0",
  });

  try {
    await initBrowser();
  } catch (error) {
    console.error("Failed to initialize browser session:", error);
    process.exit(1);
  }

  registerProfileTools(server);
  registerProfileEditTools(server);
  registerConnectionTools(server);
  registerMessagingTools(server);
  registerFeedTools(server);
  registerJobTools(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("LinkedIn MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal server error:", error);
  process.exit(1);
});
