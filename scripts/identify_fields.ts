import { initBrowser, getPage } from "../src/browser.js";

async function main() {
  await initBrowser();
  const page = getPage();

  await page.goto("https://www.linkedin.com/in/me/edit/intro/", {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(5000);

  // Find all visible text inputs and their labels
  const fields = await page.evaluate(() => {
    const results: any[] = [];
    // Get all visible text inputs
    document.querySelectorAll("input[type='text'], textarea").forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      // Try to find the associated label
      let labelText = "";
      const labelId = el.getAttribute("aria-labelledby");
      if (labelId) {
        const label = document.getElementById(labelId);
        if (label) labelText = label.innerText;
      }
      const ariaLabel = el.getAttribute("aria-label") || "";

      // Check input's value
      const val = (el as HTMLInputElement).value;
      const placeholder = (el as HTMLInputElement).placeholder || "";

      // Look at sibling/ancestor elements for labels
      let parent = el.parentElement;
      let foundLabel = "";
      for (let i = 0; i < 5; i++) {
        if (!parent) break;
        const labelEl = parent.querySelector("label, legend, span");
        if (labelEl && labelEl !== el) {
          foundLabel = labelEl.textContent?.trim() || "";
          if (foundLabel) break;
        }
        parent = parent.parentElement;
      }

      results.push({
        tag: el.tagName,
        type: (el as HTMLInputElement).type || "",
        value: val.substring(0, 50),
        placeholder,
        ariaLabel,
        ariaLabelledby: labelText,
        nearLabel: foundLabel,
        className: el.className?.toString().substring(0, 60),
      });
    });
    return results;
  });

  console.log("Fields with labels:");
  for (const f of fields) {
    console.log(`  [${f.tag} type=${f.type}] value="${f.value}" placeholder="${f.placeholder}" aria="${f.ariaLabel}" labelledby="${f.ariaLabelledby}" near="${f.nearLabel}"`);
  }

  // Also dump first 3 inputs' surrounding HTML
  const surrounding = await page.evaluate(() => {
    const inputs = document.querySelectorAll("input[type='text']");
    const result: string[] = [];
    for (let i = 0; i < Math.min(5, inputs.length); i++) {
      const el = inputs[i];
      let parent = el.parentElement;
      let html = "";
      if (parent) {
        html = parent.innerHTML?.substring(0, 500)?.replace(/</g, "&lt;") || "";
      }
      result.push(`Input #${i}: value="${(el as HTMLInputElement).value}"`);
      result.push(`  Parent HTML: ${html}`);
    }
    return result;
  });

  console.log("\nSurrounding HTML:");
  for (const s of surrounding) {
    console.log(`  ${s}`);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
