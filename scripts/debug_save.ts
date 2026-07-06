import { initBrowser, getPage } from "../src/browser.js";

async function main() {
  await initBrowser();
  const page = getPage();

  await page.goto(
    "https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/edit/forms/position/new/?profileFormEntryPoint=IntroForm",
    { waitUntil: "domcontentloaded" }
  );
  await page.waitForTimeout(5000);

  // Fill form with simple data
  const titleInput = page.locator("input[placeholder*='Ex:' i]").first();
  await titleInput.waitFor({ state: "visible", timeout: 10000 });
  await titleInput.fill("Test Position Debug");
  console.log("Title filled");

  const companyInput = page.locator("input[placeholder*='Ex: Microsoft' i]").first();
  await companyInput.fill("Test Company Debug");
  await page.waitForTimeout(1500);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1000);
  console.log("Company filled");

  const editor = page.locator("div.tiptap.ProseMirror").first();
  await editor.waitFor({ state: "visible", timeout: 10000 });
  await editor.click();
  await page.keyboard.type("Debug entry description", { delay: 5 });
  console.log("Description filled");

  // Check what Save buttons exist
  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("button"))
      .filter(b => b.getBoundingClientRect().width > 0)
      .map(b => ({
        text: b.innerText?.trim().substring(0, 40),
        ariaLabel: b.getAttribute("aria-label") || "",
        disabled: b.hasAttribute("disabled"),
        className: b.className?.toString().substring(0, 40),
      }));
  });

  console.log("\nAll visible buttons:");
  for (const b of buttons) {
    console.log(`  "${b.text}" aria="${b.ariaLabel}" disabled=${b.disabled}`);
  }

  // Find and click Save
  const saveBtn = page.locator("button:has-text('Save')").first();
  console.log("\nSave button visible:", await saveBtn.isVisible().catch(() => false));
  console.log("Save button enabled:", await saveBtn.isEnabled().catch(() => false));

  // Listen for any dialog or error
  await saveBtn.click({ timeout: 10000 });
  console.log("Save clicked");
  await page.waitForTimeout(4000);

  // Check for errors or toasts
  const afterSave = await page.evaluate(() => {
    const results: string[] = [];
    // Check for error messages
    document.querySelectorAll("[role='alert'], [aria-live='polite'], .artdeco-toast, div[class*='error'], div[class*='alert']").forEach(el => {
      results.push(`[${el.tagName}] text="${(el as HTMLElement).innerText?.trim().substring(0, 100)}"`);
    });
    return results;
  });

  console.log("\nAfter save alerts/errors:");
  for (const a of afterSave) {
    console.log(`  ${a}`);
  }

  console.log("\nPage URL after save:", page.url());
  console.log("Page title:", await page.title());

  // Check page content for any success/error message
  const pageText = await page.evaluate(() => {
    const text = document.body.innerText || "";
    return text.substring(text.length - 500);
  });
  console.log("Last 500 chars of page:", pageText);

  process.exit(0);
}

main().catch(e => {
  console.error("Error:", e.message);
  process.exit(1);
});
