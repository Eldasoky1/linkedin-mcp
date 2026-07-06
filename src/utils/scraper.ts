import { getPage, recoverSession } from "../browser.js";
import { failure, ToolResult } from "./types.js";

export async function safeInteract<T>(
  actionName: string,
  actionFn: () => Promise<T>
): Promise<ToolResult<T>> {
  const MAX_RETRIES = 1;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await actionFn();
      return { success: true, data: result };
    } catch (error: any) {
      console.error(`[Scraper Error - ${actionName}]:`, error.message);

      try {
        const page = await getPage();
        const url = page.url();
        if (url.includes("/checkpoint/challenge")) {
          return failure(
            `Interaction failed: ${error.message}`,
            "Hit CAPTCHA or security checkpoint. Wait and retry."
          );
        }
        if (
          attempt < MAX_RETRIES &&
          (url.includes("/login") || url.includes("linkedin.com/home"))
        ) {
          console.error("Session expired, attempting recovery...");
          const recovered = await recoverSession();
          if (recovered) {
            console.error("Recovery successful, retrying...");
            continue;
          }
        }
      } catch {
        console.error("[Scraper Error] Browser unreachable even for diagnostics.");
      }

      return failure(
        `Failed during ${actionName}`,
        "DOM may have changed or timeout exceeded. Ensure URL is correct."
      );
    }
  }

  return failure(
    `Failed during ${actionName}`,
    "All retry attempts exhausted."
  );
}
