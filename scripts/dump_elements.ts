import { initBrowser, getPage } from "../src/browser.js";

async function main() {
  await initBrowser();
  const page = getPage();

  await page.goto("https://www.linkedin.com/in/me/edit/intro/", {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: "intro_page.png", fullPage: false });
  console.log("Screenshot saved");

  const pageUrl = page.url();
  console.log("URL:", pageUrl);

  // Get all input, textarea, and contenteditable elements
  const elements = await page.evaluate(() => {
    const results: any[] = [];
    document.querySelectorAll("input, textarea, [contenteditable], [role='textbox']").forEach((el) => {
      const rect = el.getBoundingClientRect();
      results.push({
        tag: el.tagName,
        type: (el as HTMLInputElement).type || "",
        id: el.id,
        className: el.className?.toString().substring(0, 80),
        placeholder: (el as HTMLInputElement).placeholder || "",
        ariaLabel: el.getAttribute("aria-label") || "",
        name: el.getAttribute("name") || "",
        visible: rect.width > 0 && rect.height > 0,
        x: rect.x,
        y: rect.y,
      });
    });
    return results;
  });

  console.log("\nInteractive elements found:");
  for (const el of elements) {
    console.log(`  ${el.tag} type="${el.type}" visible=${el.visible} label="${el.ariaLabel}" placeholder="${el.placeholder}" name="${el.name}" class="${el.className}"`);
  }

  // Get all buttons
  console.log("\nButtons:");
  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("button, [role='button']")).map(b => ({
      text: (b as HTMLElement).innerText?.trim().substring(0, 50),
      ariaLabel: b.getAttribute("aria-label") || "",
      visible: b.getBoundingClientRect().width > 0,
      className: b.className?.toString().substring(0, 80),
    })).filter(b => b.visible && (b.text || b.ariaLabel));
  });
  for (const b of buttons.slice(0, 30)) {
    console.log(`  button text="${b.text}" aria="${b.ariaLabel}"`);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
