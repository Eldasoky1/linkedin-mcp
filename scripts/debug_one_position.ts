import { initBrowser, getPage } from "../src/browser.js";

async function main() {
  await initBrowser();
  const page = getPage();

  // Step 1: Go to edit intro
  await page.goto(
    "https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/edit/intro/",
    { waitUntil: "domcontentloaded", timeout: 30000 }
  );
  await page.waitForTimeout(4000);
  console.log("1. Edit intro loaded");

  // Check initial state for "Current position" section
  const beforeAdd = await page.evaluate(() => {
    const text = document.body.innerText || "";
    const posIndex = text.indexOf("Current position");
    if (posIndex >= 0) {
      return text.substring(posIndex, posIndex + 500);
    }
    return "Current position section not found";
  });
  console.log("Before add:\n", beforeAdd);

  // Step 2: Click Add new position
  await page.click("a:has-text('Add new position')");
  await page.waitForTimeout(3000);
  console.log("\n2. Clicked Add new position, URL:", page.url());

  // Step 3: Fill the form
  const titleInput = page.locator("input[placeholder*='Ex:' i]").first();
  await titleInput.waitFor({ state: "visible", timeout: 15000 });
  await titleInput.fill("Backend Lead & AI Architect");

  const companyInput = page.locator("input[placeholder*='Ex: Microsoft' i]").first();
  await companyInput.waitFor({ state: "visible", timeout: 10000 });
  await companyInput.fill("CompliAI");
  await page.waitForTimeout(1500);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1000);

  const editor = page.locator("div.tiptap.ProseMirror").first();
  await editor.waitFor({ state: "visible", timeout: 10000 });
  await editor.click();
  await page.keyboard.press("Control+a");
  await page.keyboard.press("Delete");
  await page.waitForTimeout(300);
  await page.keyboard.type("Test position description", { delay: 5 });
  console.log("3. Form filled");

  // Check for save button
  const saveBtn = page.locator("button:has-text('Save')").first();
  console.log("   Save button visible:", await saveBtn.isVisible().catch(() => false));
  console.log("   Save button enabled:", await saveBtn.isEnabled().catch(() => false));

  // Check for any other interactive elements nearby
  const allButtons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("button"))
      .filter(b => b.getBoundingClientRect().width > 0 && b.offsetParent !== null)
      .map(b => ({
        text: b.innerText?.trim().substring(0, 30),
        aria: b.getAttribute("aria-label") || "",
        zIndex: getComputedStyle(b).zIndex,
        position: getComputedStyle(b).position,
      }));
  });
  console.log("   All visible buttons:");
  for (const b of allButtons) {
    console.log(`     "${b.text}" aria="${b.aria}" zIdx=${b.zIndex} pos=${b.position}`);
  }

  // Step 4: Click Save
  await saveBtn.click({ timeout: 15000 });
  console.log("4. Save clicked");

  // Wait and check the page state
  await page.waitForTimeout(5000);
  console.log("   URL after save:", page.url());

  // Check for success/error
  const afterSave = await page.evaluate(() => {
    const text = document.body.innerText || "";
    return {
      hasSuccess: text.includes("success") || text.includes("Success") || text.includes("saved") || text.includes("Saved"),
      hasError: text.includes("error") || text.includes("Error") || text.includes("failed") || text.includes("Failed"),
      currentPosSection: text.includes("Current position") ? text.substring(text.indexOf("Current position"), text.indexOf("Current position") + 500) : "Not found",
      nearSave: text.substring(Math.max(0, text.lastIndexOf("Save") - 100), text.lastIndexOf("Save") + 100),
    };
  });
  console.log("   Has success msg:", afterSave.hasSuccess);
  console.log("   Has error msg:", afterSave.hasError);
  console.log("   Current position section:", afterSave.currentPosSection?.substring(0, 300));

  // Step 5: Try clicking Dismiss if available
  const dismissBtn = page.locator("button[aria-label='Dismiss']").first();
  const dismissVisible = await dismissBtn.isVisible().catch(() => false);
  if (dismissVisible) {
    console.log("5. Dismiss button found, clicking...");
    await dismissBtn.click();
    await page.waitForTimeout(3000);
    console.log("   URL after dismiss:", page.url());
  }

  // Step 6: Try clicking the main Save
  const mainSave = page.locator("button:has-text('Save')").first();
  const mainSaveVisible = await mainSave.isVisible().catch(() => false);
  console.log("6. Main Save visible:", mainSaveVisible);
  if (mainSaveVisible) {
    await mainSave.click({ timeout: 10000, force: true });
    await page.waitForTimeout(3000);
    console.log("   Main Save clicked, URL:", page.url());
  }

  // Step 7: Check the profile page
  await page.goto("https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4000);
  const profileText = await page.evaluate(() => {
    const text = document.body.innerText || "";
    const lines = text.split("\n").filter(l => l.includes("CompliAI") || l.includes("Backend Lead"));
    return lines.slice(0, 10);
  });
  console.log("\n7. Profile verification:");
  for (const l of profileText) {
    console.log(`   "${l.substring(0, 150)}"`);
  }

  process.exit(0);
}

main().catch(e => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
