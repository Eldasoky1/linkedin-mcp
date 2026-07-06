import { initBrowser, getPage } from "../src/browser.js";

async function main() {
  await initBrowser();
  const page = getPage();

  // Listen for console messages
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.log("  [CONSOLE ERROR]", msg.text());
    }
  });

  // Listen for dialog events
  page.on("dialog", (dialog) => {
    console.log("  [DIALOG]", dialog.message(), dialog.type());
    dialog.dismiss().catch(() => {});
  });

  // Capture network requests
  const failedRequests: string[] = [];
  page.on("requestfailed", (request) => {
    failedRequests.push(`${request.url()} - ${request.failure()?.errorText}`);
  });

  await page.goto(
    "https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/edit/forms/position/new/?profileFormEntryPoint=IntroForm",
    { waitUntil: "domcontentloaded", timeout: 30000 }
  );
  await page.waitForTimeout(5000);
  console.log("Position form loaded");

  // Fill form with minimal test data
  const titleInput = page.locator("input[placeholder*='Ex:' i]").first();
  await titleInput.waitFor({ state: "visible", timeout: 15000 });
  await titleInput.fill("Test Position Debug");

  const companyInput = page.locator("input[placeholder*='Ex: Microsoft' i]").first();
  await companyInput.waitFor({ state: "visible", timeout: 10000 });
  await companyInput.fill("Test Company Debug");
  await page.waitForTimeout(1500);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1000);

  const editor = page.locator("div.tiptap.ProseMirror").first();
  await editor.waitFor({ state: "visible", timeout: 10000 });
  await editor.click();
  await page.keyboard.type("Test description", { delay: 5 });
  console.log("Form filled");

  // Check if the Save button has any issues
  const saveBtn = page.locator("button:has-text('Save')").first();
  const isDisabled = await saveBtn.isDisabled().catch(() => false);
  const btnClasses = await saveBtn.getAttribute("class").catch(() => "");
  console.log("Save button disabled:", isDisabled);
  console.log("Save button class:", btnClasses?.substring(0, 100));

  // Click Save
  console.log("Clicking Save...");
  await saveBtn.click({ timeout: 15000 });
  await page.waitForTimeout(5000);

  // Check URL after save
  console.log("URL after save:", page.url());

  // Check for any visible error/success messages
  const messages = await page.evaluate(() => {
    const results: string[] = [];
    document.querySelectorAll("[role='alert'], [aria-live], .artdeco-toast, .feedback, [class*='error'], [class*='success']").forEach(el => {
      const text = (el as HTMLElement).innerText?.trim() || "";
      if (text) results.push(text.substring(0, 200));
    });
    return results;
  });
  console.log("Messages:", messages);

  // Check for any toasts
  const toast = await page.evaluate(() => {
    const all = document.querySelectorAll("*");
    for (const el of all) {
      if (el.textContent?.includes("saved") || el.textContent?.includes("added") || el.textContent?.includes("error") || el.textContent?.includes("Error")) {
        return el.textContent?.substring(0, 200);
      }
    }
    return null;
  });
  console.log("Toast text:", toast);

  // Log failed network requests
  console.log("\nFailed network requests:");
  for (const r of failedRequests) {
    console.log("  ", r);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
