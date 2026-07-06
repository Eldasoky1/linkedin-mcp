import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getPage } from "../browser.js";
import { safeInteract } from "../utils/scraper.js";
import { Page } from "playwright";

async function typeInProseMirror(page: Page, text: string) {
  const editor = page
    .locator(
      "div.tiptap.ProseMirror, " +
        "div.ql-editor[contenteditable='true'], " +
        "[contenteditable='true'][role='textbox'], " +
        "[contenteditable='true'][aria-label*='post'], " +
        "[contenteditable='true'][aria-label*='Text editor'], " +
        "div[contenteditable='true']"
    )
    .first();
  const invisible = await editor.isVisible().catch(() => false);
  if (!invisible) {
    const inIframe = page
      .locator("iframe.ql-editor, iframe[title*='post'], iframe[title*='Rich Text']")
      .first();
    const iframeVisible = await inIframe.isVisible().catch(() => false);
    if (iframeVisible) {
      const frame = await inIframe.elementHandle();
      if (frame) {
        const iframePage = await frame.contentFrame();
        if (iframePage) {
          const innerEditor = iframePage
            .locator("[contenteditable='true']")
            .first();
          await innerEditor.click();
          await innerEditor.fill(text);
          return;
        }
      }
    }
  }
  await editor.scrollIntoViewIfNeeded();
  await editor.click();
  await page.keyboard.press("Control+a");
  await page.keyboard.press("Delete");
  await page.waitForTimeout(300);
  await page.keyboard.type(text, { delay: 5 });
}

export function registerFeedTools(server: McpServer) {
  server.tool(
    "get_feed",
    "Get posts from the user's home feed",
    { limit: z.number().optional().default(5) },
    async ({ limit }) => {
      const response = await safeInteract("get_feed", async () => {
        const page = await getPage();
        await page.goto("https://www.linkedin.com/feed/");
        await page.waitForLoadState("domcontentloaded");
        await page.waitForTimeout(3000);

        const posts = page.locator(
          "div.feed-shared-update-v2, " +
            "div[data-urn*='activity'], " +
            "[data-id*='urn:li:activity']"
        );
        const count = await posts.count();
        const items: { author: string; content: string }[] = [];

        for (let i = 0; i < Math.min(count, limit); i++) {
          const post = posts.nth(i);
          const author = await post
            .locator(
              "span.update-components-actor__name, " +
                "span[aria-hidden='true']"
            )
            .first()
            .textContent()
            .catch(() => null);
          const content = await post
            .locator(
              "div.update-components-text, " + "span.break-words"
            )
            .first()
            .textContent()
            .catch(() => null);

          items.push({
            author: author?.trim() ?? "Unknown",
            content: content?.trim() ?? "",
          });
        }
        return items;
      });

      return {
        content: [
          { type: "text" as const, text: JSON.stringify(response, null, 2) },
        ],
      };
    }
  );

  server.tool(
    "get_company_posts",
    "Get posts from a specific company page",
    {
      companyUrl: z.string().url(),
      limit: z.number().optional().default(5),
    },
    async ({ companyUrl, limit }) => {
      const response = await safeInteract(
        `get_company_posts ${companyUrl}`,
        async () => {
          const page = await getPage();
          await page.goto(`${companyUrl}/posts`);
          await page.waitForLoadState("domcontentloaded");
          await page.waitForTimeout(3000);

          const posts = page.locator(
            "div.feed-shared-update-v2, " + "div[data-urn*='activity']"
          );
          const count = await posts.count();
          const items: { content: string }[] = [];

          for (let i = 0; i < Math.min(count, limit); i++) {
            const post = posts.nth(i);
            const content = await post
              .locator(
                "div.update-components-text, " + "span.break-words"
              )
              .first()
              .textContent()
              .catch(() => null);

            items.push({ content: content?.trim() ?? "" });
          }
          return items;
        }
      );

      return {
        content: [
          { type: "text" as const, text: JSON.stringify(response, null, 2) },
        ],
      };
    }
  );

  server.tool(
    "create_post",
    "Create a new post on the user's LinkedIn feed. " +
      "Navigate to the feed, click 'Start a post', fill content, and publish. " +
      "Use dryRun=true to verify selectors without publishing.",
    {
      text: z
        .string()
        .max(3000)
        .describe("The content of the post (max 3000 characters)"),
      dryRun: z
        .boolean()
        .optional()
        .default(false)
        .describe("If true, fill the editor but skip clicking Post."),
    },
    async ({ text, dryRun }) => {
      const response = await safeInteract("create_post", async () => {
        const page = await getPage();
        await page.goto("https://www.linkedin.com/feed/");
        await page.waitForLoadState("domcontentloaded");
        await page.waitForTimeout(3000);

        const startPostBtn = page
          .locator(
            "[aria-label='Start a post'], " +
              "button:has-text('Start a post'), " +
              "[role='button']:has-text('Start a post')"
          )
          .first();
        await startPostBtn.scrollIntoViewIfNeeded();
        await startPostBtn.click({ timeout: 10000 });

        await page.waitForSelector("div[role='dialog'], div[role='document']", {
          timeout: 10000,
        });
        await page.waitForTimeout(1000);

        await typeInProseMirror(page, text);

        if (dryRun) {
          return {
            status: "DRY RUN: Editor filled, would have clicked Post.",
            dryRun: true,
            textPreview: text.substring(0, 100),
          };
        }

        const postBtn = page
          .locator(
            "button:has-text('Post'):not(:has-text('Repost')), " +
              "[role='button']:has-text('Post'):not(:has-text('Repost'))"
          )
          .last();
        await postBtn.click({ timeout: 10000 });

        await page.waitForTimeout(5000);

        const textSnippet = text.substring(0, 50);
        const verified = await page
          .locator(
            `[data-id*='urn:li:activity']:has-text('${textSnippet}')`
          )
          .first()
          .isVisible()
          .catch(() => false);

        return {
          status: verified
            ? "Post created and verified on feed."
            : "Post submitted, but could not verify on feed (may take longer to appear).",
          dryRun: false,
        };
      });

      return {
        content: [
          { type: "text" as const, text: JSON.stringify(response, null, 2) },
        ],
      };
    }
  );
}
