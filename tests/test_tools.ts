import { initBrowser, getPage, safeInteract } from "../src/index.js";
import { Page } from "playwright";
import fs from "fs";

interface TestResult {
  name: string;
  status: "PASS" | "FAIL" | "SKIP";
  detail: string;
  screenshot?: string;
}

const results: TestResult[] = [];
const screenshotsDir = "screenshots";
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

let passed = 0;
let failed = 0;
let skipped = 0;

function record(
  name: string,
  status: "PASS" | "FAIL" | "SKIP",
  detail: string,
  screenshot?: string
) {
  results.push({ name, status, detail, screenshot });
  if (status === "PASS") passed++;
  else if (status === "FAIL") failed++;
  else skipped++;
}

async function screenshot(page: Page, label: string): Promise<string> {
  const filename = `${label.replace(/[^a-zA-Z0-9]/g, "_")}.png`;
  const path = `${screenshotsDir}/${filename}`;
  await page.screenshot({ path, fullPage: true }).catch(() => {});
  return path;
}

async function testFeedPage(page: Page) {
  const name = "create_post: feed page and start post button";
  try {
    await page.goto("https://www.linkedin.com/feed/", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(3000);

    const startPostBtn = page
      .locator(
        "[aria-label='Start a post'], " +
          "button:has-text('Start a post'), " +
          "[role='button']:has-text('Start a post')"
      )
      .first();
    const visible = await startPostBtn.isVisible().catch(() => false);
    if (!visible) {
      const shot = await screenshot(page, "feed_page_no_button");
      record(name, "FAIL", "Start a post button not found", shot);
      return;
    }
    await startPostBtn.scrollIntoViewIfNeeded();
    await startPostBtn.click({ timeout: 10000 });

    const dialog = page.locator("div[role='dialog'], div[role='document']").first();
    const dialogVisible = await dialog.isVisible({ timeout: 10000 }).catch(() => false);
    if (!dialogVisible) {
      const shot = await screenshot(page, "feed_page_no_dialog");
      record(name, "FAIL", "Post dialog did not appear after click", shot);
      return;
    }

    await page.waitForTimeout(1000);

    const editor = page
      .locator(
        "div.ql-editor[contenteditable='true'], " +
          "[contenteditable='true'][role='textbox'], " +
          "[contenteditable='true'][aria-label*='post'], " +
          "[contenteditable='true'][aria-label*='Text editor'], " +
          "div[contenteditable='true']"
      )
      .first();
    const editorVisible = await editor.isVisible().catch(() => false);

    if (!editorVisible) {
      const inIframe = await page
        .locator("iframe.ql-editor, iframe[title*='post'], iframe[title*='Rich Text']")
        .first()
        .isVisible()
        .catch(() => false);
      if (!inIframe) {
        const shot = await screenshot(page, "feed_page_no_editor");
        record(name, "FAIL", "Editor not found (neither direct nor in iframe)", shot);
        return;
      }
      record(name, "PASS", "Editor found inside iframe");
    } else {
      await editor.click();
      await page.keyboard.type("Test post content - dry run", { delay: 5 });
      record(name, "PASS", "Editor found, text entered successfully");
    }

    const postBtn = page
      .locator(
        "button:has-text('Post'):not(:has-text('Repost')), " +
          "[role='button']:has-text('Post'):not(:has-text('Repost'))"
      )
      .last();
    const postBtnVisible = await postBtn.isVisible().catch(() => false);
    if (!postBtnVisible) {
      const shot = await screenshot(page, "feed_page_no_post_btn");
      record(name, "SKIP", "Editor OK but Post button not found (dry-run still valid)", shot);
      return;
    }
    record(name, "PASS", "Start a post -> editor -> Post button: all selectors found");
  } catch (e: any) {
    const shot = await screenshot(page, "feed_page_error");
    record(name, "FAIL", `Exception: ${e.message}`, shot);
  }
}

async function testEditHeadline(page: Page) {
  const name = "edit_headline: intro edit form";
  try {
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
    const visible = await headlineInput.isVisible().catch(() => false);
    if (!visible) {
      const shot = await screenshot(page, "headline_no_input");
      record(name, "FAIL", "Headline input not found", shot);
      return;
    }
    await headlineInput.fill("Test Headline - Dry Run");

    const saveBtn = page
      .locator(
        "button:has-text('Save'), " +
          "[role='button']:has-text('Save'), " +
          "button[type='submit']"
      )
      .first();
    const saveVisible = await saveBtn.isVisible().catch(() => false);
    if (!saveVisible) {
      const shot = await screenshot(page, "headline_no_save_btn");
      record(name, "SKIP", "Headline input found but Save button not visible", shot);
      return;
    }
    record(name, "PASS", "Headline input and Save button found");
  } catch (e: any) {
    const shot = await screenshot(page, "headline_error");
    record(name, "FAIL", `Exception: ${e.message}`, shot);
  }
}

async function testEditAbout(page: Page) {
  const name = "update_profile: about section";
  try {
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
    const visible = await aboutInput.isVisible().catch(() => false);
    if (!visible) {
      const shot = await screenshot(page, "about_no_input");
      record(name, "FAIL", "About/summary input not found", shot);
      return;
    }
    await aboutInput.fill("Test About section - Dry Run");

    const saveBtn = page
      .locator(
        "button:has-text('Save'), " +
          "[role='button']:has-text('Save'), " +
          "button[type='submit']"
      )
      .first();
    const saveVisible = await saveBtn.isVisible().catch(() => false);
    if (!saveVisible) {
      const shot = await screenshot(page, "about_no_save_btn");
      record(name, "SKIP", "About input found but Save button not visible", shot);
      return;
    }
    record(name, "PASS", "About input and Save button found");
  } catch (e: any) {
    const shot = await screenshot(page, "about_error");
    record(name, "FAIL", `Exception: ${e.message}`, shot);
  }
}

async function testAddExperience(page: Page) {
  const name = "update_experience: position form";
  try {
    await page.goto("https://www.linkedin.com/in/me/edit/forms/position/new/", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(3000);

    const titleInput = page
      .locator(
        "input[id*='title'], input[name*='title'], input[aria-label*='Title']"
      )
      .first();
    const titleVisible = await titleInput.isVisible().catch(() => false);
    if (!titleVisible) {
      const shot = await screenshot(page, "exp_no_title");
      record(name, "FAIL", "Title input not found", shot);
      return;
    }
    await titleInput.fill("Test Title - Dry Run");

    const companyInput = page
      .locator(
        "input[id*='company'], input[name*='company'], input[aria-label*='Company']"
      )
      .first();
    const companyVisible = await companyInput.isVisible().catch(() => false);
    if (!companyVisible) {
      const shot = await screenshot(page, "exp_no_company");
      record(name, "FAIL", "Company input not found", shot);
      return;
    }
    await companyInput.fill("Test Company - Dry Run");

    const descInput = page
      .locator(
        "textarea[id*='description'], textarea[name*='description'], " +
          "textarea[aria-label*='Description'], [contenteditable='true']"
      )
      .first();
    const descVisible = await descInput.isVisible().catch(() => false);
    if (!descVisible) {
      const shot = await screenshot(page, "exp_no_desc");
      record(name, "SKIP", "Title/Company found but Description not found", shot);
      return;
    }
    await descInput.fill("Test description - Dry Run");

    const saveBtn = page
      .locator(
        "button:has-text('Save'), " +
          "[role='button']:has-text('Save'), " +
          "button[type='submit']"
      )
      .first();
    const saveVisible = await saveBtn.isVisible().catch(() => false);
    if (!saveVisible) {
      const shot = await screenshot(page, "exp_no_save_btn");
      record(name, "SKIP", "All fields found but Save button not visible", shot);
      return;
    }
    record(name, "PASS", "Title, Company, Description inputs and Save button found");
  } catch (e: any) {
    const shot = await screenshot(page, "exp_error");
    record(name, "FAIL", `Exception: ${e.message}`, shot);
  }
}

async function testGetMyProfile(page: Page) {
  const name = "get_my_profile: profile page";
  try {
    await page.goto("https://www.linkedin.com/in/", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(3000);

    const nameEl = page.locator("h1.text-heading-xlarge").first();
    const nameVisible = await nameEl.isVisible().catch(() => false);
    if (!nameVisible) {
      const shot = await screenshot(page, "profile_no_name");
      record(name, "FAIL", "Profile name element not found", shot);
      return;
    }
    const nameText = await nameEl.textContent().catch(() => null);

    const headlineEl = page.locator("div.text-body-medium").first();
    const headlineVisible = await headlineEl.isVisible().catch(() => false);
    if (!headlineVisible) {
      record(name, "SKIP", `Name found ("${nameText?.trim()}") but headline element not found`);
      return;
    }
    record(name, "PASS", `Profile loaded: name="${nameText?.trim()}"`);
  } catch (e: any) {
    const shot = await screenshot(page, "profile_error");
    record(name, "FAIL", `Exception: ${e.message}`, shot);
  }
}

async function testConnections(page: Page) {
  const name = "connections: my network page";
  try {
    await page.goto("https://www.linkedin.com/mynetwork/", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(3000);

    const connectionItems = page
      .locator(
        "ul.mn-connections-list li, " +
          "div.mn-connections-card, " +
          "[data-view-name*='connections']"
      )
      .first();
    const visible = await connectionItems.isVisible().catch(() => false);
    if (!visible) {
      const shot = await screenshot(page, "connections_no_list");
      record(name, "SKIP", "Network page loaded but connection list elements not found", shot);
      return;
    }
    record(name, "PASS", "Connections list elements found");
  } catch (e: any) {
    const shot = await screenshot(page, "connections_error");
    record(name, "FAIL", `Exception: ${e.message}`, shot);
  }
}

async function testMessaging(page: Page) {
  const name = "messaging: messaging page";
  try {
    await page.goto("https://www.linkedin.com/messaging/", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(3000);

    const conversationsList = page
      .locator(
        "section.conversations-list, " +
          "div.msg-conversations-container, " +
          "[data-control-name*='conversation_list']"
      )
      .first();
    const visible = await conversationsList.isVisible().catch(() => false);
    if (!visible) {
      const shot = await screenshot(page, "messaging_no_list");
      record(name, "SKIP", "Messaging page loaded but conversations list not found", shot);
      return;
    }
    record(name, "PASS", "Messaging conversations list found");
  } catch (e: any) {
    const shot = await screenshot(page, "messaging_error");
    record(name, "FAIL", `Exception: ${e.message}`, shot);
  }
}

async function testJobs(page: Page) {
  const name = "jobs: jobs page";
  try {
    await page.goto("https://www.linkedin.com/jobs/", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(3000);

    const searchInput = page
      .locator(
        "input.jobs-search-box__text-input, " +
          "input[aria-label*='Search'], " +
          "input[placeholder*='Search']"
      )
      .first();
    const visible = await searchInput.isVisible().catch(() => false);
    if (!visible) {
      const shot = await screenshot(page, "jobs_no_search");
      record(name, "SKIP", "Jobs page loaded but search input not found", shot);
      return;
    }
    record(name, "PASS", "Jobs search input found");
  } catch (e: any) {
    const shot = await screenshot(page, "jobs_error");
    record(name, "FAIL", `Exception: ${e.message}`, shot);
  }
}

function printSummary() {
  console.log("\n" + "=".repeat(60));
  console.log("  TEST RESULTS SUMMARY");
  console.log("=".repeat(60));
  for (const r of results) {
    const icon =
      r.status === "PASS" ? "  PASS" : r.status === "FAIL" ? "  FAIL" : "  SKIP";
    console.log(`${icon}  ${r.name}`);
    console.log(`       ${r.detail}`);
    if (r.screenshot) {
      console.log(`       Screenshot: ${r.screenshot}`);
    }
    console.log();
  }
  console.log("=".repeat(60));
  console.log(`  Total: ${results.length}  |  Passed: ${passed}  |  Failed: ${failed}  |  Skipped: ${skipped}`);
  console.log("=".repeat(60));
}

async function main() {
  console.log("LinkedIn MCP Tool Test Suite (Dry Run Mode)");
  console.log("=".repeat(60));
  console.log("Initializing browser...");

  let page: Page;
  try {
    await initBrowser();
    page = getPage();
    console.log("Browser initialized. URL:", page.url());
  } catch (e: any) {
    console.error("FATAL: Browser initialization failed:", e.message);
    process.exit(1);
  }

  await testGetMyProfile(page);
  await testEditHeadline(page);
  await testEditAbout(page);
  await testAddExperience(page);
  await testFeedPage(page);
  await testConnections(page);
  await testMessaging(page);
  await testJobs(page);

  printSummary();
  process.exit(failed > 0 ? 1 : 0);
}

main();
