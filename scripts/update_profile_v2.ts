import { initBrowser, getPage } from "../src/browser.js";
import { Page } from "playwright";

async function clickSave(page: Page) {
  const saveBtn = page
    .locator(
      "button:has-text('Save'), " +
        "[role='button']:has-text('Save'), " +
        "button[type='submit']"
    )
    .first();
  await saveBtn.waitFor({ state: "visible", timeout: 10000 });
  await saveBtn.click({ timeout: 10000 });
  await page.waitForTimeout(3000);
  console.log("  [OK] Save clicked");
}

async function updateHeadline(page: Page) {
  console.log("\n--- Updating Headline ---");
  await page.goto(
    "https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/edit/intro/",
    { waitUntil: "domcontentloaded" }
  );
  await page.waitForTimeout(4000);

  // LinkedIn now uses TipTap/ProseMirror contenteditable div for headline
  // Find the ProseMirror div that's in the headline section
  const proseMirror = page.locator("div.tiptap.ProseMirror").first();
  await proseMirror.waitFor({ state: "visible", timeout: 10000 });
  await proseMirror.click();

  // Select all existing text and delete it
  await page.keyboard.press("Control+a");
  await page.keyboard.press("Delete");
  await page.waitForTimeout(500);

  // Type the new headline.
  // Option C modified: "Applied AI Engineer Who Ships Production Systems · Backend Architecture · LLM Pipelines · FastAPI · Node.js · Team Lead @ CompliAI · E-JUST CS"
  await page.keyboard.type(
    "Applied AI Engineer Who Ships Production Systems · Backend Architecture · LLM Pipelines · FastAPI · Node.js · Team Lead @ CompliAI · E-JUST CS",
    { delay: 5 }
  );
  console.log("  [OK] Headline typed in ProseMirror editor");
  await clickSave(page);
}

async function updateAbout(page: Page) {
  console.log("\n--- Updating About Section ---");
  await page.goto(
    "https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/edit/forms/summary/new/?profileFormEntryPoint=GUIDANCE_CARD",
    { waitUntil: "domcontentloaded" }
  );
  await page.waitForTimeout(4000);

  // About section also uses TipTap/ProseMirror
  const proseMirror = page.locator("div.tiptap.ProseMirror").first();
  await proseMirror.waitFor({ state: "visible", timeout: 10000 });
  await proseMirror.click();

  await page.keyboard.press("Control+a");
  await page.keyboard.press("Delete");
  await page.waitForTimeout(500);

  await page.keyboard.type(
    "I build backend systems where data stops being raw and starts being actionable. " +
      "As Backend Lead and AI Architect on CompliAI \u2014 a B2B SaaS platform automating EU AI Act compliance " +
      "\u2014 I design the full-stack infrastructure connecting React frontends, PostgreSQL schemas, and GPT-4o inference pipelines. " +
      "This isn't coursework. It ships.\n\n" +
      "E-JUST's rigorous CS curriculum gave me the foundations: embedded systems, operating systems, database internals, algorithms. " +
      "What I did next was take those first principles into production \u2014 leading a 7-engineer cross-functional team, " +
      "making architectural tradeoffs under real constraints, and owning the consequences of every design decision.\n\n" +
      "// Core Stack\n" +
      "FastAPI \u00b7 Node.js (Express) \u00b7 PostgreSQL \u00b7 Supabase \u00b7 GPT-4o \u00b7 PyTorch \u00b7 Puppeteer \u00b7 SQLAlchemy\n\n" +
      "// Domain Focus\n" +
      "Backend Architecture \u00b7 LLM Integration & Orchestration \u00b7 Automated Data Pipelines \u00b7 Applied Regulatory AI \u00b7 Low-Level Systems Engineering\n\n" +
      "I'm building toward the intersection of AI systems engineering and enterprise compliance infrastructure " +
      "\u2014 a space where sound backend architecture and applied AI aren't optional extras but the entire product. " +
      "If you're working at that edge, I want to talk.",
    { delay: 3 }
  );
  console.log("  [OK] About section typed");
  await clickSave(page);
}

async function addExperienceEntry(
  page: Page,
  title: string,
  company: string,
  description: string
) {
  console.log(`\n--- Adding Experience: ${title} @ ${company} ---`);
  await page.goto(
    "https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/edit/forms/position/new/",
    { waitUntil: "domcontentloaded" }
  );
  await page.waitForTimeout(4000);

  const titleInput = page
    .locator("input[id*='title'], input[name*='title'], input[aria-label*='Title']")
    .first();
  await titleInput.waitFor({ state: "visible", timeout: 10000 });
  await titleInput.fill(title);
  console.log("  [OK] Title filled");

  const companyInput = page
    .locator("input[id*='company'], input[name*='company'], input[aria-label*='Company']")
    .first();
  await companyInput.fill(company);
  await page.waitForTimeout(1500);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1000);
  console.log("  [OK] Company filled");

  const descInput = page
    .locator(
      "textarea[id*='description'], textarea[name*='description'], " +
        "textarea[aria-label*='Description'], [contenteditable='true']"
    )
    .first();
  await descInput.waitFor({ state: "visible", timeout: 10000 });
  await descInput.fill(description);
  console.log("  [OK] Description filled");
  await clickSave(page);
}

const COMPLIAI_DESC = `Designed and own the full backend architecture for CompliAI \u2014 a B2B SaaS platform that automates EU AI Act compliance risk scoring for enterprise clients, processing complex regulatory documents through a multi-layer AI inference pipeline.

Architected the end-to-end system connecting a React frontend, PostgreSQL persistence layer, and GPT-4o inference engine via asynchronous FastAPI endpoints with strict Pydantic validation at every boundary.

Engineered NLP pipeline orchestration wrappers that normalize unstructured regulatory document input into structured risk-scoring payloads, eliminating manual compliance review overhead.

Orchestrated a 7-engineer cross-functional team across backend, frontend, database, AI research, and hardware tracks \u2014 running sprint planning cycles, architectural reviews, and structured code reviews.

Designed the database schema for EU AI Act rule representation and compliance rule seeding, ensuring referential integrity and clean separation between regulation data and client assessment state.`;

const CRM_DESC = `Built a production-grade automation system that transforms unstructured web metadata into structured, enriched CRM lead records \u2014 eliminating the manual extraction and normalization layer entirely.

Implemented a scalable Node.js and Puppeteer microservice to navigate multi-page targets and extract raw metadata at volume, with resilient error handling across dynamic DOM structures.

Integrated GPT-4o to parse and normalize unstructured scraped content into structured JSON records (names, roles, contact data), reducing normalization effort and eliminating field-mapping inconsistencies.

Architected a multi-tenant PostgreSQL schema on Supabase with Row Level Security (RLS) enforced at the database layer, ensuring strict tenant data isolation without application-level filtering overhead.

Delivered a documented Express.js REST API with protected routing, structured error propagation, and comprehensive Jest test coverage across scraping, normalization, and data persistence layers.`;

const AVR_DESC = `Built a fully browser-based AVR microcontroller simulator that executes RC5 cipher logic implemented natively in Assembly \u2014 demonstrating hardware-software interface thinking without relying on any external runtime or simulation library.

Implemented the RC5 symmetric cipher algorithm directly in AVR Assembly on ATmega328P, with register allocation, memory addressing, and branching logic designed to match real hardware execution constraints.

Designed a custom JavaScript interpreter to execute AVR Assembly instructions in-browser, enabling live register state inspection, SRAM visualization, and I/O port tracking with zero backend dependency.

Architected the simulator UI as a single-file, zero-dependency frontend \u2014 a deliberate engineering constraint that required precise DOM management and enforced performance discipline throughout.

Eliminated the need for physical hardware or toolchain setup, making low-level AVR debugging and cipher verification accessible directly in a browser for educational and demonstration contexts.`;

const MCP_DESC = `Built a Model Context Protocol (MCP) server that enables AI assistants to interact with LinkedIn programmatically \u2014 automating profile editing, feed posting, messaging, and data extraction via Playwright-powered browser automation.

Architected the full server in TypeScript using the MCP SDK with Zod schema validation, providing strongly-typed tool definitions for all LinkedIn interactions.

Engineered a stealth browser automation layer using Playwright with session recovery, CAPTCHA detection, and cookie persistence to maintain reliable authenticated sessions.

Designed a comprehensive tool suite covering profile read/write (headline, about, experience), feed interaction (read posts, create posts with dry-run safety), messaging, connections browsing, and job search.

Implemented dry-run mode across all write operations to allow verification of DOM selectors and form filling without publishing changes to the live profile or network.`;

async function main() {
  console.log("LinkedIn Profile Update Script v2");
  console.log("=".repeat(50));

  console.log("Initializing browser...");
  await initBrowser();
  const page = getPage();
  console.log(`Logged in. URL: ${page.url()}`);

  await updateHeadline(page);
  await updateAbout(page);
  await addExperienceEntry(page, "Backend Lead & AI Architect", "CompliAI", COMPLIAI_DESC);
  await addExperienceEntry(
    page,
    "Backend Developer",
    "AI-Powered CRM Pipeline & Lead Enrichment",
    CRM_DESC
  );
  await addExperienceEntry(
    page,
    "Systems Developer",
    "RC5 AVR Microcontroller Simulator",
    AVR_DESC
  );
  await addExperienceEntry(
    page,
    "Backend Developer",
    "LinkedIn MCP Server (Personal Project)",
    MCP_DESC
  );

  console.log("\n" + "=".repeat(50));
  console.log("All profile updates completed successfully!");
  process.exit(0);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
