import { initBrowser, getPage } from "../src/browser.js";

async function main() {
  await initBrowser();
  const page = getPage();

  // Open add position form to inspect all elements
  await page.goto(
    "https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/edit/intro/",
    { waitUntil: "domcontentloaded", timeout: 30000 }
  );
  await page.waitForTimeout(4000);

  await page.click("a:has-text('Add new position')");
  await page.waitForTimeout(5000);

  const info = await page.evaluate(() => {
    const results: string[] = [];

    // All inputs, checkboxes, toggles
    document.querySelectorAll("input, textarea, select, button, [role='switch'], [type='checkbox'], label").forEach(el => {
      const tag = el.tagName.toLowerCase();
      const type = (el as HTMLInputElement).type || "";
      const name = el.getAttribute("name") || "";
      const placeholder = (el as HTMLInputElement).placeholder || "";
      const ariaLabel = el.getAttribute("aria-label") || "";
      const role = el.getAttribute("role") || "";
      const text = el.textContent?.trim()?.substring(0, 60) || "";
      const checked = (el as HTMLInputElement).checked;
      const cls = (el.className?.toString() || "").substring(0, 40);

      if (type === "checkbox" || role === "switch" || tag === "label" && text) {
        results.push(`[${tag}] type=${type} role=${role} aria="${ariaLabel}" checked=${checked} text="${text}" cls=${cls}`);
      }
    });

    return results;
  });

  console.log("=== CHECKBOXES / TOGGLES / LABELS ===");
  for (const r of info) console.log(r);

  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
