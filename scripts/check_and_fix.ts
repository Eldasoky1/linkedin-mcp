import { initBrowser, getPage } from "../src/browser.js";
import { Page } from "playwright";

async function verifyProfile(page: Page) {
  await page.goto(
    "https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/",
    { waitUntil: "domcontentloaded" }
  );
  await page.waitForTimeout(5000);

  // Just dump all text containing known keywords
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
    return results;
  });

  console.log("Experience entries found on profile:");
  if (relevant.length === 0) {
    console.log("  NONE FOUND");
  } else {
    for (const r of relevant) {
      console.log(`  "${r.substring(0, 200)}"`);
    }
  }
}

async function addSingleExperience(
  page: Page,
  title: string,
  company: string,
  description: string
) {
  console.log(`\n--- Adding: ${title} @ ${company} ---`);

  await page.goto(
    "https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/edit/intro/",
    { waitUntil: "domcontentloaded", timeout: 30000 }
  );
  await page.waitForTimeout(3000);

  const addPosition = page.locator("a:has-text('Add new position')").first();
  await addPosition.waitFor({ state: "visible", timeout: 10000 });
  await addPosition.click();
  await page.waitForTimeout(3000);
  console.log("  URL:", page.url());

  // Fill form
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

  // Click Save and wait for navigation back to intro page
  const saveBtn = page.locator("button:has-text('Save')").first();
  await saveBtn.waitFor({ state: "visible", timeout: 10000 });
  await saveBtn.click({ timeout: 15000 });
  console.log("  [OK] Save clicked");

  // Wait for redirect back to intro page
  await page.waitForTimeout(5000);
  console.log("  After save URL:", page.url());
}

const MCP_DESC = `Built a Model Context Protocol (MCP) server that enables AI assistants to interact with LinkedIn programmatically — automating profile editing, feed posting, messaging, and data extraction via Playwright-powered browser automation.

Architected the full server in TypeScript using the MCP SDK with Zod schema validation, providing strongly-typed tool definitions for all LinkedIn interactions.

Engineered a stealth browser automation layer using Playwright with session recovery, CAPTCHA detection, and cookie persistence to maintain reliable authenticated sessions.

Designed a comprehensive tool suite covering profile read/write (headline, about, experience), feed interaction (read posts, create posts with dry-run safety), messaging, connections browsing, and job search.

Implemented dry-run mode across all write operations to allow verification of DOM selectors and form filling without publishing changes to the live profile or network.`;

async function main() {
  await initBrowser();
  const page = getPage();

  // First verify current state
  await verifyProfile(page);

  // Add remaining entries
  await addSingleExperience(page, "Systems Developer", "RC5 AVR Microcontroller Simulator",
    `Built a fully browser-based AVR microcontroller simulator that executes RC5 cipher logic implemented natively in Assembly — demonstrating hardware-software interface thinking without relying on any external runtime or simulation library.

Implemented the RC5 symmetric cipher algorithm directly in AVR Assembly on ATmega328P, with register allocation, memory addressing, and branching logic designed to match real hardware execution constraints.

Designed a custom JavaScript interpreter to execute AVR Assembly instructions in-browser, enabling live register state inspection, SRAM visualization, and I/O port tracking with zero backend dependency.

Architected the simulator UI as a single-file, zero-dependency frontend — a deliberate engineering constraint that required precise DOM management and enforced performance discipline throughout.

Eliminated the need for physical hardware or toolchain setup, making low-level AVR debugging and cipher verification accessible directly in a browser for educational and demonstration contexts.`
  );

  await addSingleExperience(page, "Backend Developer", "LinkedIn MCP Server (Personal Project)", MCP_DESC);

  // Verify again
  console.log("\n=== FINAL VERIFICATION ===");
  await verifyProfile(page);

  process.exit(0);
}

main().catch(e => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
