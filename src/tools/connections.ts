import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getPage } from "../browser.js";
import { safeInteract } from "../utils/scraper.js";

function randomDelay(minSec: number, maxSec: number): Promise<void> {
  const ms = Math.floor(Math.random() * (maxSec - minSec + 1) + minSec) * 1000;
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function registerConnectionTools(server: McpServer) {
  server.tool(
    "search_people",
    "Search for people on LinkedIn",
    {
      query: z.string().describe("Search keywords"),
      limit: z.number().optional().default(5).describe("Max results"),
    },
    async ({ query, limit }) => {
      const response = await safeInteract("search_people", async () => {
        const page = await getPage();
        const url = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`;
        await page.goto(url);
        await page.waitForLoadState("networkidle");

        const profileLinks = page.locator("a[href*='/in/']");
        const linkCount = await profileLinks.count();
        const items = [];
        const processed = new Set<string>();

        for (let i = 0; i < linkCount && items.length < limit; i++) {
          const link = profileLinks.nth(i);
          const href = await link.getAttribute("href").catch(() => null);
          const text = (await link.textContent())?.trim() ?? "";
          if (!href || !text || text.includes("•") || text.length < 3) continue;

          const cleanUrl = href.split("?")[0];
          if (processed.has(cleanUrl)) continue;
          processed.add(cleanUrl);

          const li = await link.evaluate(el => {
            let p = el.closest("li");
            return p ? (p as HTMLElement).innerText : null;
          }).catch(() => null);

          let title = "";
          if (li) {
            const lines = li.split("\n").filter(l => l.trim());
            const nameParts = text.trim();
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed && !trimmed.includes(nameParts) && trimmed.length > 5 && trimmed.length < 200) {
                title = trimmed;
                break;
              }
            }
          }

          items.push({
            name: text.trim(),
            title: title || null,
            profileUrl: cleanUrl,
          });
        }
        return items;
      });

      return {
        content: [{ type: "text" as const, text: JSON.stringify(response, null, 2) }],
      };
    }
  );

  server.tool(
    "connect_with_person",
    "Send a connection request to a specific profile",
    {
      profileUrl: z.string().url(),
      message: z.string().optional().describe("Optional custom note"),
    },
    async ({ profileUrl, message }) => {
      const response = await safeInteract(`connect ${profileUrl}`, async () => {
        const page = await getPage();
        await page.goto(profileUrl);
        await page.waitForLoadState("networkidle");

        const connectBtn = page.locator("button:has-text('Connect'), button[aria-label^='Invite']").first();
        if (await connectBtn.isVisible()) {
          await connectBtn.click();
        } else {
          await page.locator("button[aria-label='More actions']").click();
          await page.locator("div.artdeco-dropdown__content >> text='Connect'").click();
        }

        await page.waitForTimeout(1000);

        if (message) {
          const addNoteBtn = page.locator("button:has-text('Add a note')");
          if (await addNoteBtn.isVisible()) {
            await addNoteBtn.click();
            await page.waitForTimeout(500);
            await page.locator("textarea[name='message']").fill(message);
            await page.waitForTimeout(300);
          }
          await page.locator("button:has-text('Send')").last().click();
        } else {
          const sendNow = page.locator("button[aria-label='Send now'], button:has-text('Send without a note')");
          if (await sendNow.isVisible()) {
            await sendNow.click();
          } else {
            await page.locator("button:has-text('Send')").last().click();
          }
        }

        return { status: "Connection request sent" };
      });

      return {
        content: [{ type: "text" as const, text: JSON.stringify(response, null, 2) }],
      };
    }
  );

  server.tool(
    "smart_connect",
    "Automatically search for people by your university and field, prioritize them, and send connection requests with personalized notes. Searches LinkedIn using your own profile data — no suggestions needed.",
    {
      maxConnections: z.number().optional().default(1000).describe("Max connection requests to send (default 1000)"),
      messageTemplate: z.string().optional().default("Hi {name}, I noticed we share {reason}. I'd love to connect and grow our professional network!").describe("Template for the connection note. Use {name} and {reason} placeholders."),
      perSchool: z.number().optional().default(50).describe("How many people to fetch per school search"),
      perField: z.number().optional().default(50).describe("How many people to fetch per field search"),
    },
    async ({ maxConnections, messageTemplate, perSchool, perField }) => {
      const response = await safeInteract("smart_connect", async () => {
        const page = await getPage();

        // 1. Get my own profile info
        await page.goto("https://www.linkedin.com/in/");
        await page.waitForSelector("h1.text-heading-xlarge", { timeout: 15000 });
        const myHeadline = (await page.locator("div.text-body-medium").first().textContent())?.trim() ?? "";

        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(2000);

        const mySchools: string[] = [];
        const myCompanies: string[] = [];
        const eduItems = page.locator("section#education li, [data-field='education'] li, section.education-section li");
        const eduCount = await eduItems.count();
        for (let i = 0; i < eduCount; i++) {
          const text = await eduItems.nth(i).textContent().catch(() => null);
          if (text) mySchools.push(text.trim());
        }
        const expItems = page.locator("section#experience li, [data-field='experience'] li, section.experience-section li");
        const expCount = await expItems.count();
        for (let i = 0; i < expCount; i++) {
          const text = await expItems.nth(i).textContent().catch(() => null);
          if (text) myCompanies.push(text.trim());
        }

        // 2. Search LinkedIn for people from my schools
        const seenUrls = new Set<string>();
        const candidates: { name: string; headline: string; profileUrl: string }[] = [];

        async function searchPeople(query: string, resultLimit: number) {
          const url = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`;
          await page.goto(url);
          await page.waitForLoadState("networkidle");
          await page.waitForTimeout(2000);

          const profileLinks = page.locator("a[href*='/in/']");
          const linkCount = await profileLinks.count();
          const processed = new Set<string>();

          for (let i = 0; i < linkCount; i++) {
            if (candidates.length >= resultLimit) break;
            const link = profileLinks.nth(i);
            const href = await link.getAttribute("href").catch(() => null);
            const text = (await link.textContent())?.trim() ?? "";
            if (!href || !text || text.includes("•") || text.length < 3) continue;

            const cleanUrl = href.split("?")[0];
            if (seenUrls.has(cleanUrl) || processed.has(cleanUrl)) continue;
            processed.add(cleanUrl);

            const li = await link.evaluate(el => {
              let p = el.closest("li");
              return p ? (p as HTMLElement).innerText : null;
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
            candidates.push({
              name: text.trim(),
              headline: headline || "",
              profileUrl: cleanUrl,
            });
          }
        }

        for (const school of mySchools) {
          const short = school.split(",")[0].split("University")[0].split("College")[0].split("Institute")[0].trim();
          if (short.length > 2) {
            await searchPeople(short, perSchool);
          }
        }

        // 3. Search by industry/field (from my companies and headline)
        const fieldKeywords: string[] = [];
        for (const c of myCompanies) {
          const parts = c.split("\n").filter(Boolean);
          fieldKeywords.push(...parts.map(p => p.split(",")[0].trim()).filter(p => p.length > 2));
        }
        if (myHeadline) {
          fieldKeywords.push(myHeadline.split(" at ")[0].split(" | ")[0].split(" - ")[0].trim());
        }

        for (const kw of [...new Set(fieldKeywords)].slice(0, 3)) {
          await searchPeople(kw, perField);
        }

        if (candidates.length === 0) {
          return { status: "No candidates found from searches." };
        }

        // 4. Check each candidate's profile to verify school/field match
        const enriched: {
          name: string;
          headline: string;
          profileUrl: string;
          schools: string[];
          companies: string[];
          priority: number;
          reason: string;
        }[] = [];

        const toCheck = candidates.slice(0, Math.min(candidates.length, maxConnections * 2));

        for (const c of toCheck) {
          try {
            await page.goto(c.profileUrl);
            await page.waitForLoadState("networkidle");
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await page.waitForTimeout(1500);

            const schools: string[] = [];
            const edu = page.locator("section#education li, [data-field='education'] li, section.education-section li");
            const eduN = await edu.count();
            for (let i = 0; i < eduN; i++) {
              const t = await edu.nth(i).textContent().catch(() => null);
              if (t) schools.push(t.trim());
            }

            const companies: string[] = [];
            const exp = page.locator("section#experience li, [data-field='experience'] li, section.experience-section li");
            const expN = await exp.count();
            for (let i = 0; i < expN; i++) {
              const t = await exp.nth(i).textContent().catch(() => null);
              if (t) companies.push(t.trim());
            }

            let priority = 0;
            let reason = "";

            const schoolMatch = schools.some(sch =>
              mySchools.some(mySch =>
                sch.toLowerCase().includes(mySch.toLowerCase()) || mySch.toLowerCase().includes(sch.toLowerCase())
              )
            );
            if (schoolMatch) {
              priority = 2;
              reason = "the same university";
            }

            if (priority === 0) {
              const fieldMatch = companies.some(c2 =>
                myCompanies.some(mc =>
                  c2.toLowerCase().includes(mc.toLowerCase()) || mc.toLowerCase().includes(c2.toLowerCase())
                )
              );
              if (fieldMatch) {
                priority = 1;
                reason = "the same industry";
              }
            }

            if (priority === 0) {
              const headlineMatch = c.headline && myHeadline &&
                (c.headline.toLowerCase().includes(myHeadline.toLowerCase().split(" ").slice(0, 3).join(" ").trim()) ||
                 myHeadline.toLowerCase().includes(c.headline.toLowerCase().split(" ").slice(0, 3).join(" ").trim()));
              if (headlineMatch) {
                priority = 1;
                reason = "a similar professional field";
              }
            }

            enriched.push({
              name: c.name,
              headline: c.headline,
              profileUrl: c.profileUrl,
              schools,
              companies,
              priority,
              reason: reason || "a shared professional interest",
            });
          } catch {
            // skip profiles that fail to load
          }
        }

        // 5. Sort by priority
        enriched.sort((a, b) => b.priority - a.priority);

        // 6. Send connection requests
        const sent: { name: string; profileUrl: string; priority: number; reason: string; status: string }[] = [];

        for (const [index, person] of enriched.slice(0, maxConnections).entries()) {
          if (index > 0) {
            await randomDelay(5, 10);
          }

          try {
            await page.goto(person.profileUrl);
            await page.waitForLoadState("networkidle");

            const connectBtn = page.locator("button:has-text('Connect'), button[aria-label^='Invite']").first();
            if (!(await connectBtn.isVisible().catch(() => false))) {
              sent.push({ ...person, status: "Already connected or no Connect button" });
              continue;
            }
            await connectBtn.click();
            await page.waitForTimeout(1000);

            const note = messageTemplate
              .replace("{name}", person.name.split(" ")[0])
              .replace("{reason}", person.reason);

            const addNoteBtn = page.locator("button:has-text('Add a note')");
            if (await addNoteBtn.isVisible()) {
              await addNoteBtn.click();
              await page.waitForTimeout(500);
              await page.locator("textarea[name='message']").fill(note);
              await page.waitForTimeout(300);
            }
            await page.locator("button:has-text('Send')").last().click();
            await page.waitForTimeout(3000);

            sent.push({ ...person, status: "Connection request sent" });
          } catch (err: any) {
            sent.push({ ...person, status: `Failed: ${err.message}` });
          }
        }

        return {
          myProfile: { schools: mySchools, companies: myCompanies, headline: myHeadline },
          searchResults: candidates.length,
          profilesChecked: toCheck.length,
          prioritized: enriched.map(p => ({
            name: p.name,
            priority: p.priority === 2 ? "Same university" : p.priority === 1 ? "Same field" : "Other",
            reason: p.reason,
            profileUrl: p.profileUrl,
          })),
          connectionResults: sent,
        };
      });

      return {
        content: [{ type: "text" as const, text: JSON.stringify(response, null, 2) }],
      };
    }
  );
}
