const { chromium } = require('playwright');
const fs = require('fs');
require('dotenv').config();

(async () => {
  const browser = await chromium.launch({headless: true});
  const context = await browser.newContext();
  const cookiesPath = process.env.COOKIES_PATH || './linkedin_cookies.json';
  const cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf-8'));
  await context.addCookies(cookies);
  const page = await context.newPage();
  
  await page.goto('https://www.linkedin.com/in/me/edit/forms/position/new/', {waitUntil: 'domcontentloaded'});
  await page.waitForTimeout(5000);
  
  const html = await page.content();
  fs.writeFileSync('position.html', html);
  console.log("Saved position.html");
  
  await browser.close();
})();
