import { initBrowser, getPage } from "../src/browser.js";

async function main() {
  await initBrowser();
  const page = getPage();

  await page.goto(
    "https://www.linkedin.com/in/ahmed-eldasoky-b44b4332a/edit/forms/position/new/?profileFormEntryPoint=IntroForm",
    { waitUntil: "domcontentloaded", timeout: 30000 }
  );
  await page.waitForTimeout(5000);

  const allSelects = await page.evaluate(() => {
    const results: any[] = [];
    document.querySelectorAll("select").forEach(el => {
      if (el.getBoundingClientRect().width === 0) return;
      const options = Array.from(el.querySelectorAll("option")).map(o => ({
        text: o.textContent?.trim(),
        value: o.value,
        disabled: o.disabled,
      }));
      results.push({
        id: el.id.substring(0, 10),
        size: options.length,
        options: options.slice(0, 15),
      });
    });
    return results;
  });

  console.log("All selects and their options:");
  for (const s of allSelects) {
    console.log(`\n  Select #${allSelects.indexOf(s)} (${s.size} options):`);
    for (const o of s.options) {
      console.log(`    value="${o.value}" text="${o.text}" disabled=${o.disabled}`);
    }
  }

  process.exit(0);
}

main().catch(e => {
  console.error("Error:", e.message);
  process.exit(1);
});
