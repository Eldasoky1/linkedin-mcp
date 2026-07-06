import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getPage } from "../browser.js";
import { safeInteract } from "../utils/scraper.js";

export function registerMessagingTools(server: McpServer) {
  server.tool(
    "get_inbox",
    "List recent LinkedIn messages",
    { limit: z.number().optional().default(5) },
    async ({ limit }) => {
      const response = await safeInteract("get_inbox", async () => {
        const page = await getPage();
        await page.goto("https://www.linkedin.com/messaging/");
        await page.waitForLoadState("networkidle");

        const threads = page.locator("li.msg-conversation-listitem");
        const count = await threads.count();
        const items = [];

        for (let i = 0; i < Math.min(count, limit); i++) {
          const item = threads.nth(i);
          const sender = await item.locator("h3.msg-conversation-listitem__participant-names").first().textContent().catch(() => null);
          const preview = await item.locator("p.msg-conversation-card__message-snippet-body").first().textContent().catch(() => null);
          // Thread ID is tricky, often in URL. We extract URL from href if possible.
          const urlStr = await item.locator("a.msg-conversation-listitem__link").first().getAttribute("href").catch(() => null);

          items.push({
            sender: sender?.trim() ?? "Unknown",
            preview: preview?.trim() ?? "",
            url: urlStr ? `https://www.linkedin.com${urlStr}` : null,
          });
        }
        return items;
      });

      return {
        content: [{ type: "text" as const, text: JSON.stringify(response, null, 2) }],
      };
    }
  );

  server.tool(
    "send_message",
    "Send a message via LinkedIn",
    {
      profileUrl: z.string().url(),
      message: z.string()
    },
    async ({ profileUrl, message }) => {
      const response = await safeInteract(`send_message ${profileUrl}`, async () => {
        const page = await getPage();
        await page.goto(profileUrl);
        await page.waitForLoadState("networkidle");

        await page.locator("button:has-text('Message')").first().click();
        await page.locator("div.msg-form__contenteditable").first().fill(message);
        await page.locator("button.msg-form__send-button").first().click();
        
        return { status: "Message sent via profile overlay." };
      });

      return {
        content: [{ type: "text" as const, text: JSON.stringify(response, null, 2) }],
      };
    }
  );
}
