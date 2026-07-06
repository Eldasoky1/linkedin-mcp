import { initBrowser, getPage, getContext, recoverSession } from "./dist/browser.js";
import fs from "fs";

function randomDelay(minSec, maxSec) {
  const ms = Math.floor(Math.random() * (maxSec - minSec + 1) + minSec) * 1000;
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function safeGoto(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(3000);
  const currentUrl = page.url();
  if (currentUrl.includes("/login") || currentUrl.includes("/checkpoint")) {
    console.log("  Session expired or CAPTCHA. Attempting recovery...");
    const recovered = await recoverSession();
    if (!recovered) throw new Error("Session recovery failed");
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2000);
  }
}

async function scrollToBottom(page) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2000);
}

async function extractSchools(page) {
  const items = [];
  const loc = page.locator("section#education li, [data-field='education'] li, section.education-section li");
  const n = await loc.count();
  for (let i = 0; i < n; i++) {
    const t = await loc.nth(i).textContent().catch(() => null);
    if (t) items.push(t.trim());
  }
  return items;
}

async function extractCompanies(page) {
  const items = [];
  const loc = page.locator("section#experience li, [data-field='experience'] li, section.experience-section li");
  const n = await loc.count();
  for (let i = 0; i < n; i++) {
    const t = await loc.nth(i).textContent().catch(() => null);
    if (t) items.push(t.trim());
  }
  return items;
}

async function searchPeople(page, query, resultLimit, seenUrls) {
  const url = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`;
  await safeGoto(page, url);

  const profileLinks = page.locator("a[href*='/in/']");
  const linkCount = await profileLinks.count();
  const found = [];
  const processed = new Set();

  for (let i = 0; i < linkCount && found.length < resultLimit; i++) {
    const link = profileLinks.nth(i);
    const href = await link.getAttribute("href").catch(() => null);
    const text = (await link.textContent())?.trim() ?? "";
    if (!href || !text || text.includes("•") || text.length < 3) continue;

    const cleanUrl = href.split("?")[0];
    if (seenUrls.has(cleanUrl) || processed.has(cleanUrl)) continue;
    processed.add(cleanUrl);

    const li = await link.evaluate(el => {
      let p = el.closest("li");
      return p ? p.innerText : null;
    }).catch(() => null);

    let headline = "";
    if (li) {
      const lines = li.split("\n").filter(l => l.trim());
      const nameParts = text.trim();
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.includes(nameParts) && trimmed.length > 5 && trimmed.length < 200) {
          headline = trimmed;
          break;
        }
      }
    }

    seenUrls.add(cleanUrl);
    found.push({ name: text.trim(), headline, profileUrl: cleanUrl });
  }
  return found;
}

async function main() {
  console.log("Initializing browser...");
  await initBrowser();
  const page = getPage();
  console.log("Browser ready.");

  // 1. Get my profile
  console.log("\n--- Getting my profile ---");
  await page.goto("https://www.linkedin.com/in/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(5000);
  const currentUrl = page.url();
  console.log("  Current URL:", currentUrl);

  if (currentUrl.includes("/login") || currentUrl.includes("/checkpoint")) {
    console.log("  Session expired or CAPTCHA. Attempting recovery...");
    const recovered = await recoverSession();
    if (!recovered) throw new Error("Session recovery failed - check your LinkedIn credentials and cookies.");
    await page.goto("https://www.linkedin.com/in/", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(3000);
    console.log("  After recovery URL:", page.url());
  }

  let myName = await page.locator("h2:has-text('Ahmed')").first().textContent().catch(() => null);
  if (!myName) {
    const h2s = await page.locator("h2").all();
    for (const h of h2s) {
      const t = (await h.textContent())?.trim() ?? "";
      if (t.length > 3 && t !== "0 notifications" && !t.includes("Suggested") && !t.includes("Analytics") && !t.includes("About") && !t.includes("Activity")) {
        myName = t;
        break;
      }
    }
  }
  if (!myName) myName = "Unknown";
  myName = myName.trim();

  let myHeadline = await page.locator("div.text-body-medium").first().textContent().catch(() => null);
  if (!myHeadline) myHeadline = await page.locator("div[class*='headline'], div[class*='subtitle']").first().textContent().catch(() => null);
  if (!myHeadline) myHeadline = "Unknown";
  myHeadline = myHeadline.trim();

  await scrollToBottom(page);
  const mySchools = await extractSchools(page);
  const myCompanies = await extractCompanies(page);

  console.log(`Name: ${myName}`);
  console.log(`Headline: ${myHeadline}`);
  console.log(`Schools: ${mySchools.join(", ")}`);
  console.log(`Companies: ${myCompanies.join(", ")}`);

  // 2. Search for people
  console.log("\n--- Searching for people ---");
  const seenUrls = new Set();
  const candidates = [];

  for (const school of mySchools) {
    const short = school.split(",")[0].split("University")[0].split("College")[0].split("Institute")[0].trim();
    if (short.length > 2) {
      console.log(`  Searching school: "${short}"`);
      const results = await searchPeople(page, short, 50, seenUrls);
      candidates.push(...results);
      console.log(`  Found ${results.length} candidates`);
    }
  }

  const fieldKeywords = [];
  for (const c of myCompanies) {
    const parts = c.split("\n").filter(Boolean);
    fieldKeywords.push(...parts.map(p => p.split(",")[0].trim()).filter(p => p.length > 2));
  }
  if (myHeadline) {
    fieldKeywords.push(myHeadline.split(" at ")[0].split(" | ")[0].split(" - ")[0].trim());
  }

  for (const kw of [...new Set(fieldKeywords)].slice(0, 3)) {
    console.log(`  Searching field: "${kw}"`);
    const results = await searchPeople(page, kw, 50, seenUrls);
    candidates.push(...results);
    console.log(`  Found ${results.length} candidates`);
  }

  console.log(`\nTotal unique candidates: ${candidates.length}`);

  if (candidates.length === 0) {
    console.log("No candidates found. Exiting.");
    return;
  }

  // 3. Check profiles & prioritize
  console.log("\n--- Checking profiles ---");
  const enriched = [];

  for (const [idx, c] of candidates.entries()) {
    console.log(`  [${idx + 1}/${candidates.length}] ${c.name}`);
    try {
      await safeGoto(page, c.profileUrl);
      await scrollToBottom(page);

      const schools = await extractSchools(page);
      const companies = await extractCompanies(page);

      let priority = 0;
      let reason = "";

      const schoolMatch = schools.some(sch =>
        mySchools.some(mySch =>
          sch.toLowerCase().includes(mySch.toLowerCase()) || mySch.toLowerCase().includes(sch.toLowerCase())
        )
      );
      if (schoolMatch) { priority = 2; reason = "same university"; }

      if (priority === 0) {
        const fieldMatch = companies.some(c2 =>
          myCompanies.some(mc =>
            c2.toLowerCase().includes(mc.toLowerCase()) || mc.toLowerCase().includes(c2.toLowerCase())
          )
        );
        if (fieldMatch) { priority = 1; reason = "same industry"; }
      }

      if (priority === 0) {
        const hm = c.headline && myHeadline &&
          (c.headline.toLowerCase().includes(myHeadline.toLowerCase().split(" ").slice(0, 3).join(" ").trim()) ||
           myHeadline.toLowerCase().includes(c.headline.toLowerCase().split(" ").slice(0, 3).join(" ").trim()));
        if (hm) { priority = 1; reason = "similar field"; }
      }

      enriched.push({ ...c, schools, companies, priority, reason: reason || "professional interest" });
    } catch (err) {
      console.log(`    Error: ${err.message}`);
    }
  }

  enriched.sort((a, b) => b.priority - a.priority);

  const priorityCount = { "Same university": 0, "Same field": 0, Other: 0 };
  enriched.forEach(p => {
    if (p.priority === 2) priorityCount["Same university"]++;
    else if (p.priority === 1) priorityCount["Same field"]++;
    else priorityCount.Other++;
  });
  console.log(`\nPriority breakdown:`, JSON.stringify(priorityCount));

  const maxToSend = Math.min(50, enriched.length);
  const csvRows = [["Name", "LinkedIn URL", "Priority", "Reason", "Status"]];

  console.log(`\n--- Sending ${maxToSend} connection requests ---`);
  for (const [index, person] of enriched.slice(0, maxToSend).entries()) {
    if (index > 0) await randomDelay(5, 10);

    console.log(`  [${index + 1}/${maxToSend}] ${person.name} (${person.reason})`);

    try {
      await safeGoto(page, person.profileUrl);

      const connectBtn = page.locator("button:has-text('Connect'), button[aria-label^='Invite']").first();
      if (!(await connectBtn.isVisible().catch(() => false))) {
        const status = "Already connected or no Connect button";
        csvRows.push([person.name, person.profileUrl, person.priority === 2 ? "Same university" : person.priority === 1 ? "Same field" : "Other", person.reason, status]);
        console.log(`    ${status}`);
        continue;
      }
      await connectBtn.click();
      await page.waitForTimeout(1000);

      const note = `Hi ${person.name.split(" ")[0]}, I noticed we share ${person.reason}. I'd love to connect and grow our professional network!`;

      const addNoteBtn = page.locator("button:has-text('Add a note')");
      if (await addNoteBtn.isVisible()) {
        await addNoteBtn.click();
        await page.waitForTimeout(500);
        await page.locator("textarea[name='message']").fill(note);
        await page.waitForTimeout(300);
      }
      await page.locator("button:has-text('Send')").last().click();
      await page.waitForTimeout(3000);

      csvRows.push([person.name, person.profileUrl, person.priority === 2 ? "Same university" : person.priority === 1 ? "Same field" : "Other", person.reason, "Connection sent"]);
      console.log(`    Sent ✅`);
    } catch (err) {
      csvRows.push([person.name, person.profileUrl, person.priority === 2 ? "Same university" : person.priority === 1 ? "Same field" : "Other", person.reason, `Failed: ${err.message}`]);
      console.log(`    Failed: ${err.message}`);
    }
  }

  const csvContent = csvRows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
  const csvPath = "C:\\Users\\engAh\\OneDrive\\Desktop\\smart_connect_results.csv";
  fs.writeFileSync(csvPath, csvContent, "utf-8");
  console.log(`\n✅ CSV saved to: ${csvPath}`);

  const sent = csvRows.slice(1).filter(r => r[4] === "Connection sent").length;
  const already = csvRows.slice(1).filter(r => r[4].includes("Already connected")).length;
  const failed = csvRows.slice(1).filter(r => r[4].startsWith("Failed")).length;
  console.log(`✅ Sent: ${sent} | Already connected: ${already} | Failed: ${failed}`);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
