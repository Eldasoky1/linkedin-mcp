import { initBrowser, getPage } from "../src/browser.js";
import { Page } from "playwright";

async function typeInProseMirror(page: Page, text: string) {
  const editor = page.locator("div.tiptap.ProseMirror").first();
  const visible = await editor.isVisible().catch(() => false);
  if (visible) {
    await editor.click();
    await page.keyboard.press("Control+a");
    await page.keyboard.press("Delete");
    await page.waitForTimeout(300);
    await page.keyboard.type(text, { delay: 3 });
  }
}

const SKILLS = [
  "Python",
  "TypeScript",
  "JavaScript",
  "Node.js",
  "SQL",
  "HTML5",
  "CSS3",
  "FastAPI",
  "Express.js",
  "RESTful APIs",
  "OpenAPI",
  "Swagger",
  "LLMs",
  "GPT-4o",
  "PyTorch",
  "Scikit-Learn",
  "NLP",
  "PostgreSQL",
  "Supabase",
  "SQLAlchemy",
  "Row Level Security",
  "Team Leadership",
  "System Architecture",
  "Sprint Planning",
  "Code Review",
  "Agile Development",
];

async function addSkills(page: Page) {
  console.log("\n=== ADDING SKILLS ===");

  // Navigate to profile edit mode
  await page.goto(
    "https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/",
    { waitUntil: "domcontentloaded" }
  );
  await page.waitForTimeout(3000);

  // Click "Edit profile"
  const editBtn = page.locator("a[aria-label='Edit profile']").first();
  await editBtn.waitFor({ state: "visible", timeout: 10000 });
  await editBtn.click();
  await page.waitForTimeout(3000);

  console.log("In edit mode. URL:", page.url());

  // Try direct skills edit URL
  await page.goto(
    "https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/edit/forms/skills/new/",
    { waitUntil: "domcontentloaded" }
  );
  await page.waitForTimeout(4000);
  console.log("Skills new form URL:", page.url());

  // Check if the skills form loaded
  const pageContent = await page.evaluate(() => {
    return (document.body.innerText || "").substring(0, 500);
  });
  console.log("Page content:", pageContent);

  // Check for any input-like elements
  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("input, textarea, [contenteditable]"))
      .filter(el => el.getBoundingClientRect().width > 0)
      .map(el => ({
        tag: el.tagName,
        placeholder: (el as HTMLInputElement).placeholder || "",
        ariaLabel: el.getAttribute("aria-label") || "",
        value: ((el as HTMLInputElement).value || "").substring(0, 50),
      }));
  });
  console.log("\nVisible inputs:");
  for (const inp of inputs) {
    console.log(`  [${inp.tag}] placeholder="${inp.placeholder}" aria="${inp.ariaLabel}" value="${inp.value}"`);
  }

  // If not found, try another URL pattern
  await page.goto(
    "https://www.linkedin.com/in/me/edit/forms/skills/new/",
    { waitUntil: "domcontentloaded" }
  );
  await page.waitForTimeout(4000);
  console.log("\n/me/edit/forms/skills/new/ URL:", page.url());
  console.log("Content:", (await page.evaluate(() => (document.body.innerText || "").substring(0, 500))));
}

async function verifyExperience(page: Page) {
  console.log("\n=== VERIFYING EXPERIENCE ===");

  await page.goto(
    "https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/",
    { waitUntil: "domcontentloaded" }
  );
  await page.waitForTimeout(5000);

  // Dump all text on the page to find experience-related content
  const allText = await page.evaluate(() => {
    const results: string[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const text = node.textContent?.trim() || "";
      if (text.length > 3 && text.length < 300) {
        results.push(text);
      }
    }
    return results;
  });

  // Find experience-related entries
  const keywords = ["CompliAI", "CRM Pipeline", "AVR", "Microcontroller", "LinkedIn MCP", "Backend Lead", "Backend Developer", "Systems Developer", "Lead Enrichment"];
  console.log("Looking for experience entries...");
  for (const kw of keywords) {
    const matches = allText.filter(t => t.includes(kw));
    if (matches.length > 0) {
      console.log(`  Found "${kw}":`);
      for (const m of matches.slice(0, 3)) {
        console.log(`    -> ${m.substring(0, 150)}`);
      }
    } else {
      console.log(`  NOT found: "${kw}"`);
    }
  }
}

async function main() {
  console.log("LinkedIn Skills & Experience Verification");
  console.log("=".repeat(50));

  await initBrowser();
  const page = getPage();

  // First verify experience
  await verifyExperience(page);

  // Then try adding skills
  await addSkills(page);

  console.log("\nDone.");
  process.exit(0);
}

main().catch(e => {
  console.error("Fatal:", e);
  process.exit(1);
});
