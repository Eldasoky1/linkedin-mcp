import { initBrowser, getPage } from "../src/browser.js";

async function main() {
  await initBrowser();
  const page = getPage();
  await page.goto("https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(6000);
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(3000);

  const expText = await page.evaluate(() => {
    const results: string[] = [];
    const all = document.querySelectorAll("*");
    for (const el of Array.from(all)) {
      const text = el.textContent?.trim() || "";
      const aria = el.getAttribute("aria-label") || "";
      const role = el.getAttribute("role") || "";
      const cls = el.className?.toString() || "";
      if (
        text.length > 10 &&
        text.length < 500 &&
        (text.includes("Experience") ||
         cls.includes("experience") ||
         text.includes("CompliAI") ||
         text.includes("CRM Pipeline") ||
         text.includes("LinkedIn MCP") ||
         text.includes("Backend Lead") ||
         text.includes("Systems Developer") ||
         text.includes("FlyRank") ||
         aria.includes("experience") ||
         role === "list" && text.includes("Developer"))
      ) {
        const parentText = el.parentElement?.textContent?.trim() || "";
        results.push(`role="${role}" aria="${aria}" cls="${cls.substring(0,60)}" text="${text.substring(0, 300)}"`);
      }
    }
    return results.slice(0, 30);
  });

  for (const r of expText) console.log(r);

  // Also check Edit intro page
  await page.goto(
    "https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/edit/intro/",
    { waitUntil: "domcontentloaded" }
  );
  await page.waitForTimeout(5000);

  const dropdownInfo = await page.evaluate(() => {
    const selects = document.querySelectorAll("select");
    const results: {idx: number; selected: string; options: string[]}[] = [];
    for (let i = 0; i < selects.length; i++) {
      const s = selects[i];
      if (s.options.length > 1 && s.options.length < 30) {
        const opts = Array.from(s.options).map(o => o.textContent?.trim() || "");
        results.push({
          idx: i,
          selected: s.options[s.selectedIndex]?.textContent?.trim() || "",
          options: opts.filter(o => o && o !== "Month" && o !== "Year" && o !== "Please select"),
        });
      }
    }
    return results;
  });

  console.log("\n=== DROPDOWN POSITIONS ===");
  for (const d of dropdownInfo) {
    console.log(`Select #${d.idx}: selected="${d.selected}"`);
    for (const o of d.options) console.log(`  - "${o}"`);
  }

  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
