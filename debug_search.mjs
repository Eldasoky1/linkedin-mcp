import { initBrowser, getPage } from "./dist/browser.js";

async function main() {
  await initBrowser();
  const page = getPage();

  await page.goto("https://www.linkedin.com/search/results/people/?keywords=engineer", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(5000);

  console.log("URL:", page.url());

  // Dump all list item classes
  const allLis = await page.locator("li").all();
  console.log(`\nTotal <li> elements: ${allLis.length}`);
  const seen = new Set();
  for (const li of allLis) {
    const cls = await li.getAttribute("class").catch(() => null);
    if (cls && !seen.has(cls)) {
      seen.add(cls);
      const inner = (await li.textContent())?.trim().substring(0, 60) || "";
      console.log(`  class="${cls}" -> "${inner}"`);
    }
  }

  // Dump all divs with specific data attributes
  const resultDivs = await page.locator("[data-view-name], [data-urn], article, div[class*='search-result']").all();
  console.log(`\nPotential result containers: ${resultDivs.length}`);
  for (const d of resultDivs) {
    const tag = await d.evaluate(el => `${el.tagName}.${el.className}`).catch(() => "?");
    const t = (await d.textContent())?.trim().substring(0, 80) || "";
    console.log(`  ${tag} -> "${t}"`);
  }
}

main().catch(console.error);
