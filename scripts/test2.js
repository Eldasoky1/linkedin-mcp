import { initBrowser, getPage } from '../dist/browser.js';

async function test() {
  await initBrowser();
  const page = getPage();
  await page.goto('https://www.linkedin.com/in/');
  await page.waitForTimeout(5000); // give react time to render

  const h1s = await page.locator('h1').allTextContents();
  const title = await page.title();

  // LinkedIn stores headline usually right under the h1 or in the title.
  const headlineEl = await page.locator('div.text-body-medium').first().textContent().catch(() => null);

  console.log(JSON.stringify({
    Name: h1s.map(h => h.trim()).filter(Boolean)[0] || 'Not found',
    Headline: headlineEl ? headlineEl.trim() : 'Not found',
    Title: title,
    URL: page.url()
  }, null, 2));

  process.exit(0);
}

test().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});