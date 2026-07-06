import { initBrowser, getPage } from "../src/browser.js";

async function main() {
  await initBrowser();
  const page = getPage();
  console.log("Logged in. URL:", page.url());

  await page.goto(
    "https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/",
    { waitUntil: "domcontentloaded" }
  );
  await page.waitForTimeout(5000);
  console.log("Profile URL:", page.url());

  // ===== VERIFY EXPERIENCE ENTRIES =====
  const experienceSection = await page.evaluate(() => {
    // Find the experience section
    const sections = document.querySelectorAll("section");
    let expSection: Element | null = null;
    for (const s of Array.from(sections)) {
      if (s.querySelector("h2")?.innerText?.includes("Experience") || 
          s.querySelector("h2")?.innerText?.includes("experience")) {
        expSection = s;
        break;
      }
    }
    if (!expSection) {
      // Try finding by ID
      expSection = document.querySelector("#experience-section, section[id*='experience']");
    }
    if (!expSection) return "Experience section not found";

    const items = expSection.querySelectorAll("li, div[data-view-name*='profile-component'], div[data-section='experience'] > div, .pvs-entity");
    const results: string[] = [];
    for (const item of Array.from(items)) {
      const text = (item as HTMLElement).innerText?.trim() || "";
      if (text && text.length > 5 && text.length < 500) {
        results.push(text.substring(0, 200));
      }
    }
    return results.length > 0 ? results : "No experience items found in section";
  });

  console.log("\n=== EXPERIENCE SECTION ===");
  if (Array.isArray(experienceSection)) {
    for (const e of experienceSection) {
      console.log(`  - ${e}`);
    }
  } else {
    console.log(`  ${experienceSection}`);
  }

  // ===== FIND SKILLS SECTION / EDIT URL =====
  const skillsInfo = await page.evaluate(() => {
    // Find skills section
    const allText = document.body.innerText || "";
    const hasSkills = allText.includes("Skills") || allText.includes("skills");
    
    // Find edit/skills links
    const links: string[] = [];
    document.querySelectorAll("a[href*='skill'], a[href*='detail/skills'], a[aria-label*='skill' i]").forEach(a => {
      links.push(`href="${(a as HTMLAnchorElement).href}" text="${a.textContent?.trim().substring(0, 60)}" aria="${a.getAttribute('aria-label') || ''}"`);
    });
    
    return { hasSkills, links };
  });

  console.log("\n=== SKILLS INFO ===");
  console.log("  Has skills on page:", skillsInfo.hasSkills);
  for (const l of skillsInfo.links) {
    console.log("  ", l);
  }

  // ===== CHECK FOR ADD SKILLS URL =====
  const addSkillsLinks = await page.evaluate(() => {
    const results: string[] = [];
    document.querySelectorAll("a[href*='skill'], a[href*='detail/skills'], a[href*='add'], a[href*='edit/forms']").forEach(a => {
      const href = (a as HTMLAnchorElement).href || "";
      results.push(`href="${href}" text="${a.textContent?.trim().substring(0, 60)}"`);
    });
    return results;
  });

  console.log("\n=== ALL RELEVANT LINKS ===");
  for (const l of addSkillsLinks) {
    console.log("  ", l);
  }

  // ===== CHECK ALL SECTIONS =====
  const allSections = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("section")).map(s => {
      const h2 = s.querySelector("h2");
      return h2?.innerText?.trim() || "(no h2)";
    }).filter(t => t);
  });

  console.log("\n=== PROFILE SECTIONS ===");
  for (const s of allSections) {
    console.log("  -", s);
  }

  process.exit(0);
}

main().catch(e => {
  console.error("Error:", e);
  process.exit(1);
});
