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
  await page.goto("https://www.linkedin.com/in/me/edit/intro/", {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(3000);

  const headlineInput = page
    .locator(
      "input[id*='headline'], textarea[id*='headline'], " +
        "input[name*='headline'], textarea[name*='headline'], " +
        "input[aria-label*='Headline'], textarea[aria-label*='Headline']"
    )
    .first();
  await headlineInput.waitFor({ state: "visible", timeout: 10000 });
  await headlineInput.fill("");
  await headlineInput.fill(
    "Applied AI Engineer Who Ships Production Systems · Backend Architecture · LLM Pipelines · FastAPI · Node.js · Team Lead @ CompliAI · E-JUST CS"
  );
  console.log("  [OK] Headline filled");
  await clickSave(page);
}

async function updateAbout(page: Page) {
  console.log("\n--- Updating About Section ---");
  await page.goto("https://www.linkedin.com/in/me/edit/forms/summary/new/", {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(3000);

  const aboutInput = page
    .locator(
      "textarea[name*='summary'], textarea[id*='summary'], " +
        "textarea[aria-label*='About'], textarea[aria-label*='Summary'], " +
        "[contenteditable='true']"
    )
    .first();
  await aboutInput.waitFor({ state: "visible", timeout: 10000 });
  await aboutInput.fill("");
  await aboutInput.fill(
    "I build backend systems where data stops being raw and starts being actionable. As Backend Lead and AI Architect on CompliAI \u2014 a B2B SaaS platform automating EU AI Act compliance \u2014 I design the full-stack infrastructure connecting React frontends, PostgreSQL schemas, and GPT-4o inference pipelines. This isn't coursework. It ships.\n\nE-JUST's rigorous CS curriculum gave me the foundations: embedded systems, operating systems, database internals, algorithms. What I did next was take those first principles into production \u2014 leading a 7-engineer cross-functional team, making architectural tradeoffs under real constraints, and owning the consequences of every design decision.\n\n// Core Stack\nFastAPI \u00b7 Node.js (Express) \u00b7 PostgreSQL \u00b7 Supabase \u00b7 GPT-4o \u00b7 PyTorch \u00b7 Puppeteer \u00b7 SQLAlchemy\n\n// Domain Focus\nBackend Architecture \u00b7 LLM Integration & Orchestration \u00b7 Automated Data Pipelines \u00b7 Applied Regulatory AI \u00b7 Low-Level Systems Engineering\n\nI'm building toward the intersection of AI systems engineering and enterprise compliance infrastructure \u2014 a space where sound backend architecture and applied AI aren't optional extras but the entire product. If you're working at that edge, I want to talk."
  );
  console.log("  [OK] About section filled");
  await clickSave(page);
}

async function updateExperience(page: Page) {
  console.log("\n--- Adding Experience: CompliAI ---");
  await page.goto("https://www.linkedin.com/in/me/edit/forms/position/new/", {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(3000);

  const titleInput = page
    .locator(
      "input[id*='title'], input[name*='title'], input[aria-label*='Title']"
    )
    .first();
  await titleInput.waitFor({ state: "visible", timeout: 10000 });
  await titleInput.fill("Backend Lead & AI Architect");
  console.log("  [OK] Title filled");

  const companyInput = page
    .locator(
      "input[id*='company'], input[name*='company'], input[aria-label*='Company']"
    )
    .first();
  await companyInput.fill("CompliAI");
  await page.waitForTimeout(1000);
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
  await descInput.fill(
    "Designed and own the full backend architecture for CompliAI \u2014 a B2B SaaS platform that automates EU AI Act compliance risk scoring for enterprise clients, processing complex regulatory documents through a multi-layer AI inference pipeline.\n\nArchitected the end-to-end system connecting a React frontend, PostgreSQL persistence layer, and GPT-4o inference engine via asynchronous FastAPI endpoints with strict Pydantic validation at every boundary.\n\nEngineered NLP pipeline orchestration wrappers that normalize unstructured regulatory document input into structured risk-scoring payloads, eliminating manual compliance review overhead.\n\nOrchestrated a 7-engineer cross-functional team across backend, frontend, database, AI research, and hardware tracks \u2014 running sprint planning cycles, architectural reviews, and structured code reviews.\n\nDesigned the database schema for EU AI Act rule representation and compliance rule seeding, ensuring referential integrity and clean separation between regulation data and client assessment state."
  );
  console.log("  [OK] Description filled");
  await clickSave(page);
}

async function addCRMExperience(page: Page) {
  console.log("\n--- Adding Experience: CRM Pipeline ---");
  await page.goto("https://www.linkedin.com/in/me/edit/forms/position/new/", {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(3000);

  const titleInput = page
    .locator(
      "input[id*='title'], input[name*='title'], input[aria-label*='Title']"
    )
    .first();
  await titleInput.waitFor({ state: "visible", timeout: 10000 });
  await titleInput.fill("Backend Developer");
  console.log("  [OK] Title filled");

  const companyInput = page
    .locator(
      "input[id*='company'], input[name*='company'], input[aria-label*='Company']"
    )
    .first();
  await companyInput.fill("AI-Powered CRM Pipeline & Lead Enrichment");
  await page.waitForTimeout(1000);
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
  await descInput.fill(
    "Built a production-grade automation system that transforms unstructured web metadata into structured, enriched CRM lead records \u2014 eliminating the manual extraction and normalization layer entirely.\n\nImplemented a scalable Node.js and Puppeteer microservice to navigate multi-page targets and extract raw metadata at volume, with resilient error handling across dynamic DOM structures.\n\nIntegrated GPT-4o to parse and normalize unstructured scraped content into structured JSON records (names, roles, contact data), reducing normalization effort and eliminating field-mapping inconsistencies.\n\nArchitected a multi-tenant PostgreSQL schema on Supabase with Row Level Security (RLS) enforced at the database layer, ensuring strict tenant data isolation without application-level filtering overhead.\n\nDelivered a documented Express.js REST API with protected routing, structured error propagation, and comprehensive Jest test coverage across scraping, normalization, and data persistence layers."
  );
  console.log("  [OK] Description filled");
  await clickSave(page);
}

async function addMCPServerExperience(page: Page) {
  console.log("\n--- Adding Experience: LinkedIn MCP Server ---");
  await page.goto("https://www.linkedin.com/in/me/edit/forms/position/new/", {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(3000);

  const titleInput = page
    .locator(
      "input[id*='title'], input[name*='title'], input[aria-label*='Title']"
    )
    .first();
  await titleInput.waitFor({ state: "visible", timeout: 10000 });
  await titleInput.fill("Backend Developer");
  console.log("  [OK] Title filled");

  const companyInput = page
    .locator(
      "input[id*='company'], input[name*='company'], input[aria-label*='Company']"
    )
    .first();
  await companyInput.fill("LinkedIn MCP Server (Personal Project)");
  await page.waitForTimeout(1000);
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
  await descInput.fill(
    "Built a Model Context Protocol (MCP) server that enables AI assistants to interact with LinkedIn programmatically \u2014 automating profile editing, feed posting, messaging, and data extraction via Playwright-powered browser automation.\n\nArchitected the full server in TypeScript using the MCP SDK with Zod schema validation, providing strongly-typed tool definitions for all LinkedIn interactions.\n\nEngineered a stealth browser automation layer using Playwright with session recovery, CAPTCHA detection, and cookie persistence to maintain reliable authenticated sessions.\n\nDesigned a comprehensive tool suite covering profile read/write (headline, about, experience), feed interaction (read posts, create posts with dry-run safety), messaging, connections browsing, and job search.\n\nImplemented dry-run mode across all write operations to allow verification of DOM selectors and form filling without publishing changes to the live profile or network."
  );
  console.log("  [OK] Description filled");
  await clickSave(page);
}

async function main() {
  console.log("LinkedIn Profile Update Script");
  console.log("=".repeat(50));

  console.log("Initializing browser...");
  await initBrowser();
  const page = getPage();
  console.log(`Logged in. Current URL: ${page.url()}`);

  await updateHeadline(page);
  await updateAbout(page);
  await updateExperience(page);
  await addCRMExperience(page);
  await addMCPServerExperience(page);

  console.log("\n" + "=".repeat(50));
  console.log("Profile update complete!");
  await page.screenshot({ path: "screenshots/final.png", fullPage: true });
  console.log("Final screenshot saved to screenshots/final.png");
  process.exit(0);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
