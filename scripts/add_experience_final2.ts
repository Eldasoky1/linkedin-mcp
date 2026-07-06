import { initBrowser, getPage } from "../src/browser.js";
import { Page } from "playwright";

const MONTHS: Record<string, string> = {
  "1": "January", "2": "February", "3": "March", "4": "April",
  "5": "May", "6": "June", "7": "July", "8": "August",
  "9": "September", "10": "October", "11": "November", "12": "December",
};

function monthNum(name: string): string {
  for (const [num, n] of Object.entries(MONTHS)) {
    if (n.toLowerCase() === name.toLowerCase()) return num;
  }
  return "1";
}

async function addPosition(
  page: Page,
  title: string,
  company: string,
  description: string,
  monthName: string,
  year: string
) {
  console.log(`\n--- Adding: ${title} @ ${company} ---`);

  await page.goto(
    "https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/edit/intro/",
    { waitUntil: "domcontentloaded", timeout: 30000 }
  );
  await page.waitForTimeout(4000);

  await page.click("a:has-text('Add new position')");
  await page.waitForTimeout(3000);

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

  // Select Month (select #1) and Year (select #2)
  const allSelects = page.locator("select");
  const monthVal = monthNum(monthName);
  await allSelects.nth(1).selectOption(monthVal);
  console.log(`  [OK] Start month: ${monthName} (value=${monthVal})`);
  await allSelects.nth(2).selectOption(year);
  console.log(`  [OK] Start year: ${year}`);

  const editor = page.locator("div.tiptap.ProseMirror").first();
  await editor.waitFor({ state: "visible", timeout: 10000 });
  await editor.click();
  await page.keyboard.press("Control+a");
  await page.keyboard.press("Delete");
  await page.waitForTimeout(300);
  await page.keyboard.type(description, { delay: 2 });

  const saveBtn = page.locator("button:has-text('Save')").first();
  await saveBtn.waitFor({ state: "visible", timeout: 10000 });
  await saveBtn.click({ timeout: 15000 });
  await page.waitForTimeout(3000);

  await page.goto(
    "https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/edit/intro/",
    { waitUntil: "domcontentloaded" }
  );
  await page.waitForTimeout(4000);

  const dropdownOptions = await page.evaluate(() => {
    const selects = document.querySelectorAll("select");
    for (const s of Array.from(selects)) {
      const options = Array.from(s.querySelectorAll("option"));
      const texts = options.map(o => o.textContent?.trim()).filter(Boolean);
      if (texts.length > 1 && !texts.every(t => /^\d{4}$|Month|Year|Please/.test(t || ""))) {
        return texts.slice(1);
      }
    }
    return [];
  });
  console.log("  Dropdown has options:", dropdownOptions);

  let selected = false;
  for (const opt of dropdownOptions) {
    if (opt?.includes(title) || opt?.includes(company)) {
      const count = await allSelects.count();
      for (let i = 0; i < count; i++) {
        const text = await allSelects.nth(i).evaluate(el =>
          Array.from(el.querySelectorAll("option")).map(o => o.textContent?.trim())
        );
        if (text?.some(t => t?.includes(title) || t?.includes(company))) {
          await allSelects.nth(i).selectOption({ label: opt });
          selected = true;
          console.log(`  [OK] Selected: ${opt}`);
          break;
        }
      }
      break;
    }
  }
  if (!selected) console.log("  [!] Position not found in dropdown after save");

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
  if (relevant.length === 0) {
    console.log("  NO experience entries found");
  }
  for (const r of relevant) {
    console.log(`  "${r.substring(0, 200)}"`);
  }
}

async function main() {
  await initBrowser();
  const page = getPage();

  const experiences = [
    { t: "Backend Lead & AI Architect", c: "CompliAI", m: "March", y: "2024",
      d: `Designed and own the full backend architecture for CompliAI — a B2B SaaS platform automating EU AI Act compliance risk scoring for enterprise clients.\n\nArchitected the end-to-end system connecting React frontend, PostgreSQL, and GPT-4o inference via FastAPI endpoints with strict Pydantic validation.\n\nEngineered NLP pipeline orchestration wrappers that normalize unstructured regulatory document input into structured risk-scoring payloads.\n\nOrchestrated a 7-engineer cross-functional team across backend, frontend, database, AI research, and hardware tracks.\n\nDesigned the database schema for EU AI Act rule representation with referential integrity and clean data separation.` },
    { t: "Backend Developer", c: "AI-Powered CRM Pipeline & Lead Enrichment", m: "January", y: "2025",
      d: `Built a production-grade automation system transforming unstructured web metadata into structured CRM lead records.\n\nImplemented scalable Node.js and Puppeteer microservice to navigate multi-page targets and extract metadata at volume.\n\nIntegrated GPT-4o to parse and normalize unstructured scraped content into structured JSON records.\n\nArchitected multi-tenant PostgreSQL schema on Supabase with Row Level Security (RLS) enforced at the database layer.\n\nDelivered documented Express.js REST API with protected routing, structured error propagation, and Jest test coverage.` },
    { t: "Systems Developer", c: "RC5 AVR Microcontroller Simulator", m: "August", y: "2025",
      d: `Built a fully browser-based AVR microcontroller simulator executing RC5 cipher logic in AVR Assembly.\n\nImplemented the RC5 symmetric cipher algorithm directly in AVR Assembly on ATmega328P with register allocation and branching logic.\n\nDesigned a custom JavaScript interpreter to execute AVR Assembly instructions in-browser with live register state inspection.\n\nArchitected simulator UI as a single-file, zero-dependency frontend with precise DOM management.\n\nEliminated need for physical hardware, making AVR debugging accessible directly in a browser.` },
    { t: "Backend Developer", c: "LinkedIn MCP Server (Personal Project)", m: "December", y: "2025",
      d: `Built a Model Context Protocol (MCP) server enabling AI assistants to interact with LinkedIn programmatically.\n\nArchitected the server in TypeScript using MCP SDK with Zod schema validation for all LinkedIn interactions.\n\nEngineered stealth browser automation layer using Playwright with session recovery and CAPTCHA detection.\n\nDesigned tool suite covering profile read/write, feed interaction, messaging, connections, and job search.\n\nImplemented dry-run mode across all write operations to verify selectors without publishing changes.` },
  ];

  for (const exp of experiences) {
    await addPosition(page, exp.t, exp.c, exp.d, exp.m, exp.y);
  }

  await verifyProfile(page);
  process.exit(0);
}

main().catch(e => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
