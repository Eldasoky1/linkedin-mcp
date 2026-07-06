import { initBrowser, getPage } from "./dist/browser.js";

async function main() {
  await initBrowser();
  const page = getPage();

  await page.goto("https://www.linkedin.com/in/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(5000);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(3000);

  // Look for education-related sections
  const eduSections = await page.locator("section:has-text('Education'), div:has-text('Education'), [id*='education'], [data-view-name*='education']").all();
  console.log(`Education-related sections found: ${eduSections.length}`);
  for (const s of eduSections) {
    const tag = await s.evaluate(el => `${el.tagName}.${el.className.substring(0, 80)}`).catch(() => "?");
    const text = (await s.textContent())?.trim().substring(0, 200) || "";
    console.log(`  ${tag}`);
    console.log(`  Text: "${text}"`);
    console.log();
  }

  // Also look for h2 with "Education" text
  const h2s = await page.locator("h2, h3, h4, div[class*='section-title'], div[class*='header']").all();
  console.log(`\nAll headings:`);
  for (const h of h2s) {
    const t = (await h.textContent())?.trim() || "";
    if (t.length > 0 && t.length < 100) {
      console.log(`  "${t}"`);
    }
  }
}

main().catch(console.error);
