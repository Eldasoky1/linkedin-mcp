import { initBrowser, getPage } from "../src/browser.js";

async function main() {
  await initBrowser();
  const page = getPage();

  await page.goto("https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/", {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(5000);

  // Click "Edit profile"
  const editProfile = page.locator("a[aria-label='Edit profile'], button[aria-label='Edit profile']").first();
  const editVisible = await editProfile.isVisible().catch(() => false);
  console.log("Edit profile link visible:", editVisible);

  if (editVisible) {
    await editProfile.click();
    console.log("Clicked Edit profile");
    await page.waitForTimeout(3000);

    await page.screenshot({ path: "edit_mode.png", fullPage: false }).catch(() => {});
    console.log("Screenshot saved");

    // Now look for the headline field or pencil icons near headline area
    const allEditButtons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("button, [role='button'], a"))
        .map((b) => ({
          text: (b as HTMLElement).innerText?.trim().substring(0, 80),
          ariaLabel: b.getAttribute("aria-label") || "",
          tag: b.tagName,
        }))
        .filter((b) => {
          const t = (b.text + " " + b.ariaLabel).toLowerCase();
          return t.includes("edit") || t.includes("pencil") || t.includes("headline");
        });
    });
    console.log("\nEdit-related elements after clicking Edit profile:");
    for (const b of allEditButtons) {
      console.log(`  [${b.tag}] text="${b.text}" aria="${b.ariaLabel}"`);
    }

    // Maybe headline is in a section that needs to be clicked
    const sectionWithHeadline = await page.evaluate(() => {
      const all = document.querySelectorAll("*");
      for (const el of all) {
        const text = (el as HTMLElement).innerText?.trim() || "";
        if (
          text.length > 5 &&
          text.length < 250 &&
          text.includes("Student") === false &&
          text.includes("Backend") === false &&
          text.includes("Software") === false
        ) {
          // Try to match typical headline content
        }
      }
      return "not found";
    });

    // Wait for edits to load and check inputs
    const inputs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("input[type='text'], textarea, [contenteditable='true']"))
        .filter(el => el.getBoundingClientRect().width > 0)
        .map(el => ({
          tag: el.tagName,
          value: ((el as HTMLInputElement).value || (el as HTMLElement).innerText || "").substring(0, 80),
          placeholder: (el as HTMLInputElement).placeholder || "",
          ariaLabel: el.getAttribute("aria-label") || "",
          id: el.id || "",
          className: el.className?.toString().substring(0, 50) || "",
        }));
    });
    console.log("\nVisible inputs after edit:");
    for (const inp of inputs) {
      console.log(`  [${inp.tag}] id="${inp.id}" value="${inp.value}" placeholder="${inp.placeholder}" aria="${inp.ariaLabel}"`);
    }
  }

  process.exit(0);
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
