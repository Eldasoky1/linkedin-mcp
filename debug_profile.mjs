import { initBrowser, getPage } from "./dist/browser.js";

async function main() {
  await initBrowser();
  const page = getPage();

  await page.goto("https://www.linkedin.com/in/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(5000);
  
  console.log("URL:", page.url());
  console.log("Title:", await page.title());
  
  // Get all h1 text
  const h1s = await page.locator("h1").all();
  console.log(`Found ${h1s.length} h1 elements`);
  for (const h of h1s) {
    console.log("  h1:", (await h.textContent())?.trim());
  }

  const h2s = await page.locator("h2").all();
  console.log(`Found ${h2s.length} h2 elements`);
  for (const h of h2s) {
    console.log("  h2:", (await h.textContent())?.trim());
  }

  // Look for profile-specific text
  const allText = await page.locator("section, div[data-view-name]").first().textContent().catch(() => "none");
  console.log("First section text:", allText?.substring(0, 200));
}

main().catch(e => { console.error(e); process.exit(1); });
