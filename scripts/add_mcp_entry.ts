import { initBrowser, getPage } from "../src/browser.js";

async function main() {
  console.log("Adding LinkedIn MCP Server experience entry...");
  await initBrowser();
  const page = getPage();
  console.log(`Logged in. URL: ${page.url()}`);

  await page.goto(
    "https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/edit/forms/position/new/",
    { waitUntil: "domcontentloaded" }
  );
  await page.waitForTimeout(5000);

  const titleInput = page.locator("input[placeholder*='Ex:']").first();
  await titleInput.waitFor({ state: "visible", timeout: 10000 });
  await titleInput.fill("Backend Developer");
  console.log("  [OK] Title filled");

  const companyInput = page.locator("input[placeholder*='Ex: Microsoft']").first();
  await companyInput.fill("LinkedIn MCP Server (Personal Project)");
  await page.waitForTimeout(1500);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1000);
  console.log("  [OK] Company filled");

  const descEditor = page.locator("div.tiptap.ProseMirror").first();
  await descEditor.waitFor({ state: "visible", timeout: 10000 });
  await descEditor.click();
  await page.keyboard.press("Control+a");
  await page.keyboard.press("Delete");
  await page.waitForTimeout(500);

  const MCP_DESC =
    "Built a Model Context Protocol (MCP) server that enables AI assistants to interact with LinkedIn programmatically " +
    "\u2014 automating profile editing, feed posting, messaging, and data extraction via Playwright-powered browser automation.\n\n" +
    "Architected the full server in TypeScript using the MCP SDK with Zod schema validation, providing strongly-typed tool definitions for all LinkedIn interactions.\n\n" +
    "Engineered a stealth browser automation layer using Playwright with session recovery, CAPTCHA detection, and cookie persistence to maintain reliable authenticated sessions.\n\n" +
    "Designed a comprehensive tool suite covering profile read/write (headline, about, experience), feed interaction (read posts, create posts with dry-run safety), messaging, connections browsing, and job search.\n\n" +
    "Implemented dry-run mode across all write operations to allow verification of DOM selectors and form filling without publishing changes to the live profile or network.";

  await page.keyboard.type(MCP_DESC, { delay: 2 });
  console.log("  [OK] Description typed");

  const saveBtn = page.locator("button:has-text('Save')").first();
  await saveBtn.waitFor({ state: "visible", timeout: 10000 });
  await saveBtn.click({ timeout: 10000 });
  await page.waitForTimeout(3000);
  console.log("  [OK] Save clicked");

  console.log("\nLinkedIn MCP Server experience added successfully!");
  process.exit(0);
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
