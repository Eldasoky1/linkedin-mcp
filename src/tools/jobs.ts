import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getPage } from "../browser.js";
import { safeInteract } from "../utils/scraper.js";

export function registerJobTools(server: McpServer) {
  server.tool(
    "search_jobs",
    "Search for job listings",
    {
      query: z.string(),
      location: z.string().optional().default("Worldwide"),
      limit: z.number().optional().default(5),
    },
    async ({ query, location, limit }) => {
      const response = await safeInteract(`search_jobs ${query}`, async () => {
        const page = await getPage();
        const url = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`;
        await page.goto(url);
        await page.waitForLoadState("networkidle");

        const jobs = page.locator("li.jobs-search-results__list-item");
        const count = await jobs.count();
        const items = [];

        for (let i = 0; i < Math.min(count, limit); i++) {
          const job = jobs.nth(i);
          const title = await job.locator("a.job-card-list__title").first().textContent().catch(() => null);
          const company = await job.locator("span.job-card-container__primary-description").first().textContent().catch(() => null);
          const jobUrl = await job.locator("a.job-card-list__title").first().getAttribute("href").catch(() => null);

          items.push({
            title: title?.trim() ?? "Unknown",
            company: company?.trim() ?? "Unknown",
            url: jobUrl ? `https://www.linkedin.com${jobUrl.split("?")[0]}` : null,
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
    "get_job_details",
    "Get full descriptions of a job given its URL",
    { jobUrl: z.string().url() },
    async ({ jobUrl }) => {
      const response = await safeInteract(`get_job_details ${jobUrl}`, async () => {
        const page = await getPage();
        await page.goto(jobUrl);
        await page.waitForLoadState("networkidle");

        const description = await page.locator("div.jobs-description__content").first().textContent().catch(() => null);
        
        return {
          description: description?.trim() ?? "Description not found",
        };
      });

      return {
        content: [{ type: "text" as const, text: JSON.stringify(response, null, 2) }],
      };
    }
  );
}
