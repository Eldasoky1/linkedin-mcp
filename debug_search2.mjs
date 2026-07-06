import { initBrowser, getPage } from "./dist/browser.js";

async function main() {
  await initBrowser();
  const page = getPage();

  await page.goto("https://www.linkedin.com/search/results/people/?keywords=engineer", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(5000);

  // Find all links with /in/ in href (profile links)
  const links = await page.locator("a[href*='/in/']").all();
  console.log(`Profile links found: ${links.length}`);
  for (const link of links) {
    const href = await link.getAttribute("href").catch(() => null);
    const text = (await link.textContent())?.trim() || "";
    if (text.length > 2) {
      console.log(`  "${text}" -> ${href?.split("?")[0]}`);
    }
  }

  // Find parent container of first profile link
  const firstLink = await page.locator("a[href*='/in/']").first();
  if (await firstLink.isVisible().catch(() => false)) {
    const parentTag = await firstLink.evaluate(el => {
      let p = el.parentElement;
      let depth = 0;
      while (p && depth < 10) {
        if (p.children.length > 3) return `${p.tagName}.${p.className} (depth=${depth}, children=${p.children.length})`;
        p = p.parentElement;
        depth++;
      }
      return "not found";
    }).catch(() => "error");
    console.log(`\nFirst profile link parent structure: ${parentTag}`);
  }
}

main().catch(console.error);
