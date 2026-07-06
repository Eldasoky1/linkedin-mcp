import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getPage } from "../browser.js";
import { safeInteract } from "../utils/scraper.js";
import { Page } from "playwright";

async function clickEditIfPresent(page: Page) {
  const editBtn = page
    .locator("button:has-text('Edit')")
    .or(page.locator("[aria-label='Edit']"))
    .or(page.locator("button[aria-label*='Edit']"))
    .or(page.locator("icon-button[aria-label*='Edit']"))
    .or(page.locator("button.artdeco-pencil__button"))
    .first();
  if (await editBtn.isVisible().catch(() => false)) {
    await editBtn.click();
    await page.waitForTimeout(1500);
  }
}

async function typeInProseMirror(page: Page, text: string) {
  await clickEditIfPresent(page);
  const editor = page
    .locator(
      "div.tiptap.ProseMirror, " +
        "div.ql-editor[contenteditable='true'], " +
        "[contenteditable='true'][role='textbox'], " +
        "div[contenteditable='true']"
    )
    .first();
  await editor.waitFor({ state: "visible", timeout: 15000 });
  await editor.click();
  await page.keyboard.press("Control+a");
  await page.keyboard.press("Delete");
  await page.waitForTimeout(500);
  await page.keyboard.type(text, { delay: 3 });
}

async function clickSave(dryRun: boolean): Promise<string> {
  if (dryRun) return "DRY RUN: Would have clicked Save.";
  const page = await getPage();
  const saveBtn = page
    .locator("button:has-text('Save')")
    .or(page.locator("[role='button']:has-text('Save')"))
    .or(page.locator("button[type='submit']"))
    .first();
  await saveBtn.waitFor({ state: "visible", timeout: 10000 });
  await saveBtn.click({ timeout: 10000 });
  await page.waitForTimeout(3000);
  return "Save clicked successfully.";
}

async function addLinkedInSkill(page: Page, skill: string) {
  const addBtn = page
    .locator("button:has-text('Add a skill')")
    .or(page.locator("button:has-text('Add skill')"))
    .or(page.locator("[role='button']:has-text('Add a skill')"))
    .first();
  await addBtn.waitFor({ state: "visible", timeout: 10000 });
  await addBtn.click();
  await page.waitForTimeout(1000);

  const input = page
    .locator("input[type='text']")
    .or(page.locator("input[placeholder*='skill']"))
    .or(page.locator("input[placeholder*='Skill']"))
    .first();
  await input.waitFor({ state: "visible", timeout: 10000 });
  await input.fill(skill);
  await page.waitForTimeout(1500);

  const suggestion = page
    .locator("[role='option']:has-text('" + skill.split(" ")[0] + "')")
    .or(page.locator("li[role='option']").first())
    .first();
  if (await suggestion.isVisible().catch(() => false)) {
    await suggestion.click();
  }
  await page.waitForTimeout(800);
}

export function registerProfileEditTools(server: McpServer) {
  server.tool(
    "update_profile_text",
    "Update LinkedIn profile Headline and/or About section via direct URL navigation.",
    {
      headline: z.string().max(220).optional().describe("The new headline text"),
      about: z.string().max(2600).optional().describe("The new about section text"),
      dryRun: z.boolean().optional().default(false).describe("If true, fill fields but skip Save."),
    },
    async ({ headline, about, dryRun }) => {
      const response = await safeInteract("update_profile_text", async () => {
        const results: string[] = [];
        const page = await getPage();

        if (headline) {
          try {
            await page.goto(
              "https://www.linkedin.com/in/me/edit/intro/"
            );
            await page.waitForLoadState("domcontentloaded");
            await page.waitForTimeout(4000);
            await typeInProseMirror(page, headline);
            const saveResult = await clickSave(dryRun);
            results.push(`Headline: filled. ${saveResult}`);
          } catch (e: any) {
            results.push(`Headline failed: ${e.message}`);
          }
        }

        if (about) {
          try {
            await page.goto(
              "https://www.linkedin.com/in/me/edit/forms/summary/new/?profileFormEntryPoint=GUIDANCE_CARD"
            );
            await page.waitForLoadState("domcontentloaded");
            await page.waitForTimeout(4000);
            await typeInProseMirror(page, about);
            const saveResult = await clickSave(dryRun);
            results.push(`About: filled. ${saveResult}`);
          } catch (e: any) {
            results.push(`About failed: ${e.message}`);
          }
        }

        return {
          status: results.length ? results.join(" | ") : "No updates requested.",
          dryRun,
        };
      });

      return {
        content: [
          { type: "text" as const, text: JSON.stringify(response, null, 2) },
        ],
      };
    }
  );

  server.tool(
    "add_experience_block",
    "Add a new experience position to the LinkedIn profile via direct URL.",
    {
      title: z.string().describe("Job title"),
      company: z.string().describe("Company name"),
      description: z.string().describe("Bullet points or description text"),
      dryRun: z.boolean().optional().default(false).describe("If true, fill fields but skip Save."),
    },
    async ({ title, company, description, dryRun }) => {
      const response = await safeInteract("add_experience_block", async () => {
        const page = await getPage();
        await page.goto(
          "https://www.linkedin.com/in/me/edit/forms/position/new/"
        );
        await page.waitForLoadState("domcontentloaded");
        await page.waitForTimeout(4000);

        const titleInput = page
          .locator("input[placeholder*='Ex:']")
          .first();
        await titleInput.waitFor({ state: "visible", timeout: 10000 });
        await titleInput.fill(title);

        const companyInput = page
          .locator("input[placeholder*='Ex: Microsoft']")
          .first();
        await companyInput.fill(company);
        await page.waitForTimeout(1500);
        await page.keyboard.press("ArrowDown");
        await page.keyboard.press("Enter");
        await page.waitForTimeout(1000);

        await typeInProseMirror(page, description);

        const saveResult = await clickSave(dryRun);
        return {
          status: `Experience block: ${title} at ${company}. ${saveResult}`,
          dryRun,
        };
      });

      return {
        content: [
          { type: "text" as const, text: JSON.stringify(response, null, 2) },
        ],
      };
    }
  );

  server.tool(
    "update_profile",
    "Update LinkedIn profile Headline and/or About section. Uses direct URL navigation for reliability.",
    {
      headline: z.string().max(220).optional().describe("The new headline text"),
      about: z.string().max(2600).optional().describe("The new about section text"),
      dryRun: z.boolean().optional().default(false).describe("If true, fill fields but skip Save."),
    },
    async ({ headline, about, dryRun }) => {
      const response = await safeInteract("update_profile", async () => {
        const results: string[] = [];
        const page = await getPage();

        if (headline) {
          try {
            await page.goto(
              "https://www.linkedin.com/in/me/edit/intro/"
            );
            await page.waitForLoadState("domcontentloaded");
            await page.waitForTimeout(4000);
            await typeInProseMirror(page, headline);
            const saveResult = await clickSave(dryRun);
            results.push(`Headline: filled. ${saveResult}`);
          } catch (e: any) {
            results.push(`Headline failed: ${e.message}`);
          }
        }

        if (about) {
          try {
            await page.goto(
              "https://www.linkedin.com/in/me/edit/forms/summary/new/?profileFormEntryPoint=GUIDANCE_CARD"
            );
            await page.waitForLoadState("domcontentloaded");
            await page.waitForTimeout(4000);
            await typeInProseMirror(page, about);
            const saveResult = await clickSave(dryRun);
            results.push(`About: filled. ${saveResult}`);
          } catch (e: any) {
            results.push(`About failed: ${e.message}`);
          }
        }

        return {
          status: results.length ? results.join(" | ") : "No updates requested.",
          dryRun,
        };
      });

      return {
        content: [
          { type: "text" as const, text: JSON.stringify(response, null, 2) },
        ],
      };
    }
  );

  server.tool(
    "edit_headline",
    "Update only the LinkedIn profile Headline. Uses direct URL navigation for reliability.",
    {
      headline: z.string().max(220).describe("The new headline text"),
      dryRun: z.boolean().optional().default(false).describe("If true, fill fields but skip Save."),
    },
    async ({ headline, dryRun }) => {
      const response = await safeInteract("edit_headline", async () => {
        const page = await getPage();
        await page.goto(
          "https://www.linkedin.com/in/me/edit/intro/"
        );
        await page.waitForLoadState("domcontentloaded");
        await page.waitForTimeout(4000);
        await typeInProseMirror(page, headline);
        const saveResult = await clickSave(dryRun);
        return { status: `Headline filled. ${saveResult}`, dryRun };
      });

      return {
        content: [
          { type: "text" as const, text: JSON.stringify(response, null, 2) },
        ],
      };
    }
  );

  server.tool(
    "update_experience",
    "Add or update an experience position on the LinkedIn profile. Uses direct URL navigation for reliability.",
    {
      title: z.string().describe("Job title"),
      company: z.string().describe("Company name"),
      description: z.string().describe("Bullet points or description text"),
      dryRun: z.boolean().optional().default(false).describe("If true, fill fields but skip Save."),
    },
    async ({ title, company, description, dryRun }) => {
      const response = await safeInteract("update_experience", async () => {
        const page = await getPage();
        await page.goto(
          "https://www.linkedin.com/in/me/edit/forms/position/new/"
        );
        await page.waitForLoadState("domcontentloaded");
        await page.waitForTimeout(4000);

        const titleInput = page
          .locator("input[placeholder*='Ex:']")
          .first();
        await titleInput.waitFor({ state: "visible", timeout: 10000 });
        await titleInput.fill(title);

        const companyInput = page
          .locator("input[placeholder*='Ex: Microsoft']")
          .first();
        await companyInput.fill(company);
        await page.waitForTimeout(1500);
        await page.keyboard.press("ArrowDown");
        await page.keyboard.press("Enter");
        await page.waitForTimeout(1000);

        await typeInProseMirror(page, description);

        const saveResult = await clickSave(dryRun);
        return {
          status: `Experience: ${title} at ${company}. ${saveResult}`,
          dryRun,
        };
      });

      return {
        content: [
          { type: "text" as const, text: JSON.stringify(response, null, 2) },
        ],
      };
    }
  );

  server.tool(
    "add_skill",
    "Add one or more skills to the LinkedIn profile. Navigates to the skills edit page, adds each skill via the autocomplete, and saves.",
    {
      skills: z.array(z.string()).min(1).max(50).describe("Skill names to add (e.g. FastAPI, PostgreSQL)"),
      category: z.string().optional().describe("Optional category label shown in the response only"),
      dryRun: z.boolean().optional().default(false).describe("If true, simulate adding skills without saving."),
    },
    async ({ skills, category, dryRun }) => {
      const response = await safeInteract("add_skill", async () => {
        const page = await getPage();
        await page.goto("https://www.linkedin.com/in/me/edit/skills/");
        await page.waitForLoadState("domcontentloaded");
        await page.waitForTimeout(4000);

        const added: string[] = [];
        const failed: string[] = [];

        for (const skill of skills) {
          try {
            await addLinkedInSkill(page, skill);
            added.push(skill);
          } catch (e: any) {
            failed.push(`${skill} (${e.message})`);
          }
          if (!dryRun) {
            const saveResult = await clickSave(false);
          }
        }

        if (dryRun) {
          return {
            status: `DRY RUN: Would have added ${skills.length} skill(s).`,
            dryRun: true,
            skills,
            category: category || null,
          };
        }

        return {
          status: `Added ${added.length} skill(s).${failed.length ? ` Failed: ${failed.join(", ")}` : ""}`,
          added,
          failed: failed.length ? failed : undefined,
          category: category || null,
          dryRun: false,
        };
      });

      return {
        content: [
          { type: "text" as const, text: JSON.stringify(response, null, 2) },
        ],
      };
    }
  );
}
