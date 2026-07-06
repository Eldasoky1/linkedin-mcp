import { initBrowser, getPage } from "../src/browser.js";

async function main() {
  await initBrowser();
  const page = await getPage();

  await page.goto(
    "https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/edit/intro/",
    { waitUntil: "domcontentloaded", timeout: 30000 }
  );
  await page.waitForTimeout(4000);

  const select = page.locator("select").first();
  const opts = await select.evaluate(el => 
    Array.from(el.querySelectorAll("option")).map(o => o.textContent?.trim()).filter(Boolean)
  );

  console.log("Options:", opts);

  for (const opt of opts) {
    if (opt === "Backend AI Engineer - Intern at FlyRank AI" || opt.startsWith("Please")) continue;
    console.log(`\nPublishing: "${opt}"`);
    await select.selectOption({ label: opt });
    await page.waitForTimeout(1500);

    const saveBtn = page.locator("button:has-text('Save')").first();
    await saveBtn.click({ timeout: 15000 });
    await page.waitForTimeout(3000);
    console.log(`  Saved`);
  }

  // Verify profile
  await page.goto("https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5000);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(3000);

  const text = await page.evaluate(() => document.body.innerText);
  for (const c of ["CompliAI", "CRM Pipeline", "AVR Microcontroller", "MCP Server", "Systems Developer"]) {
    console.log(text.includes(c) ? `  [FOUND] "${c}"` : `  [MISSING] "${c}"`);
  }

  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
