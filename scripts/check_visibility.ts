import { initBrowser, getPage } from "../src/browser.js";

async function main() {
  await initBrowser();
  const page = getPage();

  await page.goto(
    "https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/edit/intro/",
    { waitUntil: "domcontentloaded", timeout: 30000 }
  );
  await page.waitForTimeout(4000);

  // Select each position in the dropdown and look for a "Show on profile" toggle
  const allSelects = page.locator("select").first();
  const options = await allSelects.evaluate(el => {
    return Array.from(el.querySelectorAll("option")).map(o => o.textContent?.trim()).filter(Boolean);
  });

  for (const opt of options) {
    if (opt === "Backend AI Engineer - Intern at FlyRank AI") continue; // skip existing

    console.log(`\n--- Selecting: "${opt}" ---`);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(4000);

    await allSelects.selectOption({ label: opt });
    await page.waitForTimeout(2000);

    // Look for any toggle/visibility checkbox near the form
    const toggles = await page.evaluate(() => {
      const results: any[] = [];
      document.querySelectorAll("[role='switch'], input[type='checkbox'], [aria-checked]").forEach(el => {
        const role = el.getAttribute("role") || "";
        const type = (el as HTMLInputElement).type || "";
        const checked = (el as HTMLInputElement).checked !== undefined 
          ? (el as HTMLInputElement).checked 
          : el.getAttribute("aria-checked");
        const parent = el.parentElement?.textContent?.trim()?.substring(0, 80) || "";
        const nextText = (el.nextElementSibling?.textContent?.trim() || "").substring(0, 60);
        const prevText = (el.previousElementSibling?.textContent?.trim() || "").substring(0, 60);
        if ((el as HTMLElement).offsetParent !== null) {
          results.push({
            role, type, checked,
            parent: parent.substring(0, 60),
            next: nextText,
            prev: prevText,
          });
        }
      });
      return results;
    });

    if (toggles.length > 0) {
      console.log("  Toggles found:");
      for (const t of toggles) console.log(`    role=${t.role} checked=${t.checked} prev="${t.prev}" next="${t.next}"`);
    } else {
      console.log("  No toggles visible");
    }
  }

  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
