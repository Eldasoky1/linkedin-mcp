import { initBrowser, getPage, recoverSession } from "../dist/browser.js";

async function test(description, fn) {
  process.stdout.write(`  ${description}... `);
  try {
    await fn();
    console.log("PASS");
    return true;
  } catch (err) {
    console.log(`FAIL (${err.message?.substring(0, 80) || err})`);
    return false;
  }
}

async function main() {
  console.log("Initializing browser...");
  await initBrowser();
  const page = getPage();
  console.log("Browser ready.\n");

  const results = [];

  // 1. get_my_profile
  results.push({ tool: "get_my_profile", passed: await test("get_my_profile", async () => {
    await page.goto("https://www.linkedin.com/in/", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(5000);
    const url = page.url();
    if (url.includes("/login") || url.includes("/checkpoint")) throw new Error("Not logged in");
    const h2s = await page.locator("h2").all();
    let name = "";
    for (const h of h2s) {
      const t = (await h.textContent())?.trim() ?? "";
      if (t.length > 3 && t !== "0 notifications" && !t.includes("Suggested") && !t.includes("Analytics")) {
        name = t; break;
      }
    }
    if (!name) throw new Error("Could not find name on profile");
    console.log(` -> ${name}`);
  })});

  // 2. get_my_profile_full (scroll to get education)
  results.push({ tool: "get_my_profile_full", passed: await test("get_my_profile_full", async () => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    const edu = await page.locator("section#education li, [data-field='education'] li").count();
    console.log(` -> education items: ${edu}`);
  })});

  // 3. search_people
  results.push({ tool: "search_people", passed: await test("search_people", async () => {
    await page.goto("https://www.linkedin.com/search/results/people/?keywords=engineer", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2000);
    const links = await page.locator("a[href*='/in/']").all();
    let count = 0;
    for (const link of links) {
      const text = (await link.textContent())?.trim() ?? "";
      if (text.length > 3 && !text.includes("•")) count++;
      if (count >= 3) break;
    }
    if (count === 0) throw new Error("No search results");
    console.log(` -> found ${count}+ results`);
  })});

  // 4. get_person_profile - grab first result URL and visit it
  results.push({ tool: "get_person_profile", passed: await test("get_person_profile", async () => {
    const links = await page.locator("a[href*='/in/']").all();
    let firstUrl = null;
    for (const link of links) {
      const text = (await link.textContent())?.trim() ?? "";
      if (text.length > 3 && !text.includes("•")) {
        firstUrl = await link.getAttribute("href");
        break;
      }
    }
    if (!firstUrl) throw new Error("No profile URL found");
    await page.goto(firstUrl.split("?")[0], { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2000);
    const h2s = await page.locator("h2").all();
    let name = "";
    for (const h of h2s) {
      const t = (await h.textContent())?.trim() ?? "";
      if (t.length > 3 && t !== "0 notifications" && !t.includes("Suggested") && !t.includes("Analytics")) {
        name = t; break;
      }
    }
    if (!name) throw new Error("Could not find name");
    console.log(` -> ${name}`);
  })});

  // 5. connect_with_person (dry-run: just check if Connect button exists, don't click)
  results.push({ tool: "connect_with_person", passed: await test("connect_with_person (check only)", async () => {
    const btn = page.locator("button:has-text('Connect'), button[aria-label^='Invite']").first();
    const visible = await btn.isVisible().catch(() => false);
    console.log(` -> Connect button ${visible ? "visible" : "not visible (may already be connected)"}`);
  })});

  // 6. smart_connect components (search by school/field)
  results.push({ tool: "smart_connect (search)", passed: await test("smart_connect (search)", async () => {
    await page.goto("https://www.linkedin.com/search/results/people/?keywords=E-JUST", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2000);
    const count = await page.locator("li.reusable-search__result-container").count();
    console.log(` -> found ${count} results for E-JUST`);
  })});

  // Print summary
  console.log("\n=== TEST RESULTS ===");
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  for (const r of results) {
    console.log(`  ${r.passed ? "✅" : "❌"} ${r.tool}`);
  }
  console.log(`\nPassed: ${passed}/${results.length}`);
  if (failed > 0) console.log(`Failed: ${failed}`);
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
