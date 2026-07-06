import { initBrowser, getPage } from "../src/browser.js";

async function main() {
  await initBrowser();
  const page = getPage();

  // Go directly to the edit intro page
  await page.goto("https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/edit/intro/", {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(5000);

  console.log("URL:", page.url());

  // Get all visible text/labels on the page
  const allText = await page.evaluate(() => {
    const results: string[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const text = node.textContent?.trim() || "";
      if (text.length > 2 && text.length < 200 && !text.includes("Skip to")) {
        results.push(text);
      }
    }
    return [...new Set(results)].slice(0, 60);
  });

  console.log("\nAll text content on page:");
  for (const t of allText) {
    console.log(`  "${t}"`);
  }

  // Look for ANYTHING that says "headline" 
  const headlineRefs = await page.evaluate(() => {
    const results: string[] = [];
    document.querySelectorAll("*").forEach((el) => {
      const html = el.innerHTML?.toLowerCase() || "";
      const text = (el as HTMLElement).innerText?.toLowerCase() || "";
      const ariaLabel = el.getAttribute("aria-label")?.toLowerCase() || "";
      const cls = el.className?.toString().toLowerCase() || "";
      if (
        html.includes("headline") ||
        text.includes("headline") ||
        ariaLabel.includes("headline") ||
        cls.includes("headline")
      ) {
        results.push(
          `[${el.tagName}] text="${text.substring(0, 80)}" aria="${ariaLabel}" class="${cls.substring(0, 40)}"`
        );
      }
    });
    return results;
  });

  console.log("\nElements mentioning 'headline':");
  for (const h of headlineRefs) {
    console.log(`  ${h}`);
  }

  // Check what label the text input fields have
  const formLabels = await page.evaluate(() => {
    const results: string[] = [];
    const inputs = document.querySelectorAll("input[type='text']");
    for (const inp of Array.from(inputs)) {
      if (inp.getBoundingClientRect().width === 0) continue;
      // Find the label
      const id = inp.id;
      let label = "";
      const labelEl = document.querySelector(`label[for='${id}']`);
      if (labelEl) {
        label = labelEl.textContent?.trim() || "";
      }
      // Try aria-labelledby
      const labelledby = inp.getAttribute("aria-labelledby");
      if (labelledby) {
        const lb = document.getElementById(labelledby);
        if (lb) label = lb.textContent?.trim() || "";
      }
      results.push(
        `id="${id}" value="${(inp as HTMLInputElement).value}" label="${label}" aria-label="${inp.getAttribute("aria-label") || ""}"`
      );
    }
    return results;
  });

  console.log("\nForm inputs with labels:");
  for (const f of formLabels) {
    console.log(`  ${f}`);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
