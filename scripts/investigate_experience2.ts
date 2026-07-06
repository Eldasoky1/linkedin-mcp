import { initBrowser, getPage } from "../src/browser.js";

async function main() {
  await initBrowser();
  const page = getPage();

  // First, let's check what the edit intro page shows for positions
  console.log("=== Checking edit intro page for existing positions ===");

  await page.goto(
    "https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/edit/intro/",
    { waitUntil: "domcontentloaded", timeout: 30000 }
  );
  await page.waitForTimeout(5000);
  console.log("Edit intro URL:", page.url());

  // Get all text content on the page related to positions
  const pageText = await page.evaluate(() => {
    return (document.body.innerText || "").substring(0, 3000);
  });
  console.log("Page text:");
  console.log(pageText);

  // Look for position-related content
  const positionLinks = await page.evaluate(() => {
    const results: string[] = [];
    document.querySelectorAll("a[href*='position']").forEach(a => {
      results.push(`href="${(a as HTMLAnchorElement).href}" text="${a.textContent?.trim().substring(0, 80)}"`);
    });
    return results;
  });
  console.log("\nPosition links:");
  for (const l of positionLinks) {
    console.log(`  ${l}`);
  }

  // Also check for current position entries on the page
  const positionEntries = await page.evaluate(() => {
    const results: string[] = [];
    const items = document.querySelectorAll("[data-view-name*='position'], .pvs-entity, li[class]");
    for (const item of Array.from(items)) {
      const text = (item as HTMLElement).innerText?.trim() || "";
      if (text && text.length > 5 && text.length < 500) {
        results.push(text.substring(0, 200));
      }
    }
    return results.slice(0, 20);
  });
  console.log("\nPotential position entries:");
  for (const p of positionEntries) {
    console.log(`  "${p}"`);
  }

  // Check the "Current position" section
  const currentPosSection = await page.evaluate(() => {
    const all = document.querySelectorAll("*");
    for (const el of all) {
      if (el.textContent?.includes("Current position")) {
        let next = el.nextElementSibling;
        let count = 0;
        const children: string[] = [];
        while (next && count < 10) {
          const txt = (next as HTMLElement).innerText?.trim() || "";
          if (txt && txt !== "Current position") {
            children.push(txt.substring(0, 100));
          }
          next = next.nextElementSibling;
          count++;
        }
        return { hasSection: true, children };
      }
    }
    return { hasSection: false, children: [] };
  });
  console.log("\nCurrent position section:", JSON.stringify(currentPosSection, null, 2));

  // Try to find "Add new position" or "Add position" button
  const addPositionButtons = await page.evaluate(() => {
    const results: string[] = [];
    document.querySelectorAll("button, a, [role='button']").forEach(el => {
      const text = (el as HTMLElement).innerText?.trim() || "";
      const aria = el.getAttribute("aria-label") || "";
      if (text.toLowerCase().includes("add") || aria.toLowerCase().includes("add")) {
        results.push(`[${el.tagName}] text="${text.substring(0, 60)}" aria="${aria}"`);
      }
    });
    return results;
  });
  console.log("\n'Add' buttons/links:");
  for (const b of addPositionButtons) {
    console.log(`  ${b}`);
  }

  process.exit(0);
}

main().catch(e => {
  console.error("Error:", e.message);
  process.exit(1);
});
