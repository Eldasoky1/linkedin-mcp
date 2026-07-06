import { initBrowser, getPage } from "../src/browser.js";

async function main() {
  await initBrowser();
  const page = getPage();
  await page.goto("https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5000);

  const relevant = await page.evaluate(() => {
    const results: string[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const text = node.textContent?.trim() || "";
      const targets = ["CompliAI", "CRM Pipeline", "AVR MCU", "MCP Server", "Backend Lead", "Systems Developer", "Backend Developer"];
      if (targets.some(t => text.includes(t))) results.push(text);
    }
    return [...new Set(results)];
  });

  console.log("\n=== PROFILE VERIFICATION ===");
  if (relevant.length === 0) console.log("  NOT FOUND");
  for (const r of relevant) console.log(`  "${r.substring(0, 200)}"`);

  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
