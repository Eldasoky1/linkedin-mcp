import { initBrowser, getPage } from "../src/browser.js";

async function main() {
  await initBrowser();
  const page = await getPage();

  // Helper: select a position in the dropdown by label text
  async function selectPosition(label: string): Promise<boolean> {
    // Find the select that contains this label as an option
    const found = await page.evaluate((lbl) => {
      const selects = document.querySelectorAll("select");
      for (const s of selects) {
        if (s.offsetParent === null) continue;
        const opts = Array.from(s.options).map(o => o.textContent?.trim());
        if (opts.some(t => t === lbl)) {
          s.selectedIndex = opts.indexOf(lbl);
          s.dispatchEvent(new Event("change", { bubbles: true }));
          return { idx: [...selects].indexOf(s), success: true };
        }
      }
      return null;
    }, label);

    if (!found) {
      console.log(`  Can't find select with option "${label}"`);
      return false;
    }
    await page.waitForTimeout(1000);
    return true;
  }

  await page.goto(
    "https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/edit/intro/",
    { waitUntil: "domcontentloaded", timeout: 30000 }
  );
  await page.waitForTimeout(5000);

  // Get all position names from the dropdown
  const opts: string[] = await page.evaluate(() => {
    const selects = document.querySelectorAll("select");
    for (const s of selects) {
      if (s.offsetParent === null) continue;
      const opts = Array.from(s.options).map(o => o.textContent?.trim()).filter(Boolean);
      const nonGeneric = opts.filter(o => !["Please select", "Month", "Year", ""].includes(o || ""));
      if (nonGeneric.length > 1 && !nonGeneric.every(t => /^\d{4}$/.test(t || ""))) {
        return nonGeneric;
      }
    }
    return [];
  });

  console.log("Position options:", opts);

  for (const opt of opts) {
    if (opt === "Backend AI Engineer - Intern at FlyRank AI") continue;
    console.log(`\nPublishing: "${opt}"`);

    // Select by native DOM event
    await page.evaluate((lbl) => {
      const selects = document.querySelectorAll("select");
      for (const s of selects) {
        if (s.offsetParent === null) continue;
        for (let i = 0; i < s.options.length; i++) {
          if (s.options[i].textContent?.trim() === lbl) {
            s.selectedIndex = i;
            s.dispatchEvent(new Event("change", { bubbles: true }));
            return;
          }
        }
      }
    }, opt);
    await page.waitForTimeout(2000);

    const saveBtn = page.locator("button:has-text('Save')").first();
    await saveBtn.click({ timeout: 15000 });
    await page.waitForTimeout(4000);
    console.log("  Saved");
  }

  // Verify
  await page.goto("https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5000);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(3000);

  const text = await page.evaluate(() => document.body.innerText);
  for (const c of ["CompliAI", "CRM Pipeline", "AVR Microcontroller", "MCP Server", "Systems Developer"]) {
    console.log(text.includes(c) ? `  [FOUND] "${c}"` : `  [MISSING] "${c}"`);
  }

  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
