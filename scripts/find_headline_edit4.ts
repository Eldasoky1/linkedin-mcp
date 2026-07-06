import { initBrowser, getPage } from "../src/browser.js";

async function main() {
  await initBrowser();
  const page = getPage();

  await page.goto("https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/", {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(5000);

  // Click "Edit profile"
  const editProfile = page.locator("a[aria-label='Edit profile']").first();
  await editProfile.click();
  await page.waitForTimeout(3000);

  // Get the full page structure near the name/headline area
  const topSection = await page.evaluate(() => {
    // Find the section that contains the name
    const h1 = document.querySelector("h1");
    if (!h1) return "No h1 found";

    const parentSection = h1.closest("section") || h1.parentElement;
    if (!parentSection) return "No parent found";

    return (parentSection as HTMLElement).innerHTML?.substring(0, 3000)?.replace(/</g, "&lt;") || "Empty";
  });

  console.log("Top section HTML around name:");
  console.log(topSection);

  // Also dump all elements with role="button" or button that are in the top profile area
  const profileActions = await page.evaluate(() => {
    const h1 = document.querySelector("h1");
    if (!h1) return [];
    const section = h1.closest("section") || h1.parentElement;
    if (!section) return [];

    const results: string[] = [];
    const all = section.querySelectorAll("*");
    for (const el of all) {
      const tag = el.tagName;
      const ariaLabel = el.getAttribute("aria-label") || "";
      const text = (el as HTMLElement).innerText?.trim().substring(0, 40) || "";
      const role = el.getAttribute("role") || "";
      const cls = el.className?.toString().substring(0, 40) || "";
      if (ariaLabel || text) {
        results.push(`[${tag}] role="${role}" class="${cls}" aria="${ariaLabel}" text="${text}"`);
      }
    }
    return results;
  });

  console.log("\nProfile section elements:");
  for (const a of profileActions) {
    console.log(`  ${a}`);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
