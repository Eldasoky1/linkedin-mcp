import { initBrowser, getPage } from "../src/browser.js";

async function main() {
  await initBrowser();
  const page = getPage();
  await page.goto("https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5000);

  // Scroll down to load lazy content
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(3000);

  const found = await page.evaluate(() => {
    const results: string[] = [];
    const items = document.querySelectorAll("[class*='experience'] section, [class*='position'], section:has(h2, h3, div)");
    for (const el of Array.from(items)) {
      const text = el.textContent?.trim() || "";
      if (text.length > 5 && text.length < 1000) results.push(text.substring(0, 300));
    }
    return results;
  });

  console.log("=== EXPERIENCE SECTION TEXT ===");
  for (const f of found) console.log(`\n---\n${f}`);

  // Also take screenshot
  await page.screenshot({ path: "profile_full.png", fullPage: true });
  console.log("\nScreenshot saved: profile_full.png");

  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
