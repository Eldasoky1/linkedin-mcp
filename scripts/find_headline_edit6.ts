import { initBrowser, getPage } from "../src/browser.js";

async function main() {
  await initBrowser();
  const page = getPage();

  await page.goto("https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/", {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(5000);

  console.log("Current URL:", page.url());

  // Get the name and headline from the page
  const profileInfo = await page.evaluate(() => {
    const results: string[] = [];
    // Looking for headline - it's a div with text that's not a link, not an image alt, etc.
    // Usually it's right after the h1 (name)

    // Try to find the profile header section
    const sections = document.querySelectorAll("section");
    let nameText = "";
    let headlineText = "";

    for (const s of sections) {
      const h1 = s.querySelector("h1");
      if (h1) {
        nameText = h1.textContent?.trim() || "";
        // After h1, the next meaningful text div is usually the headline
        let el: Element | null = h1;
        let idx = 0;
        while (el && idx < 20) {
          el = el.nextElementSibling;
          if (el) {
            const txt = (el as HTMLElement).innerText?.trim() || "";
            if (txt && txt.length > 3 && txt.length < 300 && !txt.includes("http")) {
              headlineText = txt;
              results.push(`Found after h1: [${el.tagName}] class="${el.className?.toString().substring(0, 60)}" text="${txt.substring(0, 100)}"`);
              break;
            }
          }
          idx++;
        }
        break;
      }
    }

    return { name: nameText, headline: headlineText, debug: results };
  });

  console.log("Name:", profileInfo.name);
  console.log("Current headline:", profileInfo.headline);
  for (const d of profileInfo.debug) {
    console.log("  ", d);
  }

  // Click "Edit profile" link
  await page.click("a[aria-label='Edit profile']");
  await page.waitForTimeout(3000);
  console.log("\nAfter clicking Edit profile, URL:", page.url());

  await page.screenshot({ path: "after_edit_click.png", fullPage: false }).catch(() => {});

  // Look for editable fields in the profile section
  const editableFields = await page.evaluate(() => {
    const results: string[] = [];
    // Look for input-like elements or contenteditable divs
    const inputs = document.querySelectorAll("input, textarea, [contenteditable], [role='textbox']");
    for (const inp of inputs) {
      if (inp.getBoundingClientRect().width > 0) {
        results.push(
          `[${inp.tagName}] ` +
            `id="${inp.id}" ` +
            `value="${((inp as HTMLInputElement).value || (inp as HTMLElement).innerText || "").substring(0, 60)}" ` +
            `placeholder="${(inp as HTMLInputElement).placeholder}" ` +
            `aria="${inp.getAttribute("aria-label")}" ` +
            `class="${inp.className?.toString().substring(0, 30)}"`
        );
      }
    }
    return results;
  });

  console.log("\nEditable fields after edit click:");
  for (const f of editableFields) {
    console.log(`  ${f}`);
  }

  // Also look for any clickable elements that might trigger headline editing
  const clickableNearName = await page.evaluate(() => {
    const results: string[] = [];
    const h1 = document.querySelector("h1");
    if (!h1) return ["No h1 found"];
    const section = h1.closest("section");
    if (!section) return ["No section found"];

    section.querySelectorAll("button, [role='button'], a[role='button'], svg, [data-control-name]").forEach((el) => {
      const ariaLabel = el.getAttribute("aria-label") || "";
      const text = (el as HTMLElement).innerText?.trim().substring(0, 40) || "";
      const tag = el.tagName;
      const cls = el.className?.toString().substring(0, 30) || "";
      if (ariaLabel || text) {
        results.push(`[${tag}] class="${cls}" aria="${ariaLabel}" text="${text}"`);
      }
    });
    return results;
  });

  console.log("\nInteractive elements in profile section:");
  for (const c of clickableNearName) {
    console.log(`  ${c}`);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
