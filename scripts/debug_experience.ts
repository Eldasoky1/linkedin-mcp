import { initBrowser, getPage } from "../src/browser.js";

async function main() {
  await initBrowser();
  const page = getPage();

  await page.goto(
    "https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/edit/forms/position/new/",
    { waitUntil: "domcontentloaded" }
  );
  await page.waitForTimeout(5000);

  console.log("URL:", page.url());

  // Get all visible inputs and their labels
  const formFields = await page.evaluate(() => {
    const results: any[] = [];
    const inputs = document.querySelectorAll("input, textarea, [contenteditable]");
    for (const inp of Array.from(inputs)) {
      if (inp.getBoundingClientRect().width === 0) continue;
      const id = inp.id || "";
      // Find label
      let label = "";
      const labelEl = document.querySelector(`label[for='${CSS.escape(id)}']`);
      if (labelEl) label = labelEl.textContent?.trim() || "";
      if (!label) {
        const labelledby = inp.getAttribute("aria-labelledby");
        if (labelledby) {
          const lb = document.getElementById(labelledby);
          if (lb) label = lb.textContent?.trim() || "";
        }
      }
      if (!label) {
        let parent = inp.parentElement;
        for (let i = 0; i < 5 && parent; i++) {
          const lbl = parent.querySelector("label, legend, span");
          if (lbl && lbl !== inp) {
            const txt = lbl.textContent?.trim() || "";
            if (txt) { label = txt; break; }
          }
          parent = parent.parentElement;
        }
      }

      results.push({
        tag: inp.tagName,
        type: (inp as HTMLInputElement).type || "",
        id,
        value: ((inp as HTMLInputElement).value || (inp as HTMLElement).innerText || "").substring(0, 50),
        placeholder: (inp as HTMLInputElement).placeholder || "",
        ariaLabel: inp.getAttribute("aria-label") || "",
        label,
        className: inp.className?.toString().substring(0, 50),
      });
    }
    return results;
  });

  console.log("\nForm fields:");
  for (const f of formFields) {
    console.log(`  [${f.tag} type=${f.type}] id="${f.id}" label="${f.label}" value="${f.value}" placeholder="${f.placeholder}" aria="${f.ariaLabel}"`);
  }

  // Also dump all visible button texts
  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("button"))
      .filter(b => b.getBoundingClientRect().width > 0)
      .map(b => b.innerText?.trim().substring(0, 50))
      .filter(t => t);
  });
  console.log("\nButtons:", buttons);

  // Check if there's a dialog overlay or iframe
  const dialogs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("div[role='dialog'], div[role='document'], dialog, [aria-modal='true']"))
      .map(d => d.tagName + " " + (d.className?.toString().substring(0, 40) || ""));
  });
  console.log("\nDialogs:", dialogs);

  process.exit(0);
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
