import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getPage } from "../browser.js";
import { safeInteract } from "../utils/scraper.js";

export function registerProfileTools(server: McpServer) {
  server.tool(
    "get_my_profile",
    "Fetch logged-in user's LinkedIn profile details",
    {},
    async () => {
      const response = await safeInteract("get_my_profile", async () => {
        const page = await getPage();
        await page.goto("https://www.linkedin.com/in/");
        await page.waitForSelector("h1.text-heading-xlarge", { timeout: 15000 });

        const name = await page.locator("h1.text-heading-xlarge").first().textContent();
        const headline = await page.locator("div.text-body-medium").first().textContent();
        const about = await page.locator("div#about").locator("..").locator("span.visually-hidden").first().textContent().catch(() => null);

        return {
          name: name?.trim() ?? "Unknown",
          headline: headline?.trim() ?? "Unknown",
          about: about?.trim() ?? null,
        };
      });

      return {
        content: [{ type: "text" as const, text: JSON.stringify(response, null, 2) }],
      };
    }
  );

  server.tool(
    "get_my_profile_full",
    "Fetch logged-in user's full LinkedIn profile including education and experience",
    {},
    async () => {
      const response = await safeInteract("get_my_profile_full", async () => {
        const page = await getPage();
        await page.goto("https://www.linkedin.com/in/");
        await page.waitForSelector("h1.text-heading-xlarge", { timeout: 15000 });

        const name = (await page.locator("h1.text-heading-xlarge").first().textContent())?.trim() ?? "Unknown";
        const headline = (await page.locator("div.text-body-medium").first().textContent())?.trim() ?? "Unknown";

        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(2000);

        const schools: string[] = [];
        const eduItems = page.locator("section#education li, [data-field='education'] li, section.education-section li");
        const eduCount = await eduItems.count();
        for (let i = 0; i < eduCount; i++) {
          const text = await eduItems.nth(i).textContent().catch(() => null);
          if (text) schools.push(text.trim());
        }

        const companies: string[] = [];
        const expItems = page.locator("section#experience li, [data-field='experience'] li, section.experience-section li");
        const expCount = await expItems.count();
        for (let i = 0; i < expCount; i++) {
          const text = await expItems.nth(i).textContent().catch(() => null);
          if (text) companies.push(text.trim());
        }

        return { name, headline, schools, companies };
      });

      return {
        content: [{ type: "text" as const, text: JSON.stringify(response, null, 2) }],
      };
    }
  );

  server.tool(
    "get_person_profile",
    "Fetch another user's LinkedIn profile details",
    { profileUrl: z.string().url() },
    async ({ profileUrl }) => {
      const response = await safeInteract(`get_person_profile ${profileUrl}`, async () => {
        const page = await getPage();
        await page.goto(profileUrl);
        await page.waitForLoadState("networkidle");

        const name = await page.locator("h1.text-heading-xlarge").first().textContent();
        const headline = await page.locator("div.text-body-medium").first().textContent();

        return {
          name: name?.trim() ?? "Unknown",
          headline: headline?.trim() ?? "Unknown",
        };
      });

      return {
        content: [{ type: "text" as const, text: JSON.stringify(response, null, 2) }],
      };
    }
  );

  server.tool(
    "get_person_profile_full",
    "Fetch another user's full LinkedIn profile including education and experience",
    { profileUrl: z.string().url() },
    async ({ profileUrl }) => {
      const response = await safeInteract(`get_person_profile_full ${profileUrl}`, async () => {
        const page = await getPage();
        await page.goto(profileUrl);
        await page.waitForLoadState("networkidle");

        const name = (await page.locator("h1.text-heading-xlarge").first().textContent())?.trim() ?? "Unknown";
        const headline = (await page.locator("div.text-body-medium").first().textContent())?.trim() ?? "Unknown";

        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(2000);

        const schools: string[] = [];
        const eduItems = page.locator("section#education li, [data-field='education'] li, section.education-section li");
        const eduCount = await eduItems.count();
        for (let i = 0; i < eduCount; i++) {
          const text = await eduItems.nth(i).textContent().catch(() => null);
          if (text) schools.push(text.trim());
        }

        const companies: string[] = [];
        const expItems = page.locator("section#experience li, [data-field='experience'] li, section.experience-section li");
        const expCount = await expItems.count();
        for (let i = 0; i < expCount; i++) {
          const text = await expItems.nth(i).textContent().catch(() => null);
          if (text) companies.push(text.trim());
        }

        return { name, headline, schools, companies };
      });

      return {
        content: [{ type: "text" as const, text: JSON.stringify(response, null, 2) }],
      };
    }
  );
}
