// Screenshots for docs/guide, from index.html served with `python -m http.server 4188` in the repository root.
// Firefox by default (BROWSER=chromium for Chromium), English. Run by hand when the interface changes:
// `node scripts/screenshots.mjs`.
// Needs Playwright (not a dependency of the project): set PLAYWRIGHT to the path of its index.mjs.
// The card uses a web font from fonts.cdnfonts.com: the script stops if it did not load, so the
// guide never shows the fallback font. The phrase and the background are random on start: the
// script sets its own.

const playwright = await import(process.env.PLAYWRIGHT ?? '@playwright/test');

const url = process.env.URL ?? 'http://127.0.0.1:4188/';
const out = 'docs/guide/img/';
const browser = await playwright[process.env.BROWSER ?? 'firefox'].launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'en-US' })).newPage();

await page.goto(url);
await page.waitForTimeout(2000);

const fontLoaded = await page.evaluate(async () => {
  await document.fonts.ready;
  return [...document.fonts].some(f => f.family.includes('Some Time Later') && f.status === 'loaded');
});
if (!fontLoaded) {
  await browser.close();
  throw new Error('The "Some Time Later" web font did not load (is fonts.cdnfonts.com reachable?). Screenshots not written.');
}

await page.locator('.thumbnail[title="Squid on Strike"]').click();
await page.getByLabel('Card text').fill('Three days later');
await page.getByRole('button', { name: 'Colors ↺' }).click();
await page.waitForTimeout(800);
await page.screenshot({ path: `${out}card.png` });

await page.getByRole('button', { name: '▼ Customize' }).click();
await page.waitForTimeout(800);
await page.screenshot({ path: `${out}customize.png`, fullPage: true });

await browser.close();
