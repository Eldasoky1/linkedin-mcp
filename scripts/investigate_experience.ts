import { initBrowser, getPage } from "../src/browser.js";

async function main() {
  await initBrowser();
  const page = getPage();

  // 1. Check the experience section edit mode
  await page.goto(
    "https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/",
    { waitUntil: "domcontentloaded" }
  );
  await page.waitForTimeout(5000);
  console.log("Profile URL:", page.url());

  // Check for "Edit profile" using various selectors
  const editLinks = await page.evaluate(() => {
    const results: string[] = [];
    document.querySelectorAll("a, button, [role='button']").forEach(el => {
      const aria = el.getAttribute("aria-label") || "";
      const text = (el as HTMLElement).innerText?.trim() || "";
      const href = (el as HTMLAnchorElement).href || "";
      if (aria.toLowerCase().includes("edit") || text.toLowerCase().includes("edit")) {
        results.push(`[${el.tagName}] aria="${aria}" text="${text.substring(0, 40)}" href="${href}"`);
      }
    });
    return results;
  });
  console.log("\nEdit-related elements:");
  for (const l of editLinks) {
    console.log(`  ${l}`);
  }

  // Check if experience section exists by looking for any company/job names
  const jobTexts = await page.evaluate(() => {
    const results: string[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const text = node.textContent?.trim() || "";
      if (
        text.includes("CompliAI") ||
        text.includes("compliAI") ||
        text.includes("CRM") ||
        text.includes("AVR") ||
        text.includes("RC5") ||
        text.includes("LinkedIn MCP") ||
        text.includes("MCP Server") ||
        text.includes("Backend Lead") ||
        text.includes("Backend Developer")
      ) {
        results.push(text);
      }
    }
    return [...new Set(results)];
  });
  console.log("\nJob-related text found:");
  for (const t of jobTexts) {
    console.log(`  "${t.substring(0, 200)}"`);
  }

  // 2. Try navigating to the experience edit directly
  await page.goto(
    "https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/edit/forms/position/new/",
    { waitUntil: "domcontentloaded" }
  );
  await page.waitForTimeout(5000);
  console.log("\nPosition edit URL:", page.url());

  // Check if we can see current positions
  const currentPositions = await page.evaluate(() => {
    const results: string[] = [];
    document.querySelectorAll("*").forEach(el => {
      const text = (el as HTMLElement).innerText?.trim() || "";
      if (text.includes("Current position") || text.includes("current position")) {
        results.push(text.substring(0, 300));
      }
    });
    return results;
  });
  console.log("\nCurrent position text:", currentPositions);

  // Check the left sidebar/back link for current positions
  const allLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("a"))
      .filter(a => a.getBoundingClientRect().width > 0)
      .map(a => ({
        href: a.href,
        text: a.textContent?.trim().substring(0, 80) || "",
      }));
  });
  console.log("\nAll visible links:");
  for (const l of allLinks.slice(0, 30)) {
    console.log(`  href="${l.href}" text="${l.text}"`);
  }

  process.exit(0);
}

main().catch(e => {
  console.error("Error:", e);
  process.exit(1);
});
