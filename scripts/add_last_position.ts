import { initBrowser, getPage } from "../src/browser.js";

async function main() {
  await initBrowser();
  const page = getPage();

  await page.goto(
    "https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/edit/intro/",
    { waitUntil: "domcontentloaded", timeout: 30000 }
  );
  await page.waitForTimeout(4000);

  await page.click("a:has-text('Add new position')");
  await page.waitForTimeout(3000);

  await page.locator("input[placeholder*='Ex:' i]").first().fill("Backend Developer");
  const companyInput = page.locator("input[placeholder*='Ex: Microsoft' i]").first();
  await companyInput.fill("LinkedIn MCP Server (Personal Project)");
  await page.waitForTimeout(1500);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1000);

  const allSelects = page.locator("select");
  await allSelects.nth(1).selectOption("12");
  console.log("  [OK] Start month: December");
  await allSelects.nth(2).selectOption("2025");
  console.log("  [OK] Start year: 2025");

  const editor = page.locator("div.tiptap.ProseMirror").first();
  await editor.fill("");
  await page.keyboard.type(
    `Built a Model Context Protocol (MCP) server enabling AI assistants to interact with LinkedIn programmatically.\n\nArchitected the server in TypeScript using MCP SDK with Zod schema validation for all LinkedIn interactions.\n\nEngineered stealth browser automation layer using Playwright with session recovery and CAPTCHA detection.\n\nDesigned tool suite covering profile read/write, feed interaction, messaging, connections, and job search.\n\nImplemented dry-run mode across all write operations to verify selectors without publishing changes.`,
    { delay: 2 }
  );

  await page.locator("button:has-text('Save')").first().click({ timeout: 15000 });
  await page.waitForTimeout(4000);
  console.log("  [OK] Position saved");

  // Navigate to profile and verify
  await page.goto("https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5000);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(3000);

  const pageText = await page.evaluate(() => document.body.innerText);
  const targets = ["CompliAI", "CRM Pipeline", "AVR", "MCP Server", "Backend Lead", "Systems Developer"];
  for (const t of targets) {
    if (pageText.includes(t)) {
      console.log(`  [FOUND] "${t}" on profile`);
    } else {
      console.log(`  [MISSING] "${t}" not on profile`);
    }
  }

  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
