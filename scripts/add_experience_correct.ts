import { initBrowser, getPage } from "../src/browser.js";
import { Page } from "playwright";

async function fillPositionForm(
  page: Page,
  title: string,
  company: string,
  description: string
) {
  // Title field
  const titleInput = page.locator("input[placeholder*='Ex:' i]").first();
  await titleInput.waitFor({ state: "visible", timeout: 10000 });
  await titleInput.fill(title);
  console.log("  [OK] Title filled");

  // Company field
  const companyInput = page.locator("input[placeholder*='Ex: Microsoft' i]").first();
  await companyInput.waitFor({ state: "visible", timeout: 10000 });
  await companyInput.fill(company);
  await page.waitForTimeout(1500);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1000);
  console.log("  [OK] Company filled");

  // Description - ProseMirror editor
  const editor = page.locator("div.tiptap.ProseMirror").first();
  await editor.waitFor({ state: "visible", timeout: 10000 });
  await editor.click();
  await page.keyboard.press("Control+a");
  await page.keyboard.press("Delete");
  await page.waitForTimeout(300);
  await page.keyboard.type(description, { delay: 2 });
  console.log("  [OK] Description typed");
}

const COMPLIAI_DESC = `Designed and own the full backend architecture for CompliAI — a B2B SaaS platform that automates EU AI Act compliance risk scoring for enterprise clients, processing complex regulatory documents through a multi-layer AI inference pipeline.

Architected the end-to-end system connecting a React frontend, PostgreSQL persistence layer, and GPT-4o inference engine via asynchronous FastAPI endpoints with strict Pydantic validation at every boundary.

Engineered NLP pipeline orchestration wrappers that normalize unstructured regulatory document input into structured risk-scoring payloads, eliminating manual compliance review overhead.

Orchestrated a 7-engineer cross-functional team across backend, frontend, database, AI research, and hardware tracks — running sprint planning cycles, architectural reviews, and structured code reviews.

Designed the database schema for EU AI Act rule representation and compliance rule seeding, ensuring referential integrity and clean separation between regulation data and client assessment state.`;

const CRM_DESC = `Built a production-grade automation system that transforms unstructured web metadata into structured, enriched CRM lead records — eliminating the manual extraction and normalization layer entirely.

Implemented a scalable Node.js and Puppeteer microservice to navigate multi-page targets and extract raw metadata at volume, with resilient error handling across dynamic DOM structures.

Integrated GPT-4o to parse and normalize unstructured scraped content into structured JSON records (names, roles, contact data), reducing normalization effort and eliminating field-mapping inconsistencies.

Architected a multi-tenant PostgreSQL schema on Supabase with Row Level Security (RLS) enforced at the database layer, ensuring strict tenant data isolation without application-level filtering overhead.

Delivered a documented Express.js REST API with protected routing, structured error propagation, and comprehensive Jest test coverage across scraping, normalization, and data persistence layers.`;

const AVR_DESC = `Built a fully browser-based AVR microcontroller simulator that executes RC5 cipher logic implemented natively in Assembly — demonstrating hardware-software interface thinking without relying on any external runtime or simulation library.

Implemented the RC5 symmetric cipher algorithm directly in AVR Assembly on ATmega328P, with register allocation, memory addressing, and branching logic designed to match real hardware execution constraints.

Designed a custom JavaScript interpreter to execute AVR Assembly instructions in-browser, enabling live register state inspection, SRAM visualization, and I/O port tracking with zero backend dependency.

Architected the simulator UI as a single-file, zero-dependency frontend — a deliberate engineering constraint that required precise DOM management and enforced performance discipline throughout.

Eliminated the need for physical hardware or toolchain setup, making low-level AVR debugging and cipher verification accessible directly in a browser for educational and demonstration contexts.`;

const MCP_DESC = `Built a Model Context Protocol (MCP) server that enables AI assistants to interact with LinkedIn programmatically — automating profile editing, feed posting, messaging, and data extraction via Playwright-powered browser automation.

Architected the full server in TypeScript using the MCP SDK with Zod schema validation, providing strongly-typed tool definitions for all LinkedIn interactions.

Engineered a stealth browser automation layer using Playwright with session recovery, CAPTCHA detection, and cookie persistence to maintain reliable authenticated sessions.

Designed a comprehensive tool suite covering profile read/write (headline, about, experience), feed interaction (read posts, create posts with dry-run safety), messaging, connections browsing, and job search.

Implemented dry-run mode across all write operations to allow verification of DOM selectors and form filling without publishing changes to the live profile or network.`;

async function addExperienceViaIntro(
  page: Page,
  title: string,
  company: string,
  description: string
) {
  console.log(`\n--- Adding: ${title} @ ${company} ---`);

  // Go to edit intro page
  await page.goto(
    "https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/edit/intro/",
    { waitUntil: "domcontentloaded" }
  );
  await page.waitForTimeout(3000);

  // Click "Add new position"
  const addPosition = page
    .locator("a:has-text('Add new position')")
    .first();
  await addPosition.waitFor({ state: "visible", timeout: 10000 });
  await addPosition.click();
  console.log("  [OK] Clicked Add new position");
  await page.waitForTimeout(3000);

  // Wait for position form to load (might open in same page or new dialog)
  const currentUrl = page.url();
  console.log("  URL after click:", currentUrl);

  // Check if we're on the position form page or still on intro
  if (currentUrl.includes("position/new")) {
    // We navigated to the position form page
    await page.waitForTimeout(2000);
    await fillPositionForm(page, title, company, description);

    // Click the Save button on the position form
    const saveBtn = page.locator("button:has-text('Save')").first();
    await saveBtn.waitFor({ state: "visible", timeout: 10000 });
    await saveBtn.click({ timeout: 10000 });
    console.log("  [OK] Save clicked on position form");
    await page.waitForTimeout(4000);
  } else {
    // Form might be embedded in a dialog on the intro page
    await page.waitForTimeout(2000);
    await fillPositionForm(page, title, company, description);

    // Click Save inside dialog
    const saveBtn = page.locator("button:has-text('Save')").first();
    await saveBtn.waitFor({ state: "visible", timeout: 10000 });
    await saveBtn.click({ timeout: 10000 });
    console.log("  [OK] Save clicked in dialog");
    await page.waitForTimeout(3000);

    // After dialog closes, click the main Save on edit intro page
    const mainSave = page.locator("button:has-text('Save')").first();
    const mainSaveVisible = await mainSave.isVisible().catch(() => false);
    if (mainSaveVisible) {
      await mainSave.click({ timeout: 10000 });
      console.log("  [OK] Main Save clicked");
      await page.waitForTimeout(3000);
    }
  }
}

async function main() {
  console.log("Adding Experience Entries (Correct Flow)");
  console.log("=".repeat(50));

  await initBrowser();
  const page = getPage();
  console.log("Logged in.");

  const experiences = [
    { title: "Backend Lead & AI Architect", company: "CompliAI", desc: COMPLIAI_DESC },
    { title: "Backend Developer", company: "AI-Powered CRM Pipeline & Lead Enrichment", desc: CRM_DESC },
    { title: "Systems Developer", company: "RC5 AVR Microcontroller Simulator", desc: AVR_DESC },
    { title: "Backend Developer", company: "LinkedIn MCP Server (Personal Project)", desc: MCP_DESC },
  ];

  for (const exp of experiences) {
    await addExperienceViaIntro(page, exp.title, exp.company, exp.desc);
  }

  console.log("\n" + "=".repeat(50));
  console.log("All experience entries added!");
  process.exit(0);
}

main().catch(e => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
