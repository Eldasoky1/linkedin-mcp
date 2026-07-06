import { initBrowser, getPage } from "../src/browser.js";

async function main() {
  await initBrowser();
  const page = getPage();

  // Go to profile page
  await page.goto("https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/", {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "profile_main_page.png", fullPage: false });
  console.log("Profile page loaded");

  // Get all buttons and their labels
  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("button, [role='button']"))
      .map((b) => ({
        text: (b as HTMLElement).innerText?.trim().substring(0, 80),
        ariaLabel: b.getAttribute("aria-label") || "",
        visible: b.getBoundingClientRect().width > 0,
      }))
      .filter((b) => b.visible && (b.text || b.ariaLabel));
  });
  console.log("\nAll buttons on profile page:");
  for (const b of buttons) {
    console.log(`  "${b.text}" aria="${b.ariaLabel}"`);
  }

  // Look for any pencil/edit icons
  const editIcons = await page.evaluate(() => {
    const all = document.querySelectorAll("*");
    const results: string[] = [];
    for (const el of all) {
      const aria = el.getAttribute("aria-label") || "";
      if (
        aria.toLowerCase().includes("edit") ||
        aria.toLowerCase().includes("pencil")
      ) {
        results.push(`[${el.tagName}] aria="${aria}" text="${(el as HTMLElement).innerText?.trim().substring(0, 50)}"`);
      }
    }
    return results;
  });
  console.log("\nEdit-related elements:");
  for (const e of editIcons) {
    console.log(`  ${e}`);
  }

  // Check the current headline text location
  const headlineSection = await page.evaluate(() => {
    const h1 = document.querySelector("h1");
    const headlineEls = document.querySelectorAll(
      "div.text-body-medium, span.text-body-medium, [class*='headline']"
    );
    return {
      h1Text: h1?.textContent?.trim() || "",
      headlineElements: Array.from(headlineEls).map(
        (el) =>
          `${el.tagName} class="${el.className?.toString().substring(0, 60)}" text="${(el as HTMLElement).innerText?.trim().substring(0, 80)}"`
      ),
    };
  });
  console.log("\nHeadline section:", JSON.stringify(headlineSection, null, 2));

  process.exit(0);
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
