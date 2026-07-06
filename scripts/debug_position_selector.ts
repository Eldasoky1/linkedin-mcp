import { initBrowser, getPage } from "../src/browser.js";

async function main() {
  await initBrowser();
  const page = getPage();

  await page.goto(
    "https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/edit/intro/",
    { waitUntil: "domcontentloaded", timeout: 30000 }
  );
  await page.waitForTimeout(5000);

  // Investigate the "Position*" selector
  const positionSelector = await page.evaluate(() => {
    const results: string[] = [];

    // Find all elements containing "Position*" or near position
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const el = node as Element;
      const text = el.textContent?.trim() || "";
      if (text.includes("Current position")) {
        const html = el.innerHTML?.substring(0, 3000)?.replace(/</g, "&lt;") || "";
        results.push("Current position section HTML:");
        results.push(html);
      }
    }
    return results;
  });

  console.log("Position section:");
  for (const r of positionSelector) {
    console.log(r);
  }

  // Also check for any select/dropdown/autocomplete elements near position
  const interactive = await page.evaluate(() => {
    const results: string[] = [];
    document.querySelectorAll("select, [role='combobox'], [role='listbox'], [role='listitem'], input[type='text']").forEach(el => {
      if (el.getBoundingClientRect().width === 0) return;
      const parentText = el.parentElement?.textContent?.trim() || "";
      const ariaLabel = el.getAttribute("aria-label") || "";
      const placeholder = (el as HTMLInputElement).placeholder || "";
      const id = el.id || "";
      if (
        parentText.includes("Position") ||
        parentText.includes("position") ||
        ariaLabel.includes("position") ||
        ariaLabel.includes("Position") ||
        placeholder.includes("position") ||
        placeholder.includes("Position")
      ) {
        results.push(`[${el.tagName}] id="${id}" aria="${ariaLabel}" placeholder="${placeholder}" parentText="${parentText.substring(0, 80)}"`);
      }
    });
    return results;
  });

  console.log("\nPosition-related interactive elements:");
  for (const i of interactive) {
    console.log(`  ${i}`);
  }

  // Find all input fields in the Current position section
  const inputsInPosition = await page.evaluate(() => {
    const allText = document.body.innerText || "";
    const posIdx = allText.indexOf("Current position");
    if (posIdx < 0) return [];

    // Get the section element
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    let node: Node | null;
    let sectionEl: Element | null = null;
    while ((node = walker.nextNode())) {
      const el = node as Element;
      if (el.textContent?.includes("Current position")) {
        sectionEl = el;
        break;
      }
    }
    if (!sectionEl) return [];

    const results: string[] = [];
    sectionEl.querySelectorAll("input, textarea, select, [contenteditable], [role='combobox']").forEach(el => {
      results.push(`[${el.tagName}] id="${el.id}" class="${el.className?.toString().substring(0, 40)}" placeholder="${(el as HTMLInputElement).placeholder}" aria="${el.getAttribute('aria-label')}" role="${el.getAttribute('role')}"`);
    });
    return results;
  });

  console.log("\nInputs in position section:");
  for (const i of inputsInPosition) {
    console.log(`  ${i}`);
  }

  process.exit(0);
}

main().catch(e => {
  console.error("Error:", e.message);
  process.exit(1);
});
