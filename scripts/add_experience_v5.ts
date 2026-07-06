import { initBrowser, getPage } from "../src/browser.js";
import { Page } from "playwright";

async function addPosition(
  page: Page,
  title: string,
  company: string,
  description: string
) {
  console.log(`\n--- Adding: ${title} @ ${company} ---`);

  // Step 1: Go to edit intro page (this opens a dialog)
  await page.goto(
    "https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/edit/intro/",
    { waitUntil: "domcontentloaded", timeout: 30000 }
  );
  await page.waitForTimeout(4000);

  // Step 2: Click "Add new position" → navigates to position form
  await page.click("a:has-text('Add new position')");
  await page.waitForTimeout(3000);
  console.log("  [OK] At position form");

  // Step 3: Fill form
  const titleInput = page.locator("input[placeholder*='Ex:' i]").first();
  await titleInput.waitFor({ state: "visible", timeout: 15000 });
  await titleInput.fill(title);

  const companyInput = page.locator("input[placeholder*='Ex: Microsoft' i]").first();
  await companyInput.waitFor({ state: "visible", timeout: 10000 });
  await companyInput.fill(company);
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
  await page.keyboard.type(description, { delay: 2 });
  console.log("  [OK] Form filled");

  // Step 4: Click Save and WAIT for the redirect back to edit intro
  const saveBtn = page.locator("button:has-text('Save')").first();
  await saveBtn.waitFor({ state: "visible", timeout: 10000 });

  // Use Promise.all to wait for both click and navigation
  try {
    await Promise.all([
      page.waitForURL("**/edit/intro/**", { timeout: 30000 }),
      saveBtn.click({ timeout: 15000 }),
    ]);
    console.log("  [OK] Save clicked and redirected to edit intro");
  } catch {
    // If no redirect happens, try clicking save again and then navigate manually
    console.log("  [!] No redirect after save, navigating back manually");
    const currentUrl = page.url();
    await saveBtn.click({ timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(3000);
    await page.goto(
      "https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/edit/intro/",
      { waitUntil: "domcontentloaded" }
    );
    await page.waitForTimeout(4000);
  }

  // Step 5: Check if the position is now in the dropdown
  const positionInDropdown = await page.evaluate(() => {
    const select = document.querySelector("select[id]");
    if (!select) return "No select found";
    const options = Array.from(select.querySelectorAll("option"));
    return options.map(o => o.textContent?.trim()).filter(Boolean);
  });
  console.log("  Positions in dropdown:", positionInDropdown);

  // Step 6: Select the new position from the dropdown
  if (Array.isArray(positionInDropdown)) {
    for (const opt of positionInDropdown) {
      if (opt?.includes(title) || opt?.includes(company)) {
        await page.selectOption("select[id]", { label: opt });
        console.log(`  [OK] Selected position: ${opt}`);
        break;
      }
    }
  }

  // Step 7: Click the main Save on the dialog
  const mainSave = page.locator("button:has-text('Save')").first();
  await mainSave.waitFor({ state: "visible", timeout: 10000 });
  await mainSave.click({ timeout: 10000, force: true });
  await page.waitForTimeout(3000);
  console.log("  [OK] Main Save clicked");
}

async function verifyProfile(page: Page) {
  await page.goto(
    "https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/",
    { waitUntil: "domcontentloaded" }
  );
  await page.waitForTimeout(5000);

  const relevant = await page.evaluate(() => {
    const results: string[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const text = node.textContent?.trim() || "";
      if (
        text.includes("CompliAI") ||
        text.includes("CRM Pipeline") ||
        text.includes("AVR") ||
        text.includes("LinkedIn MCP") ||
        text.includes("Backend Lead") ||
        text.includes("Systems Developer") ||
        text.includes("Lead Enrichment")
      ) {
        results.push(text);
      }
    }
    return [...new Set(results)];
  });

  console.log("\n=== PROFILE VERIFICATION ===");
  for (const r of relevant) {
    console.log(`  "${r.substring(0, 200)}"`);
  }
  if (relevant.length === 0) {
    console.log("  NO experience entries found");
  }
}

async function main() {
  await initBrowser();
  const page = getPage();

  const experiences = [
    {
      title: "Backend Lead & AI Architect",
      company: "CompliAI",
      desc: `Designed and own the full backend architecture for CompliAI - a B2B SaaS platform that automates EU AI Act compliance risk scoring for enterprise clients.`,
    },
    {
      title: "Backend Developer",
      company: "AI-Powered CRM Pipeline & Lead Enrichment",
      desc: `Built a production-grade automation system that transforms unstructured web metadata into structured CRM lead records.`,
    },
    {
      title: "Systems Developer",
      company: "RC5 AVR Microcontroller Simulator",
      desc: `Built a fully browser-based AVR microcontroller simulator that executes RC5 cipher logic in Assembly.`,
    },
    {
      title: "Backend Developer",
      company: "LinkedIn MCP Server (Personal Project)",
      desc: `Built a Model Context Protocol server enabling AI assistants to interact with LinkedIn programmatically.`,
    },
  ];

  for (const exp of experiences) {
    await addPosition(page, exp.title, exp.company, exp.desc);
  }

  await verifyProfile(page);
  process.exit(0);
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
