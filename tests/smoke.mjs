// End-to-end smoke test: the CLAUDE.md checklist, driven in Chromium.
// Run from the repository root: `node tests/smoke.mjs`
// Needs Playwright (not a dependency of the project): `npm i --no-save playwright`,
// or set PLAYWRIGHT to the path of its index.mjs.
// SMOKE_OUT=<dir> keeps the exported PNGs and a screenshot of the card there.
// The app is served by a tiny static server started here, so no other process is needed.

import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath, pathToFileURL } from 'node:url';

const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = process.env.SMOKE_OUT;
if (outDir) fs.mkdirSync(outDir, { recursive: true });
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pineapple-smoke-'));

// --- tiny static server -------------------------------------------------
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
               '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/\/$/, '/index.html'));
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': mime[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

// --- helpers ---------------------------------------------------------------
let failures = 0;
function check(desc, ok, detail = '') {
  console.log(`${ok ? '✓' : '✗'} ${desc}${ok || !detail ? '' : `  [${detail}]`}`);
  if (!ok) failures++;
}

function crc32(buf) {
  let c, crc = ~0;
  for (const byte of buf) { c = (crc ^ byte) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; }
  return ~crc >>> 0;
}
function pngChunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data]);
  const out = Buffer.alloc(body.length + 8);
  out.writeUInt32BE(data.length, 0); body.copy(out, 4); out.writeUInt32BE(crc32(body), body.length + 4);
  return out;
}
// Solid-color PNG, w×h, with a 1px different stripe so each upload is unique
function makePng(w, h, [r, g, b]) {
  const row = Buffer.alloc(1 + w * 3);
  for (let x = 0; x < w; x++) { row[1 + x * 3] = r; row[2 + x * 3] = g; row[3 + x * 3] = b; }
  const raw = Buffer.concat(Array.from({ length: h }, () => row));
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), pngChunk('IHDR', ihdr),
                        pngChunk('IDAT', zlib.deflateSync(raw)), pngChunk('IEND', Buffer.alloc(0))]);
}
const pngSize = buf => ({ w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) });

// --- run -------------------------------------------------------------------
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
const page = await context.newPage();

const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => {
  // The web font is a third-party CDN; it is fine for it to be unreachable
  if (m.type() === 'error' && !/Failed to load resource|cdnfonts/.test(m.text())) errors.push(m.text());
});

const S = fn => page.evaluate(fn);   // read app state
const dismissToasts = () => page.evaluate(() => document.getElementById('toastContainer').replaceChildren());

try {
  // --- unit tests page (runs the real app.js) ---
  const unit = await context.newPage();
  await unit.goto(`${base}/tests/test-utils.html`);
  const summary = await unit.textContent('#summary');
  check(`unit tests: ${summary}`, /, 0 failed/.test(summary), summary);
  if (!/, 0 failed/.test(summary)) {
    for (const t of await unit.locator('.fail').allTextContents()) console.log('   ', t);
  }
  await unit.close();

  // --- Init ---
  await page.goto(base);
  await page.waitForFunction(() => document.querySelector('.thumbnail.active'));
  check('loads with a phrase in the textarea', (await page.inputValue('#textInput')).length > 0);
  check('loads with an active thumbnail', await page.locator('.thumbnail.active').count() === 1);
  check('thumbnails are buttons', await page.locator('button.thumbnail').count() === 15);
  check('strip shows small thumbs, not the full images',
    (await page.locator('.thumbnail').first().evaluate(e => e.style.backgroundImage)).includes('thumbs/'));
  await page.waitForTimeout(500);
  const colors0 = await S(() => ({ t: state.textColor, s: state.shadowColor }));
  check('colors are valid hex after autoAdjustColors', /^#[0-9a-f]{6}$/i.test(colors0.t) && /^#[0-9a-f]{6}$/i.test(colors0.s));
  check('no console errors on load', errors.length === 0, errors.join(' | '));

  // --- Text row ---
  const phrase0 = await page.inputValue('#textInput');
  await page.click('#btnRandom');
  check('Phrase ↺ picks a different phrase', (await page.inputValue('#textInput')) !== phrase0);
  const bg0 = await S(() => state.backgroundIndex);
  await page.click('#btnRandomBg');
  check('Background ↺ changes the background', (await S(() => state.backgroundIndex)) !== bg0);
  await page.waitForTimeout(300);
  await page.click('#btnRandomColors');
  const colors1 = await S(() => ({ t: state.textColor, s: state.shadowColor }));
  check('Colors ↺ keeps readable colors', /^#[0-9a-f]{6}$/i.test(colors1.t));

  // --- Text & drag ---
  await page.fill('#textInput', 'Hello');
  await page.type('#textInput', ' world');
  check('typing updates the card', (await page.textContent('.text-wrapper')) === 'Hello world');
  check('cursor does not jump while typing', await page.evaluate(() => {
    const t = document.getElementById('textInput'); t.setSelectionRange(2, 2);
    t.dispatchEvent(new Event('input')); return t.selectionStart === 2;
  }));
  await page.fill('#textInput', 'Line one\nLine two');
  check('line breaks are preserved', (await page.locator('.text-wrapper').innerText()).includes('\n'));

  const box = await page.locator('#timeCard').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2 + 50, { steps: 5 });
  await page.mouse.up();
  const moved = await S(() => ({ x: state.positionX, y: state.positionY }));
  check('mouse drag moves the text', moved.x > 50 && moved.y > 50, JSON.stringify(moved));
  await page.mouse.move(box.x + 10, box.y + 10);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width + 400, box.y + box.height + 400, { steps: 5 });
  await page.mouse.up();
  const far = await S(() => ({ x: state.positionX, y: state.positionY }));
  check('drag stays inside the card (max 95)', far.x === 95 && far.y === 95, JSON.stringify(far));
  check('no text selected after drag', (await page.evaluate(() => getSelection().toString())) === '');

  await page.focus('#timeCard');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Shift+ArrowUp');
  const nudged = await S(() => ({ x: state.positionX, y: state.positionY }));
  check('arrow keys nudge the text (Shift = 5)', nudged.x === 94 && nudged.y === 90, JSON.stringify(nudged));

  await page.click('#btnToggleAdvanced');
  await page.click('#btnResetPosition');
  const reset = await S(() => ({ x: state.positionX, y: state.positionY, a: state.textAlign }));
  check('Reset returns to 50/50/center', reset.x === 50 && reset.y === 50 && reset.a === 'center');

  // --- Backgrounds ---
  await page.locator('.thumbnail').nth(3).click();
  check('click thumbnail selects it', (await S(() => state.backgroundIndex)) === 3);
  check('aria-pressed follows the selection', await page.locator('.thumbnail').nth(3).getAttribute('aria-pressed') === 'true');
  await page.locator('.thumbnail').nth(3).focus();
  await page.keyboard.press('Enter');
  check('thumbnails work from the keyboard', (await S(() => state.backgroundIndex)) === 3);

  const colors = [[200, 30, 30], [30, 200, 30], [30, 30, 200], [200, 200, 30], [30, 200, 200], [200, 30, 200]];
  const uploaded = [];
  for (let i = 0; i < colors.length; i++) {
    const buf = makePng(40 + i, 30, colors[i]);
    await page.setInputFiles('#bgUploadInput', { name: `bg${i}.png`, mimeType: 'image/png', buffer: buf });
    await page.waitForFunction(n => state.customBackgrounds.length === n && state.backgroundIndex === 0 &&
      document.querySelector('.thumbnail-wrapper .btn-remove-bg'), Math.min(i + 1, 5));
    uploaded.push(await S(() => state.customBackgrounds[0]));
    if (i === 4) await dismissToasts();
  }
  check('uploads are capped at 5', (await S(() => state.customBackgrounds.length)) === 5);
  check('6th upload evicted the oldest with a toast', await page.locator('.toast', { hasText: 'Oldest background removed' }).count() === 1);
  check('new upload is selected first', (await S(() => state.backgroundIndex)) === 0);
  const staleCheck = await page.evaluate(() =>
    document.querySelector('.thumbnail').style.backgroundImage.includes(state.customBackgrounds[0]));
  check('strip shows the newest upload when the list was full (stale thumbnail bug)', staleCheck && uploaded[5] !== uploaded[4]);
  check('uploads are downscaled JPEG data URLs', uploaded[0].startsWith('data:image/jpeg'));

  await page.reload();
  await page.waitForFunction(() => document.querySelector('.thumbnail.active'));
  check('custom backgrounds persist on reload', (await S(() => state.customBackgrounds.length)) === 5);

  await page.locator('.btn-remove-bg').nth(1).click();
  check('✕ removes a custom background', (await S(() => state.customBackgrounds.length)) === 4);
  await S(() => setState({ backgroundIndex: 2 }));
  await page.locator('.btn-remove-bg').nth(0).click();
  check('removing a background before the active one shifts the index', (await S(() => state.backgroundIndex)) === 1);

  // --- Advanced panel ---
  const hadPanel = await S(() => state.advancedOpen);
  check('panel is open (opened above)', hadPanel === true);
  await page.keyboard.press('Escape');
  check('Escape closes the panel', (await S(() => state.advancedOpen)) === false);
  await page.keyboard.press('Control+s');
  check('Ctrl+S opens the panel', (await S(() => state.advancedOpen)) === true);
  await page.waitForTimeout(400);
  check('Ctrl+S focuses the favorite name', await page.evaluate(() => document.activeElement.id) === 'favNameInput');

  const fs0 = await S(() => state.fontSize);
  for (let i = 0; i < 7; i++) await page.click('#btnFontPlus');
  const fs1 = await S(() => state.fontSize);
  check('font size has no float drift', String(fs1) === String(Math.round((fs0 + 0.7) * 10) / 10) && /^\d+(\.\d)?$/.test(String(fs1)), String(fs1));

  await page.fill('#textInput', 'Line one\nLine two is longer');
  for (const [sel, align] of [['[data-align="left"]', 'left'], ['[data-align="right"]', 'right']]) {
    await page.click(`.btn-seg${sel}`);
    check(`align ${align} applies`, await page.locator('.text-wrapper').evaluate(e => e.style.textAlign) === align);
  }

  const cardSize = async () => { const b = await page.locator('#timeCard').boundingBox(); return b.width / b.height; };
  for (const [ratio, expected] of [['4:3', 4 / 3], ['9:16', 9 / 16], ['1:1', 1], ['16:9', 16 / 9]]) {
    await page.click(`.btn-seg[data-ratio="${ratio}"]`);
    check(`ratio ${ratio} sets the card aspect`, Math.abs(await cardSize() - expected) < 0.02, String(await cardSize()));
  }
  await page.click('.btn-seg[data-effect="outline"]');
  check('outline effect toggles the card class', await page.locator('#timeCard.fx-outline').count() === 1);
  await page.click('.btn-seg[data-effect="shadow"]');

  // text scales with the card
  await page.setViewportSize({ width: 600, height: 900 });
  const narrow = await page.locator('.text-wrapper').evaluate(e => parseFloat(getComputedStyle(e).fontSize));
  const narrowW = (await page.locator('#timeCard').boundingBox()).width;
  await page.setViewportSize({ width: 1280, height: 900 });
  const wide = await page.locator('.text-wrapper').evaluate(e => parseFloat(getComputedStyle(e).fontSize));
  const wideW = (await page.locator('#timeCard').boundingBox()).width;
  check('text size scales with the card width', Math.abs(narrow / narrowW - wide / wideW) < 0.002, `${narrow / narrowW} vs ${wide / wideW}`);

  // --- Favorites ---
  await page.click('#btnSaveFavorite');
  check('save without a name shows the error', await page.locator('#favNameError').isVisible());
  check('save without a name marks the input', await page.locator('#favNameInput.error').count() === 1);

  await page.locator('.thumbnail').first().click();         // a custom background
  await page.fill('#textInput', 'Fav one');
  await page.click('.btn-seg[data-ratio="4:3"]');
  await page.fill('#favNameInput', 'First');
  await page.click('#btnSaveFavorite');
  await page.locator('.thumbnail').nth(6).click();          // a preset
  await page.fill('#textInput', 'Fav two');
  await page.fill('#favNameInput', 'Second');
  await page.click('#btnSaveFavorite');
  let names = await page.locator('.fav-name').allTextContents();
  check('favorites list newest first', names.join() === 'Second,First', names.join());
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('pineapple_v2_favorites')));
  check('custom background is stored by reference, not inline', stored[0].backgroundUrl.startsWith('custom:') && !JSON.stringify(stored).includes('data:image'));

  await page.getByRole('button', { name: 'Load First' }).click();
  const loaded = await S(() => ({ text: state.text, ratio: state.ratio, bg: allBackgrounds()[state.backgroundIndex].isCustom }));
  check('Load restores text, format and custom background', loaded.text === 'Fav one' && loaded.ratio === '4:3' && loaded.bg === true, JSON.stringify(loaded));

  await page.getByRole('button', { name: 'Delete Second' }).click();
  check('delete removes it', (await page.locator('.fav-name').allTextContents()).join() === 'First');
  await page.locator('.toast-undo-btn').click();
  names = await page.locator('.fav-name').allTextContents();
  check('undo restores at the original position', names.join() === 'Second,First', names.join());

  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#btnExportFavorites')]);
  const exportPath = path.join(tmpDir, 'favs.json');
  await dl.saveAs(exportPath);
  const exported = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
  check('export is { version: 3, favorites, backgrounds }', exported.version === 3 && exported.favorites.length === 2 && Object.keys(exported.backgrounds).length === 1);

  await page.setInputFiles('#importFileInput', exportPath);
  await page.waitForSelector('#importModal:not([hidden])');
  check('import modal is a dialog and takes focus', await page.evaluate(() => document.activeElement.id) === 'btnImportMerge');
  await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
  check('Tab is trapped inside the modal', await page.evaluate(() => document.getElementById('importModal').contains(document.activeElement)));
  await page.click('#btnImportMerge');
  check('import + merge creates no duplicates', (await page.locator('.fav-name').count()) === 2);

  await page.setInputFiles('#importFileInput', exportPath);
  await page.waitForSelector('#importModal:not([hidden])');
  await page.keyboard.press('Escape');
  check('Escape cancels the import (panel stays open)', await page.locator('#importModal').isHidden() && (await S(() => state.advancedOpen)));

  await page.getByRole('button', { name: 'Delete First' }).click();
  await page.setInputFiles('#importFileInput', exportPath);
  await page.waitForSelector('#importModal:not([hidden])');
  await page.click('#btnImportReplace');
  check('import + replace replaces the list', (await page.locator('.fav-name').count()) === 2);

  // Hostile import: wrong types must not break the app
  const evil = path.join(tmpDir, 'evil.json');
  fs.writeFileSync(evil, JSON.stringify({ version: 3, favorites: [
    { id: 9, name: 'evil', text: 'x', backgroundUrl: 'https://evil.example/t.png', fontSize: '3', textColor: 'red',
      shadowColor: null, positionX: 'a', positionY: 1e9, textAlign: 'x', ratio: 'x' },
    { id: 'nope', name: 'no id' }, 42, null] }));
  await page.setInputFiles('#importFileInput', evil);
  await page.waitForSelector('#importModal:not([hidden])');
  check('invalid entries are counted as skipped', (await page.textContent('#importSummary')).includes('3 skipped'));
  await page.click('#btnImportMerge');
  await page.getByRole('button', { name: 'Load evil' }).click();
  const sane = await S(() => ({ fs: state.fontSize, tc: state.textColor, px: state.positionX, py: state.positionY, r: state.ratio }));
  check('a hostile favorite loads with safe defaults and the app still renders',
    sane.fs === 3 && sane.tc === '#5c2e0d' && sane.px === 50 && sane.py === 95 && sane.r === '16:9', JSON.stringify(sane));
  await page.getByRole('button', { name: 'Delete evil' }).click();

  // --- Export PNG ---
  await page.fill('#textInput', 'Export me, please');
  await page.click('.btn-seg[data-ratio="16:9"]');
  for (const [ratio, w, h] of [['16:9', 1920, 1080], ['4:3', 1440, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
    await page.click(`.btn-seg[data-ratio="${ratio}"]`);
    const [d] = await Promise.all([page.waitForEvent('download'), page.click('#btnDownload')]);
    const file = outDir ? path.join(outDir, `card-${ratio.replace(':', 'x')}.png`) : await d.path();
    if (outDir) await d.saveAs(file);
    const size = pngSize(fs.readFileSync(file));
    check(`PNG ${ratio} is ${w}×${h}`, size.w === w && size.h === h, JSON.stringify(size));
  }
  check('download button is re-enabled after export', await page.locator('#btnDownload').isEnabled());
  check('overlay is hidden after export', await page.locator('#downloadOverlay').isHidden());

  const alpha = async () => page.evaluate(async () => {
    const c = await renderCardToCanvas();
    return c.getContext('2d').getImageData(2, 2, 1, 1).data[3];
  });
  check('normal export is opaque', (await alpha()) === 255);
  await page.check('#chkTransparent');
  check('transparent export has no background', (await alpha()) === 0);
  const textPixels = await page.evaluate(async () => {
    const c = await renderCardToCanvas();
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
    return n;
  });
  check('transparent export still contains the text', textPixels > 1000, String(textPixels));
  const [dt] = await Promise.all([page.waitForEvent('download'), page.click('#btnDownload')]);
  check('transparent file name says so', dt.suggestedFilename().endsWith('-transparent.png'), dt.suggestedFilename());
  await page.uncheck('#chkTransparent');

  // card as seen on screen vs. exported canvas (for eyeballing)
  if (outDir) {
    await page.click('.btn-seg[data-ratio="16:9"]');
    await page.locator('#timeCard').screenshot({ path: path.join(outDir, 'card-dom.png') });
  }

  // --- Persistence ---
  await page.click('.btn-seg[data-ratio="4:3"]');
  await page.click('.btn-seg[data-effect="outline"]');
  await page.click('.btn-seg[data-align="right"]');
  await page.waitForTimeout(450);
  await page.reload();
  await page.waitForFunction(() => document.querySelector('.thumbnail.active'));
  const persisted = await S(() => ({ open: state.advancedOpen, ratio: state.ratio, fx: state.effect, al: state.textAlign, favs: favorites.length }));
  check('reload restores panel, format, effect, alignment', persisted.open && persisted.ratio === '4:3' && persisted.fx === 'outline' && persisted.al === 'right', JSON.stringify(persisted));
  check('reload restores favorites', persisted.favs === 2);

  // corrupted storage must not break the app
  await page.evaluate(() => {
    localStorage.setItem('pineapple_v2_favorites', '{"not":"an array"}');
    localStorage.setItem('pineapple_v2_custom_bgs', '[1,"x",null]');
    localStorage.setItem('pineapple_v2_ui', '"junk"');
  });
  await page.reload();
  await page.waitForFunction(() => document.querySelector('.thumbnail.active'));
  check('corrupted localStorage falls back to defaults', await S(() => favorites.length === 0 && state.customBackgrounds.length === 0));

  check('no console errors during the whole run', errors.length === 0, errors.join(' | '));

  // --- file:// ---
  const local = await context.newPage();
  await local.goto(pathToFileURL(path.join(root, 'index.html')).href);
  await local.waitForFunction(() => document.querySelector('.thumbnail.active'));
  await local.click('#btnDownload');
  await local.waitForSelector('.toast.error');
  check('PNG export on file:// shows the explanatory error', (await local.textContent('.toast.error')).includes('file://'));
  check('download button recovers after the error', await local.locator('#btnDownload').isEnabled());
  await local.close();
} catch (err) {
  console.error(err);
  failures++;
} finally {
  await browser.close();
  server.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

console.log(failures === 0 ? '\nAll checks passed' : `\n${failures} check(s) failed`);
process.exit(failures === 0 ? 0 : 1);
