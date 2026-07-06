import { initBrowser, getPage } from "../src/browser.js";

async function main() {
  await initBrowser();
  const page = getPage();

  await page.goto("https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/", {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(5000);
  console.log("Profile page URL:", page.url());

  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("button, [role='button']"))
      .map((b) => ({
        text: (b as HTMLElement).innerText?.trim().substring(0, 80),
        ariaLabel: b.getAttribute("aria-label") || "",
      }))
      .filter((b) => b.text || b.ariaLabel);
  });
  console.log("\nButtons:");
  for (const b of buttons) {
    console.log(`  "${b.text}" aria="${b.ariaLabel}"`);
  }

  const editSelectors = await page.evaluate(() => {
    const results: string[] = [];
    document.querySelectorAll("[aria-label*='edit' i], [aria-label*='pencil' i], [data-control-name*='edit' i]").forEach((el) => {
      results.push(`${el.tagName} aria="${el.getAttribute("aria-label")}" data-control-name="${el.getAttribute("data-control-name")}"`);
    });
    return results;
  });
  console.log("\nEdit elements:", editSelectors);

  const headlineArea = await page.evaluate(() => {
    const h1 = document.querySelector("h1");
    const allDivs = document.querySelectorAll("div[class]");
    let headlineText = "";
    for (const d of allDivs) {
      const txt = (d as HTMLElement).innerText?.trim() || "";
      if (
        txt.length > 10 &&
        txt.length < 250 &&
        d.children.length < 3 &&
        (d.parentElement?.querySelector("h1") || d.closest("[class*='profile']"))
      ) {
        const prev = d.previousElementSibling;
        if (prev?.tagName === "H1") {
          headlineText = txt;
          break;
        }
      }
    }
    return { h1Text: h1?.textContent?.trim() || "", headlineText };
  });
  console.log("\nName:", headlineArea.h1Text);
  console.log("Headline guess:", headlineArea.headlineText);

  process.exit(0);
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
