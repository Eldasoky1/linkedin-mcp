import { initBrowser, getPage } from "../src/browser.js";

async function main() {
  await initBrowser();
  const page = getPage();
  console.log("Current URL:", page.url());

  await page.goto("https://www.linkedin.com/in/me/edit/intro/", {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(5000);
  console.log("After nav URL:", page.url());

  await page.screenshot({ path: "debug_intro.png", fullPage: false });
  console.log("Screenshot saved to debug_intro.png");

  const html = await page.content();
  // Print relevant parts of the page
  const lines = html.split("\n").filter(
    (l) =>
      l.includes("headline") ||
      l.includes("Headline") ||
      l.includes("input") ||
      l.includes("textarea") ||
      l.includes("contenteditable") ||
      l.includes("aria-label")
  );
  for (const line of lines.slice(0, 50)) {
    console.log(line.trim().substring(0, 300));
  }

  process.exit(0);
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
