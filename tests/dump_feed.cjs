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
  
  await page.goto('https://www.linkedin.com/feed/', {waitUntil: 'domcontentloaded'});
  await page.waitForTimeout(5000);
  
  const html = await page.content();
  fs.writeFileSync('feed.html', html);
  console.log("Saved feed.html");
  
  const postBtn = await page.$$eval('button', bs => bs.map(b => b.innerText).filter(x => x && x.toLowerCase().includes('post')));
  console.log('Buttons with post:', postBtn);
  
  await browser.close();
})();
