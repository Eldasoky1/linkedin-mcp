import { initBrowser, getPage } from "../src/browser.js";
import { Page } from "playwright";

async function addPosition(
  page: Page,
  title: string,
  company: string,
  description: string,
  startMonth: string,
  startYear: string
) {
  console.log(`\n--- Adding: ${title} @ ${company} ---`);

  // Step 1: Go to edit intro page
  await page.goto(
    "https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/edit/intro/",
    { waitUntil: "domcontentloaded", timeout: 30000 }
  );
  await page.waitForTimeout(4000);

  // Step 2: Click "Add new position" 
  await page.click("a:has-text('Add new position')");
  await page.waitForTimeout(3000);
  console.log("  [OK] At position form");

  // Step 3: Fill form fields
  const titleInput = page.locator("input[placeholder*='Ex:']").first();
  await titleInput.waitFor({ state: "visible", timeout: 15000 });
  await titleInput.fill(title);

  const companyInput = page.locator("input[placeholder*='Ex: Microsoft']").first();
  await companyInput.waitFor({ state: "visible", timeout: 10000 });
  await companyInput.fill(company);
  await page.waitForTimeout(1500);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1000);
  console.log("  [OK] Company filled");

  // Fill Start Date - Month
  const monthSelect = page.locator("select").filter({ hasText: "Month" }).first();
  await monthSelect.waitFor({ state: "visible", timeout: 10000 });
  await monthSelect.selectOption({ label: startMonth });
  console.log(`  [OK] Start month: ${startMonth}`);

  // Fill Start Date - Year
  const yearSelect = page.locator("select").filter({ hasText: "Year" }).first();
  await yearSelect.waitFor({ state: "visible", timeout: 10000 });
  await yearSelect.selectOption({ label: startYear });
  console.log(`  [OK] Start year: ${startYear}`);

  // Description
  const editor = page.locator("div.tiptap.ProseMirror").first();
  await editor.waitFor({ state: "visible", timeout: 10000 });
  await editor.click();
  await page.keyboard.press("Control+a");
  await page.keyboard.press("Delete");
  await page.waitForTimeout(300);
  await page.keyboard.type(description, { delay: 2 });
  console.log("  [OK] Description filled");

  // Step 4: Click Save
  const saveBtn = page.locator("button:has-text('Save')").first();
  await saveBtn.waitFor({ state: "visible", timeout: 10000 });
  await saveBtn.click({ timeout: 15000 });
  await page.waitForTimeout(3000);
  console.log("  [OK] Save clicked");

  // Step 5: Navigate back to edit intro
  await page.goto(
    "https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/edit/intro/",
    { waitUntil: "domcontentloaded" }
  );
  await page.waitForTimeout(4000);

  // Step 6: Check dropdown for new position
  const dropdownOptions = await page.evaluate(() => {
    const selects = document.querySelectorAll("select");
    for (const s of Array.from(selects)) {
      const options = Array.from(s.querySelectorAll("option"));
      const texts = options.map(o => o.textContent?.trim()).filter(Boolean);
      if (texts.length > 1 && !texts.every(t => /^\d{4}$|Month|Year|Please/.test(t || ""))) {
        return texts;
      }
    }
    return [];
  });
  console.log("  Dropdown options:", dropdownOptions);

  // Step 7: Select the new position if it exists
  let selected = false;
  for (const opt of dropdownOptions) {
    if (opt?.includes(title) || opt?.includes(company)) {
      const allSelects = page.locator("select");
      const count = await allSelects.count();
      for (let i = 0; i < count; i++) {
        const s = allSelects.nth(i);
        const text = await s.evaluate(el => Array.from(el.querySelectorAll("option")).map(o => o.textContent?.trim()));
        if (text.some(t => t?.includes(title) || t?.includes(company))) {
          await s.selectOption({ label: opt });
          selected = true;
          console.log(`  [OK] Selected position: ${opt}`);
          break;
        }
      }
      break;
    }
  }
  if (!selected) console.log("  [!] Position not found in dropdown");

  // Step 8: Click main Save
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
        text.includes("Systems Developer")
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
  console.log("Logged in.");

  const experiences = [
    { title: "Backend Lead & AI Architect", company: "CompliAI", month: "March", year: "2024",
      desc: `Designed and own the full backend architecture for CompliAI — a B2B SaaS platform that automates EU AI Act compliance risk scoring for enterprise clients, processing complex regulatory documents through a multi-layer AI inference pipeline.\n\nArchitected the end-to-end system connecting a React frontend, PostgreSQL persistence layer, and GPT-4o inference engine via asynchronous FastAPI endpoints with strict Pydantic validation at every boundary.\n\nEngineered NLP pipeline orchestration wrappers that normalize unstructured regulatory document input into structured risk-scoring payloads, eliminating manual compliance review overhead.\n\nOrchestrated a 7-engineer cross-functional team across backend, frontend, database, AI research, and hardware tracks — running sprint planning cycles, architectural reviews, and structured code reviews.\n\nDesigned the database schema for EU AI Act rule representation and compliance rule seeding, ensuring referential integrity and clean separation between regulation data and client assessment state.` },
    { title: "Backend Developer", company: "AI-Powered CRM Pipeline & Lead Enrichment", month: "January", year: "2025",
      desc: `Built a production-grade automation system that transforms unstructured web metadata into structured, enriched CRM lead records — eliminating the manual extraction and normalization layer entirely.\n\nImplemented a scalable Node.js and Puppeteer microservice to navigate multi-page targets and extract raw metadata at volume, with resilient error handling across dynamic DOM structures.\n\nIntegrated GPT-4o to parse and normalize unstructured scraped content into structured JSON records (names, roles, contact data), reducing normalization effort and eliminating field-mapping inconsistencies.\n\nArchitected a multi-tenant PostgreSQL schema on Supabase with Row Level Security (RLS) enforced at the database layer, ensuring strict tenant data isolation without application-level filtering overhead.\n\nDelivered a documented Express.js REST API with protected routing, structured error propagation, and comprehensive Jest test coverage across scraping, normalization, and data persistence layers.` },
    { title: "Systems Developer", company: "RC5 AVR Microcontroller Simulator", month: "August", year: "2025",
      desc: `Built a fully browser-based AVR microcontroller simulator that executes RC5 cipher logic implemented natively in Assembly — demonstrating hardware-software interface thinking without relying on any external runtime or simulation library.\n\nImplemented the RC5 symmetric cipher algorithm directly in AVR Assembly on ATmega328P, with register allocation, memory addressing, and branching logic designed to match real hardware execution constraints.\n\nDesigned a custom JavaScript interpreter to execute AVR Assembly instructions in-browser, enabling live register state inspection, SRAM visualization, and I/O port tracking with zero backend dependency.\n\nArchitected the simulator UI as a single-file, zero-dependency frontend — a deliberate engineering constraint that required precise DOM management and enforced performance discipline throughout.\n\nEliminated the need for physical hardware or toolchain setup, making low-level AVR debugging and cipher verification accessible directly in a browser for educational and demonstration contexts.` },
    { title: "Backend Developer", company: "LinkedIn MCP Server (Personal Project)", month: "December", year: "2025",
      desc: `Built a Model Context Protocol (MCP) server that enables AI assistants to interact with LinkedIn programmatically — automating profile editing, feed posting, messaging, and data extraction via Playwright-powered browser automation.\n\nArchitected the full server in TypeScript using the MCP SDK with Zod schema validation, providing strongly-typed tool definitions for all LinkedIn interactions.\n\nEngineered a stealth browser automation layer using Playwright with session recovery, CAPTCHA detection, and cookie persistence to maintain reliable authenticated sessions.\n\nDesigned a comprehensive tool suite covering profile read/write (headline, about, experience), feed interaction (read posts, create posts with dry-run safety), messaging, connections browsing, and job search.\n\nImplemented dry-run mode across all write operations to allow verification of DOM selectors and form filling without publishing changes to the live profile or network.` },
  ];

  for (const exp of experiences) {
    await addPosition(page, exp.title, exp.company, exp.month, exp.year, exp.desc);
  }

  await verifyProfile(page);
  process.exit(0);
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
