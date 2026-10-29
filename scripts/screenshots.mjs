// Screenshots for docs/guide, from index.html served with `python -m http.server 4188` in the repository root.
// Firefox, English. Run by hand when the interface changes: `node scripts/screenshots.mjs`.
// Needs Playwright (not a dependency of the project): set PLAYWRIGHT to the path of its index.mjs.
// The phrase and the background are random on start: the script sets its own.

const { firefox } = await import(process.env.PLAYWRIGHT ?? '@playwright/test');

const url = process.env.URL ?? 'http://127.0.0.1:4188/';
const out = 'docs/guide/img/';
const browser = await firefox.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'en-US' })).newPage();

await page.goto(url);
await page.waitForTimeout(2000);
await page.getByRole('textbox', { name: 'Type your text...' }).fill('Three days later');
await page.getByRole('button', { name: 'Colors ↺' }).click();
await page.waitForTimeout(800);
await page.screenshot({ path: `${out}card.png` });

await page.getByRole('button', { name: '▼ Customize' }).click();
await page.waitForTimeout(800);
await page.screenshot({ path: `${out}customize.png` });

await browser.close();
