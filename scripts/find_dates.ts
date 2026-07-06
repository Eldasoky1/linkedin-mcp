import { initBrowser, getPage } from "../src/browser.js";

async function main() {
  await initBrowser();
  const page = getPage();

  await page.goto(
    "https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/edit/forms/position/new/?profileFormEntryPoint=IntroForm",
    { waitUntil: "domcontentloaded", timeout: 30000 }
  );
  await page.waitForTimeout(5000);

  // Get all input fields and their labels
  const allFields = await page.evaluate(() => {
    const results: any[] = [];
    document.querySelectorAll("input, select, textarea, [contenteditable]").forEach(el => {
      if (el.getBoundingClientRect().width === 0) return;
      
      // Find label
      let label = "";
      const id = el.id || "";
      if (id) {
        const labelEl = document.querySelector(`label[for='${CSS.escape(id)}']`);
        if (labelEl) label = labelEl.textContent?.trim() || "";
      }
      const ariaLabel = el.getAttribute("aria-label") || "";
      const placeholder = (el as HTMLInputElement).placeholder || "";
      const tag = el.tagName;
      const type = (el as HTMLInputElement).type || (el as HTMLSelectElement).type || "";
      
      results.push({
        tag, type, label, ariaLabel, placeholder,
        id: id.substring(0, 10),
        className: el.className?.toString().substring(0, 30),
        value: ((el as HTMLInputElement).value || "").substring(0, 30),
      });
    });
    return results;
  });

  console.log("All form fields:");
  for (const f of allFields) {
    console.log(`  [${f.tag} type=${f.type}] label="${f.label}" aria="${f.ariaLabel}" placeholder="${f.placeholder}" value="${f.value}"`);
  }

  // Also look at the full page text to find date-related sections
  const pageText = await page.evaluate(() => {
    const results: string[] = [];
    const lines = (document.body.innerText || "").split("\n");
    for (const line of lines) {
      const t = line.trim();
      if (t.includes("date") || t.includes("Date") || t.includes("month") || t.includes("Month") || t.includes("year") || t.includes("Year") || t.includes("Present") || t.includes("From") || t.includes("To")) {
        results.push(t);
      }
    }
    return results;
  });

  console.log("\nDate-related text on page:");
  for (const t of pageText) {
    console.log(`  "${t}"`);
  }

  // Check for month/year selectors
  const dateSelectors = await page.evaluate(() => {
    const results: string[] = [];
    document.querySelectorAll("select, [role='combobox']").forEach(el => {
      if (el.getBoundingClientRect().width === 0) return;
      const options = Array.from(el.querySelectorAll("option")).map(o => o.textContent?.trim()).filter(Boolean);
      if (options.length > 0) {
        // Check if this looks like a month/year selector
        const hasNums = options.some(o => /^\d{4}$/.test(o || ""));
        const isMonth = options.some(o => /Jan|Feb|Mar|Apr/i.test(o || ""));
        if (hasNums || isMonth) {
          results.push(`[${el.tagName}] id="${el.id.substring(0, 10)}" options count=${options.length} first options: ${options.slice(0, 5).join(", ")}`);
        }
      }
    });
    return results;
  });

  console.log("\nDate selector dropdowns:");
  for (const d of dateSelectors) {
    console.log(`  ${d}`);
  }

  process.exit(0);
}

main().catch(e => {
  console.error("Error:", e.message);
  process.exit(1);
});
