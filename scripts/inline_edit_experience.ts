import { initBrowser, getPage } from "../src/browser.js";
import { Page } from "playwright";

async function addPositionInline(page: Page, idx: number, title: string, company: string, desc: string) {
  console.log(`\n--- Adding Experience #${idx + 1}: ${title} @ ${company} ---`);

  // Step 1: Go to profile page
  await page.goto(
    "https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/",
    { waitUntil: "domcontentloaded", timeout: 30000 }
  );
  await page.waitForTimeout(4000);
  console.log("  Profile page loaded");

  // Step 2: Click "Edit profile" button — enters inline edit mode
  const editProfileLink = page.locator("a[aria-label='Edit profile']").first();
  await editProfileLink.waitFor({ state: "visible", timeout: 10000 });
  await editProfileLink.click();
  await page.waitForTimeout(3000);
  console.log("  Clicked Edit profile, URL:", page.url());

  // Step 3: Look for the experience section "Add position" button in edit mode
  // In the inline edit mode, sections become editable
  // Look for buttons/text that say "Add experience" or "Add position"
  const addExperienceOpts = await page.evaluate(() => {
    const results: string[] = [];
    document.querySelectorAll("button, a, [role='button']").forEach(el => {
      const text = (el as HTMLElement).innerText?.trim() || "";
      const aria = el.getAttribute("aria-label") || "";
      if (
        text.toLowerCase().includes("experience") ||
        text.toLowerCase().includes("position") ||
        aria.toLowerCase().includes("experience") ||
        aria.toLowerCase().includes("position")
      ) {
        results.push(`[${el.tagName}] text="${text.substring(0, 60)}" aria="${aria}" href="${(el as HTMLAnchorElement).href || ""}"`);
      }
    });
    return results;
  });
  console.log("\n  Experience-related elements:");
  for (const e of addExperienceOpts) {
    console.log(`    ${e}`);
  }

  // Check if there's an experience section that can be expanded
  const addBtns = await page.evaluate(() => {
    const results: string[] = [];
    document.querySelectorAll("button, a").forEach(el => {
      const text = (el as HTMLElement).innerText?.trim() || "";
      if (text === "Add experience" || text === "Add position" || text.includes("Add a position")) {
        results.push(`[${el.tagName}] text="${text}" aria="${el.getAttribute('aria-label') || ''}"`);
      }
    });
    return results;
  });
  console.log("\n  'Add' buttons:", addBtns);
}

async function main() {
  await initBrowser();
  const page = getPage();
  console.log("Logged in.");

  // Just test the first one to see how the inline edit works
  await addPositionInline(page, 0, "Backend Lead & AI Architect", "CompliAI", "Test");

  console.log("\nDone.");
  process.exit(0);
}

main().catch(e => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
