import { initBrowser, getPage } from "../src/browser.js";

async function runTests() {
  console.log("Initializing browser...");
  await initBrowser();
  const page = getPage();
  console.log("Current URL after init:", page.url());
  await page.screenshot({ path: "screenshots/initial.png", fullPage: true });

  console.log("\n=== Testing edit_headline & update_profile (Headline) ===");
  try {
    await page.goto("https://www.linkedin.com/in/me/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000); // wait for redirect
    console.log("URL after /in/me/:", page.url());
    console.log("Title:", await page.title());
    
    // Test edit intro
    console.log("Clicking Edit intro...");
    await page.locator("button[aria-label^='Edit intro']").first().click();
    await page.waitForSelector("div[role='dialog']", { timeout: 10000 });

    const headlineInput = page.locator("textarea[id*='headline'], input[id*='headline']").first();
    await headlineInput.fill("Automated Headline Dry Run");
    console.log("Filled headline.");

    // MOCK SAVE
    const saveBtn = page.locator("button.artdeco-button--primary:has-text('Save')").first();
    console.log("Found Save button (NOT clicking):", await saveBtn.isVisible());
    
    // Close dialog to proceed
    const dismissBtn = page.locator("button[aria-label='Dismiss']").first();
    if (await dismissBtn.isVisible()) {
        await dismissBtn.click();
        const discardBtn = page.locator("button[data-control-name='confirm_discard_changes'], button.artdeco-modal__confirm-dialog-btn:has-text('Discard')").first();
        if (await discardBtn.isVisible()) {
            await discardBtn.click();
        }
    }
    console.log("edit_headline passed.\n");
  } catch (e: any) {
    console.error("edit_headline failed:", e);
  }

  // update_profile (About)
  console.log("=== Testing update_profile (About) ===");
  try {
    const aboutEditBtn = page.locator("button[aria-label*='Edit about'], button[aria-label*='Edit summary']").first();
    const hasAbout = await aboutEditBtn.isVisible();
    if (hasAbout) {
      await aboutEditBtn.scrollIntoViewIfNeeded();
      await aboutEditBtn.click();

      await page.waitForSelector("div[role='dialog']", { timeout: 10000 });

      const aboutInput = page.locator("textarea[name*='summary'], textarea[id*='summary']").first();
      await aboutInput.fill("Automated About Dry Run");
      console.log("Filled About section.");

      // MOCK SAVE
      const saveBtn = page.locator("button.artdeco-button--primary:has-text('Save')").first();
      console.log("Found Save button (NOT clicking):", await saveBtn.isVisible());

      // Close dialog to proceed
      const dismissBtn = page.locator("button[aria-label='Dismiss']").first();
      if (await dismissBtn.isVisible()) {
          await dismissBtn.click();
          const discardBtn = page.locator("button[data-control-name='confirm_discard_changes'], button.artdeco-modal__confirm-dialog-btn:has-text('Discard')").first();
          if (await discardBtn.isVisible()) {
              await discardBtn.click();
          }
      }
      console.log("update_profile (About) passed.\n");
    } else {
      console.log("About edit button not found. Assuming section does not exist yet.");
    }
  } catch (e: any) {
    console.error("update_profile (About) failed:", e);
  }

  console.log("=== Testing update_experience ===");
  try {
    await page.goto("https://www.linkedin.com/in/me/edit/forms/position/new/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("div[role='dialog'], form", { timeout: 15000 });

    await page.locator("input[id*='title'], input[name*='title']").filter({ visible: true }).first().fill("Software Engineer (Dry Run)");
    
    await page.locator("input[id*='company'], input[name*='company']").filter({ visible: true }).first().fill("OpenAI");
    await page.waitForTimeout(500);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");

    await page.locator("textarea[id*='description'], textarea[name*='description']").filter({ visible: true }).first().fill("Built cool stuff");
    console.log("Filled Experience fields.");

    // MOCK SAVE
    const saveBtn = page.locator("button.artdeco-button--primary:has-text('Save')").first();
    console.log("Found Save button (NOT clicking):", await saveBtn.isVisible());
    
    console.log("update_experience passed.\n");
  } catch (e: any) {
    console.error("update_experience failed:", e);
  }

  console.log("=== Testing create_post ===");
  try {
    await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded" });

    const startPostBtn = page.locator("button.artdeco-button--tertiary:has-text('Start a post')").first().or(page.locator("button.share-box-feed-entry__trigger")).first();
    await startPostBtn.click();
    
    await page.waitForSelector("div[role='dialog']", { timeout: 10000 });

    const editor = page.locator("div.ql-editor[contenteditable='true']").first();
    await editor.fill("This is a dry run post created by automated script. Should not be published.");
    console.log("Filled Post content.");

    // MOCK POST
    const postBtn = page.locator("button.share-actions__primary-action").filter({ hasText: 'Post' }).first();
    console.log("Found Post button (NOT clicking):", await postBtn.isVisible());
    
    // Close dialog
    const dismissBtn = page.locator("button[aria-label='Dismiss']").first();
    if (await dismissBtn.isVisible()) {
        await dismissBtn.click();
    }
    console.log("create_post passed.\n");
  } catch (e: any) {
    console.error("create_post failed:", e);
  }

  console.log("All verifications done. Exiting.");
  process.exit(0);
}

runTests();
