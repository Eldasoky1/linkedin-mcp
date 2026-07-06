import { initBrowser, getPage } from "../src/browser.js";

async function main() {
  await initBrowser();
  const page = getPage();

  await page.goto("https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/", {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(5000);

  await page.screenshot({ path: "before_edit.png", fullPage: false }).catch(() => {});

  // Test 1: Look for the headline text location in the DOM without edit mode
  const headlineInfo = await page.evaluate(() => {
    const results: string[] = [];
    // Look for divs or spans that might contain headline text
    // Generally LinkedIn uses specific structures
    const allDivs = document.querySelectorAll("div, span, p");
    for (const d of allDivs) {
      const txt = (d.textContent || "").trim();
      if (
        txt.length > 5 &&
        txt.length < 300 &&
        !txt.includes("http") &&
        (txt.includes("Backend") ||
         txt.includes("Software") ||
         txt.includes("Student") ||
         txt.includes("Engineer") ||
         txt.includes("Developer") ||
         txt.includes("Lead") ||
         txt.includes("Architect") ||
         txt.includes("CompliAI"))
      ) {
        const tag = d.tagName;
        const cls = d.className?.toString().substring(0, 60) || "";
        const parentCls = d.parentElement?.className?.toString().substring(0, 40) || "";
        results.push(`[${tag}] class="${cls}" parentClass="${parentCls}" txt="${txt.substring(0, 80)}"`);
      }
    }
    return results.slice(0, 20);
  });

  console.log("Potential headline elements:");
  for (const h of headlineInfo) {
    console.log(`  ${h}`);
  }

  // Test 2: Look for the edit URL pattern
  const editButtons2 = await page.evaluate(() => {
    const results: { href?: string; text: string; aria: string }[] = [];
    document.querySelectorAll("a[href*='edit'], button[aria-label*='edit' i], a[aria-label*='edit' i]").forEach((el) => {
      results.push({
        href: (el as HTMLAnchorElement).href || "",
        text: (el as HTMLElement).innerText?.trim().substring(0, 50) || "",
        aria: el.getAttribute("aria-label") || "",
      });
    });
    return results;
  });

  console.log("\nEdit links/buttons:");
  for (const b of editButtons2) {
    console.log(`  href="${b.href}" text="${b.text}" aria="${b.aria}"`);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
