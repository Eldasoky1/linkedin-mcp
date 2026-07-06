import { chromium, Browser, BrowserContext, Page } from "playwright";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

let browser: Browser | null = null;
let context: BrowserContext | null = null;
let page: Page | null = null;

function isBrowserAlive(): boolean {
  if (!browser) return false;
  try {
    return browser.isConnected();
  } catch {
    return false;
  }
}

function isPageAlive(p: Page | null): boolean {
  if (!p) return false;
  try {
    const closed = p.isClosed();
    if (closed) return false;
    p.url();
    return true;
  } catch {
    return false;
  }
}

export async function ensureBrowser(): Promise<Page> {
  if (page && isPageAlive(page)) return page;

  if (browser && isBrowserAlive()) {
    try {
      if (context) {
        try { await context.close(); } catch {}
      }
      context = await browser.newContext({
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        viewport: { width: 1280, height: 800 },
      });
      page = await context.newPage();
    } catch {
      try { await browser.close(); } catch {}
      browser = null;
      context = null;
      page = null;
    }
  }

  return initBrowser().then(() => page!);
}

export async function initBrowser(): Promise<void> {
  if (page && isPageAlive(page)) return;

  try {
    if (context) { try { await context.close(); } catch {} }
    if (browser) { try { await browser.close(); } catch {} }
  } catch {}
  browser = null;
  context = null;
  page = null;

  browser = await chromium.launch({ headless: false });
  context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
  });

  const cookiesPath = process.env.COOKIES_PATH || "./linkedin_cookies.json";

  if (fs.existsSync(cookiesPath)) {
    try {
      const cookies = JSON.parse(fs.readFileSync(cookiesPath, "utf-8"));
      await context.addCookies(cookies);
    } catch (e) {
      console.error("Failed to parse cookies file, starting fresh.");
    }
  }

  page = await context.newPage();

  await page.goto("https://www.linkedin.com/feed/", { timeout: 30000 });
  await page.waitForLoadState("domcontentloaded");

  if (isLoginPage(page)) {
    await loginAndSaveCookies(page, context, cookiesPath);
  }
}

function isLoginPage(p: Page): boolean {
  const url = p.url();
  return (
    url.includes("/login") ||
    url.includes("linkedin.com/home") ||
    url.includes("/checkpoint/challenge")
  );
}

export async function recoverSession(): Promise<boolean> {
  try {
    const p = await ensureBrowser();
    const currentUrl = p.url();
    if (!isLoginPage(p)) return true;

    console.error("Session expired or CAPTCHA hit, attempting recovery...");
    if (currentUrl.includes("/checkpoint/challenge")) {
      console.error("CAPTCHA detected — manual intervention required.");
      return false;
    }

    const cookiesPath = process.env.COOKIES_PATH || "./linkedin_cookies.json";
    await loginAndSaveCookies(p, context!, cookiesPath);
    return true;
  } catch (e) {
    console.error("Session recovery failed:", e);
    return false;
  }
}

async function loginAndSaveCookies(
  page: Page,
  context: BrowserContext,
  cookiesPath: string
): Promise<void> {
  const email = process.env.LINKEDIN_EMAIL;
  const password = process.env.LINKEDIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "LINKEDIN_EMAIL and LINKEDIN_PASSWORD must be provided in environment variables for initial auth."
    );
  }

  if (!page.url().includes("/login")) {
    await page.goto("https://www.linkedin.com/login");
  }

  await page.fill("#username", email);
  await page.fill("#password", password);
  await page.click('[type="submit"]', { timeout: 10000 });

  try {
    await page.waitForURL("**/feed/**", { timeout: 15000 });
  } catch (err) {
    throw new Error(
      "Failed to reach feed after login. Check credentials or CAPTCHA presence."
    );
  }

  const cookies = await context.cookies();
  fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));
}

export async function getPage(): Promise<Page> {
  return ensureBrowser();
}

export async function getContext(): Promise<BrowserContext> {
  await ensureBrowser();
  if (!context)
    throw new Error(
      "Browser context not initialized. Call initBrowser() first."
    );
  return context;
}
