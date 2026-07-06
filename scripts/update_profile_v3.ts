import { initBrowser, getPage } from "../src/browser.js";
import { Page } from "playwright";

async function waitAndClickSave(page: Page) {
  try {
    const saveBtn = page.locator("button:has-text('Save')").first();
    await saveBtn.waitFor({ state: "visible", timeout: 10000 });
    await saveBtn.click({ timeout: 10000 });
    await page.waitForTimeout(3000);
    console.log("  [OK] Save clicked");
  } catch {
    console.log("  [!] Save button not found, trying alternative...");
    const saveBtn2 = page
      .locator(
        "button:has-text('Save'), " +
          "[role='button']:has-text('Save'), " +
          "button[type='submit']"
      )
      .first();
    await saveBtn2.click({ timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(3000);
  }
}

async function updateHeadline(page: Page) {
  console.log("\n--- Updating Headline ---");
  await page.goto(
    "https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/edit/intro/",
    { waitUntil: "domcontentloaded" }
  );
  await page.waitForTimeout(4000);

  const proseMirror = page.locator("div.tiptap.ProseMirror").first();
  await proseMirror.waitFor({ state: "visible", timeout: 10000 });
  await proseMirror.click();
  await page.keyboard.press("Control+a");
  await page.keyboard.press("Delete");
  await page.waitForTimeout(500);

  await page.keyboard.type(
    "Applied AI Engineer Who Ships Production Systems \u00b7 Backend Architecture \u00b7 LLM Pipelines \u00b7 FastAPI \u00b7 Node.js \u00b7 Team Lead @ CompliAI \u00b7 E-JUST CS",
    { delay: 5 }
  );
  console.log("  [OK] Headline typed");
  await waitAndClickSave(page);
}

async function updateAbout(page: Page) {
  console.log("\n--- Updating About Section ---");
  await page.goto(
    "https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/edit/forms/summary/new/?profileFormEntryPoint=GUIDANCE_CARD",
    { waitUntil: "domcontentloaded" }
  );
  await page.waitForTimeout(4000);

  const proseMirror = page.locator("div.tiptap.ProseMirror").first();
  await proseMirror.waitFor({ state: "visible", timeout: 10000 });
  await proseMirror.click();
  await page.keyboard.press("Control+a");
  await page.keyboard.press("Delete");
  await page.waitForTimeout(500);

  const aboutText =
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
    "If you're working at that edge, I want to talk.";

  await page.keyboard.type(aboutText, { delay: 2 });
  console.log("  [OK] About section typed");
  await waitAndClickSave(page);
}

async function addExperienceEntry(
  page: Page,
  title: string,
  company: string,
  description: string,
  headline?: string
) {
  console.log(`\n--- Adding Experience: ${title} @ ${company} ---`);
  await page.goto(
    "https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/edit/forms/position/new/",
    { waitUntil: "domcontentloaded" }
  );
  await page.waitForTimeout(5000);

  // Title field - use placeholder
  const titleInput = page.locator("input[placeholder*='Ex:']").first();
  await titleInput.waitFor({ state: "visible", timeout: 10000 });
  await titleInput.fill(title);
  console.log("  [OK] Title filled");

  // Company field - use placeholder
  const companyInput = page.locator("input[placeholder*='Ex: Microsoft']").first();
  await companyInput.waitFor({ state: "visible", timeout: 10000 });
  await companyInput.fill(company);
  await page.waitForTimeout(1500);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1000);
  console.log("  [OK] Company filled");

  // Description - use ProseMirror (the contenteditable div)
  const descEditor = page.locator("div.tiptap.ProseMirror").first();
  await descEditor.waitFor({ state: "visible", timeout: 10000 });
  await descEditor.click();
  await page.keyboard.press("Control+a");
  await page.keyboard.press("Delete");
  await page.waitForTimeout(500);
  await page.keyboard.type(description, { delay: 2 });
  console.log("  [OK] Description typed");

  await waitAndClickSave(page);
}

const COMPLIAI_DESC = `Designed and own the full backend architecture for CompliAI \u2014 a B2B SaaS platform that automates EU AI Act compliance risk scoring for enterprise clients, processing complex regulatory documents through a multi-layer AI inference pipeline.\n\nArchitected the end-to-end system connecting a React frontend, PostgreSQL persistence layer, and GPT-4o inference engine via asynchronous FastAPI endpoints with strict Pydantic validation at every boundary.\n\nEngineered NLP pipeline orchestration wrappers that normalize unstructured regulatory document input into structured risk-scoring payloads, eliminating manual compliance review overhead.\n\nOrchestrated a 7-engineer cross-functional team across backend, frontend, database, AI research, and hardware tracks \u2014 running sprint planning cycles, architectural reviews, and structured code reviews.\n\nDesigned the database schema for EU AI Act rule representation and compliance rule seeding, ensuring referential integrity and clean separation between regulation data and client assessment state.`;

const CRM_DESC = `Built a production-grade automation system that transforms unstructured web metadata into structured, enriched CRM lead records \u2014 eliminating the manual extraction and normalization layer entirely.\n\nImplemented a scalable Node.js and Puppeteer microservice to navigate multi-page targets and extract raw metadata at volume, with resilient error handling across dynamic DOM structures.\n\nIntegrated GPT-4o to parse and normalize unstructured scraped content into structured JSON records (names, roles, contact data), reducing normalization effort and eliminating field-mapping inconsistencies.\n\nArchitected a multi-tenant PostgreSQL schema on Supabase with Row Level Security (RLS) enforced at the database layer, ensuring strict tenant data isolation without application-level filtering overhead.\n\nDelivered a documented Express.js REST API with protected routing, structured error propagation, and comprehensive Jest test coverage across scraping, normalization, and data persistence layers.`;

const AVR_DESC = `Built a fully browser-based AVR microcontroller simulator that executes RC5 cipher logic implemented natively in Assembly \u2014 demonstrating hardware-software interface thinking without relying on any external runtime or simulation library.\n\nImplemented the RC5 symmetric cipher algorithm directly in AVR Assembly on ATmega328P, with register allocation, memory addressing, and branching logic designed to match real hardware execution constraints.\n\nDesigned a custom JavaScript interpreter to execute AVR Assembly instructions in-browser, enabling live register state inspection, SRAM visualization, and I/O port tracking with zero backend dependency.\n\nArchitected the simulator UI as a single-file, zero-dependency frontend \u2014 a deliberate engineering constraint that required precise DOM management and enforced performance discipline throughout.\n\nEliminated the need for physical hardware or toolchain setup, making low-level AVR debugging and cipher verification accessible directly in a browser for educational and demonstration contexts.`;

const MCP_DESC = `Built a Model Context Protocol (MCP) server that enables AI assistants to interact with LinkedIn programmatically \u2014 automating profile editing, feed posting, messaging, and data extraction via Playwright-powered browser automation.\n\nArchitected the full server in TypeScript using the MCP SDK with Zod schema validation, providing strongly-typed tool definitions for all LinkedIn interactions.\n\nEngineered a stealth browser automation layer using Playwright with session recovery, CAPTCHA detection, and cookie persistence to maintain reliable authenticated sessions.\n\nDesigned a comprehensive tool suite covering profile read/write (headline, about, experience), feed interaction (read posts, create posts with dry-run safety), messaging, connections browsing, and job search.\n\nImplemented dry-run mode across all write operations to allow verification of DOM selectors and form filling without publishing changes to the live profile or network.`;

async function main() {
  console.log("LinkedIn Profile Update v3");
  console.log("=".repeat(50));

  await initBrowser();
  const page = getPage();
  console.log(`Logged in. URL: ${page.url()}`);

  await updateHeadline(page);
  await updateAbout(page);
  await addExperienceEntry(page, "Backend Lead & AI Architect", "CompliAI", COMPLIAI_DESC);
  await addExperienceEntry(page, "Backend Developer", "AI-Powered CRM Pipeline & Lead Enrichment", CRM_DESC);
  await addExperienceEntry(page, "Systems Developer", "RC5 AVR Microcontroller Simulator", AVR_DESC);
  await addExperienceEntry(page, "Backend Developer", "LinkedIn MCP Server (Personal Project)", MCP_DESC);

  console.log("\n" + "=".repeat(50));
  console.log("All updates completed!");
  process.exit(0);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
