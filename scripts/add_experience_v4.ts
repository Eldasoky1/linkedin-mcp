import { initBrowser, getPage } from "../src/browser.js";
import { Page } from "playwright";

async function addPosition(
  page: Page,
  title: string,
  company: string,
  description: string
) {
  console.log(`\n--- Adding: ${title} @ ${company} ---`);

  // Step 1: Go to edit intro page
  await page.goto(
    "https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/edit/intro/",
    { waitUntil: "domcontentloaded", timeout: 30000 }
  );
  await page.waitForTimeout(4000);

  // Step 2: Click "Add new position" → navigates to position form
  const addLink = page.locator("a:has-text('Add new position')").first();
  await addLink.waitFor({ state: "visible", timeout: 10000 });
  await addLink.click();
  await page.waitForTimeout(3000);
  console.log("  [OK] At position form");

  // Step 3: Fill the form
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

  // Step 4: Click Save
  const saveBtn = page.locator("button:has-text('Save')").first();
  await saveBtn.waitFor({ state: "visible", timeout: 10000 });
  await saveBtn.click({ timeout: 15000 });
  await page.waitForTimeout(3000);
  console.log("  [OK] Save clicked");

  // Step 5: Navigate back to edit intro page
  // Try page.goBack first, then direct navigation as fallback
  try {
    await page.goBack({ waitUntil: "domcontentloaded", timeout: 30000 });
  } catch {
    await page.goto(
      "https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/edit/intro/",
      { waitUntil: "domcontentloaded" }
    );
  }
  await page.waitForTimeout(4000);
  console.log("  [OK] Back on edit intro page");

  // Step 6: Check if the position appears in Current position section
  const positionFound = await page.evaluate(() => {
    const text = document.body.innerText || "";
    const posIdx = text.indexOf("Current position");
    if (posIdx >= 0) {
      const section = text.substring(posIdx, posIdx + 800);
      return { found: true, section: section.substring(0, 300) };
    }
    return { found: false, section: "" };
  });

  if (positionFound.found) {
    console.log("  Current position section:", positionFound.section);
  } else {
    console.log("  [!] Current position section not found");
  }

  // Step 7: Click the main "Save" button to publish all changes
  const mainSave = page.locator("button:has-text('Save')").first();
  const mainSaveVisible = await mainSave.isVisible().catch(() => false);
  if (mainSaveVisible) {
    try {
      await mainSave.click({ timeout: 10000 });
      await page.waitForTimeout(3000);
      console.log("  [OK] Main Save clicked");
    } catch {
      // If dialog overlay blocks, use force click
      await mainSave.click({ timeout: 10000, force: true });
      await page.waitForTimeout(3000);
      console.log("  [OK] Main Save (force) clicked");
    }
  } else {
    console.log("  [!] Main Save not found on edit intro page");
  }
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
    console.log("  NO Experience entries found on profile");
  }
}

async function main() {
  await initBrowser();
  const page = getPage();

  const experiences = [
    {
      title: "Backend Lead & AI Architect",
      company: "CompliAI",
      desc: `Designed and own the full backend architecture for CompliAI — a B2B SaaS platform that automates EU AI Act compliance risk scoring for enterprise clients, processing complex regulatory documents through a multi-layer AI inference pipeline.\n\nArchitected the end-to-end system connecting a React frontend, PostgreSQL persistence layer, and GPT-4o inference engine via asynchronous FastAPI endpoints with strict Pydantic validation at every boundary.\n\nEngineered NLP pipeline orchestration wrappers that normalize unstructured regulatory document input into structured risk-scoring payloads, eliminating manual compliance review overhead.\n\nOrchestrated a 7-engineer cross-functional team across backend, frontend, database, AI research, and hardware tracks — running sprint planning cycles, architectural reviews, and structured code reviews.\n\nDesigned the database schema for EU AI Act rule representation and compliance rule seeding, ensuring referential integrity and clean separation between regulation data and client assessment state.`,
    },
    {
      title: "Backend Developer",
      company: "AI-Powered CRM Pipeline & Lead Enrichment",
      desc: `Built a production-grade automation system that transforms unstructured web metadata into structured, enriched CRM lead records — eliminating the manual extraction and normalization layer entirely.\n\nImplemented a scalable Node.js and Puppeteer microservice to navigate multi-page targets and extract raw metadata at volume, with resilient error handling across dynamic DOM structures.\n\nIntegrated GPT-4o to parse and normalize unstructured scraped content into structured JSON records (names, roles, contact data), reducing normalization effort and eliminating field-mapping inconsistencies.\n\nArchitected a multi-tenant PostgreSQL schema on Supabase with Row Level Security (RLS) enforced at the database layer, ensuring strict tenant data isolation without application-level filtering overhead.\n\nDelivered a documented Express.js REST API with protected routing, structured error propagation, and comprehensive Jest test coverage across scraping, normalization, and data persistence layers.`,
    },
    {
      title: "Systems Developer",
      company: "RC5 AVR Microcontroller Simulator",
      desc: `Built a fully browser-based AVR microcontroller simulator that executes RC5 cipher logic implemented natively in Assembly — demonstrating hardware-software interface thinking without relying on any external runtime or simulation library.\n\nImplemented the RC5 symmetric cipher algorithm directly in AVR Assembly on ATmega328P, with register allocation, memory addressing, and branching logic designed to match real hardware execution constraints.\n\nDesigned a custom JavaScript interpreter to execute AVR Assembly instructions in-browser, enabling live register state inspection, SRAM visualization, and I/O port tracking with zero backend dependency.\n\nArchitected the simulator UI as a single-file, zero-dependency frontend — a deliberate engineering constraint that required precise DOM management and enforced performance discipline throughout.\n\nEliminated the need for physical hardware or toolchain setup, making low-level AVR debugging and cipher verification accessible directly in a browser for educational and demonstration contexts.`,
    },
    {
      title: "Backend Developer",
      company: "LinkedIn MCP Server (Personal Project)",
      desc: `Built a Model Context Protocol (MCP) server that enables AI assistants to interact with LinkedIn programmatically — automating profile editing, feed posting, messaging, and data extraction via Playwright-powered browser automation.\n\nArchitected the full server in TypeScript using the MCP SDK with Zod schema validation, providing strongly-typed tool definitions for all LinkedIn interactions.\n\nEngineered a stealth browser automation layer using Playwright with session recovery, CAPTCHA detection, and cookie persistence to maintain reliable authenticated sessions.\n\nDesigned a comprehensive tool suite covering profile read/write (headline, about, experience), feed interaction (read posts, create posts with dry-run safety), messaging, connections browsing, and job search.\n\nImplemented dry-run mode across all write operations to allow verification of DOM selectors and form filling without publishing changes to the live profile or network.`,
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
