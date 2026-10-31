// =============================================================
// --- Data ---
// =============================================================

const phrases = [
  '3 Days Later...', '2000 Years Later', '6½ Hours Later',
  'A Few Inches Later', 'Day Two', 'Day Three', 'Day Four',
  'A Few Moments Later', 'One Eternity Later', 'Three Days Later',
  'Twelve Seconds Later', '3:28 AM', 'Three Weeks Later',
  'Many Months Later',
  'So much later that the old narrator got tired of waiting and they had to hire a new one',
  'Tomorrow', 'Tomorrow for Sure...', 'Eventually...', 'Uhhh...',
  '12:00 Midnight', 'One Hour Later', 'Two Hours Later',
  'Three Hours Later', 'Please Stand By', 'Meanwhile', '8:01 PM',
  'The Next Day', 'Later...', 'Twenty Minutes Later',
  'Six Hours Later', 'Several Bad Puns Later', '70 Years Later',
  'Later That Same Evening', 'Several Days Later',
  '6 Months Later...', '4 to 6 Weeks Later',
  'One Minute, Thirty Seven Seconds Later',
];

// thumb: small WebP shown in the strip; url: full image used on the card and in the export
const backgroundPresets = [
  ['band-geeks.jpg',         'Band Geeks'],
  ['club-spongebob.jpg',     'Club SpongeBob'],
  ['frankendoodle.jpg',      'Frankendoodle'],
  ['fry-cook-games.jpg',     'Fry Cook Games'],
  ['gary-bath.jpg',          'Gary Takes a Bath'],
  ['graveyard-shift.jpg',    'Graveyard Shift'],
  ['im-with-stupid.jpg',     "I'm with Stupid"],
  ['jellyfish-hunter.jpg',   'Jellyfish Hunter'],
  ['krusty-love.png',        'Krusty Love'],
  ['pressure.jpg',           'Pressure'],
  ['procrastination.jpg',    'Procrastination'],
  ['sandy-worm.jpg',         'Sandy, SpongeBob & the Worm'],
  ['shanghaied.jpg',         'Shanghaied'],
  ['spongeguard-on-duty.png','SpongeGuard on Duty'],
  ['squid-on-strike.png',    'Squid on Strike'],
].map(([file, label]) => ({
  url:   `backgrounds/${file}`,
  thumb: `backgrounds/thumbs/${file.replace(/\.\w+$/, '.webp')}`,
  label,
}));

// SpongeBob-themed palettes — dark for light backgrounds, light for dark backgrounds
const DARK_PALETTE  = ['#5c2e0d', '#7a1f1f', '#0d3a5c', '#1f5f2a', '#5a1f6b',
                       '#0d4d4d', '#6b4a00', '#7a2d4d', '#2a2a6b', '#5c1500',
                       '#1a4d1a', '#4d0d2a', '#0d2e4d', '#3a1f5c', '#6b2d0d',
                       '#0d4d3a', '#4d1f1f', '#3a3a0d'];
const LIGHT_PALETTE = ['#ffe566', '#fff4cc', '#ffd6e0', '#d6f5ff', '#e0ffd6',
                       '#f0e6ff', '#ffe0b3', '#fff2b3', '#d6ffe9', '#ffffff',
                       '#ffccdd', '#cce6ff', '#fff0cc', '#e6ffcc', '#ffe6f0',
                       '#ccfff0', '#f5d6ff', '#ffd9b3'];

// Card geometry. The card is a container (see style.css): text sizes are
// expressed relative to its width, so the same card looks the same at any
// screen size and in the export. 1em of the old fixed layout = 16px of a
// 900px card.
const RATIOS = {
  '16:9': { w: 16, h: 9,  out: [1920, 1080] },
  '4:3':  { w: 4,  h: 3,  out: [1440, 1080] },
  '9:16': { w: 9,  h: 16, out: [1080, 1920] },
  '1:1':  { w: 1,  h: 1,  out: [1080, 1080] },
};
const RATIO_KEYS  = Object.keys(RATIOS);
const ALIGNS      = ['left', 'center', 'right'];
const EFFECTS     = ['shadow', 'outline'];
const EM_CQW      = 16 / 900 * 100;   // 1em of text size, in % of card width
const SHADOW_CQW  = 2 / 900 * 100;    // shadow offset, in % of card width
const OUTLINE_CQW = 4 / 900 * 100;    // outline stroke width, in % of card width
const LINE_HEIGHT = 1.2;
const TEXT_BOX    = 0.9;              // text box width, fraction of card width
const FONT_MIN    = 0.5;
const FONT_MAX    = 8;
const POS_MIN     = 5;
const POS_MAX     = 95;
const FONT_FAMILY = '"Some Time Later", sans-serif';

const STYLE_DEFAULTS = {
  fontSize:    3,
  textColor:   '#5c2e0d',
  shadowColor: '#ffe566',
  positionX:   50,
  positionY:   50,
  textAlign:   'center',
  ratio:       '16:9',
  effect:      'shadow',
};

const MIN_CONTRAST     = 4.5;   // WCAG AA for normal text
const MIN_SHADOW_CONTRAST = 3;
const LUM_SPLIT        = 0.179; // luminance where white and black text contrast equally
const DEFAULT_LUM      = 0.2;   // used when the image can't be sampled (file://)
const LUM_GRID         = 48;

const MAX_UPLOAD_SIDE = 1920;
const UPLOAD_QUALITY  = 0.82;

// =============================================================
// --- Utils ---
// =============================================================

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function roundOneDecimal(val) {
  return Math.round(val * 10) / 10;
}

function randomItem(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function generateDarkColor()  { return randomItem(DARK_PALETTE); }
function generateLightColor() { return randomItem(LIGHT_PALETTE); }

// --- Color math (WCAG relative luminance) ---

const _srgbLut = Array.from({ length: 256 }, (_, i) => {
  const c = i / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
});

function relativeLuminance(r, g, b) {
  return 0.2126 * _srgbLut[r] + 0.7152 * _srgbLut[g] + 0.0722 * _srgbLut[b];
}

function hexLuminance(hex) {
  return relativeLuminance(
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  );
}

function contrastRatio(lumA, lumB) {
  const hi = Math.max(lumA, lumB);
  const lo = Math.min(lumA, lumB);
  return (hi + 0.05) / (lo + 0.05);
}

// Picks a text color readable over a background of the given luminance and a
// shadow color that stands out from the text. Prefers the palette family that
// suits the background (light text on dark, dark on light); when no color of
// that family reaches MIN_CONTRAST it looks in the other one, and as a last
// resort takes the best contrast available.
function pickColors(bgLum) {
  const families = bgLum < LUM_SPLIT
    ? [LIGHT_PALETTE, DARK_PALETTE]
    : [DARK_PALETTE, LIGHT_PALETTE];
  const readable = c => contrastRatio(hexLuminance(c), bgLum) >= MIN_CONTRAST;

  const family = families.find(f => f.some(readable));
  let textColor;
  if (family) {
    textColor = randomItem(family.filter(readable));
  } else {
    const all = [...LIGHT_PALETTE, ...DARK_PALETTE];
    textColor = all.reduce((best, c) =>
      contrastRatio(hexLuminance(c), bgLum) > contrastRatio(hexLuminance(best), bgLum) ? c : best);
  }

  const textLum    = hexLuminance(textColor);
  const shadowPool = LIGHT_PALETTE.includes(textColor) ? DARK_PALETTE : LIGHT_PALETTE;
  const standout   = shadowPool.filter(c => contrastRatio(hexLuminance(c), textLum) >= MIN_SHADOW_CONTRAST);
  return { textColor, shadowColor: randomItem(standout.length ? standout : shadowPool) };
}

// --- Image sampling ---

// Maps a point of the card (0..1) to the image (0..1) for `background-size: cover`
// centered, given both aspect ratios (width / height).
function coverToImage(u, v, imgAspect, cardAspect) {
  if (imgAspect > cardAspect) {
    const visible = cardAspect / imgAspect;
    return [(1 - visible) / 2 + u * visible, v];
  }
  const visible = imgAspect / cardAspect;
  return [u, (1 - visible) / 2 + v * visible];
}

// Mean luminance of a card region {x0,y0,x1,y1} (0..1) over a luminance map.
function regionLuminance(map, region, cardAspect) {
  const [ix0, iy0] = coverToImage(clamp(region.x0, 0, 1), clamp(region.y0, 0, 1), map.aspect, cardAspect);
  const [ix1, iy1] = coverToImage(clamp(region.x1, 0, 1), clamp(region.y1, 0, 1), map.aspect, cardAspect);
  const c0 = clamp(Math.floor(ix0 * LUM_GRID), 0, LUM_GRID - 1);
  const c1 = clamp(Math.ceil(ix1 * LUM_GRID) - 1, c0, LUM_GRID - 1);
  const r0 = clamp(Math.floor(iy0 * LUM_GRID), 0, LUM_GRID - 1);
  const r1 = clamp(Math.ceil(iy1 * LUM_GRID) - 1, r0, LUM_GRID - 1);
  let total = 0, n = 0;
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      total += map.cells[r * LUM_GRID + c];
      n++;
    }
  }
  return total / n;
}

// Largest rectangle that covers W×H with an image of iw×ih, centered.
function coverRect(iw, ih, W, H) {
  const s = Math.max(W / iw, H / ih);
  const w = iw * s;
  const h = ih * s;
  return [(W - w) / 2, (H - h) / 2, w, h];
}

// --- Text layout (shared by the export; mirrors white-space: pre-wrap + break-word) ---

function wrapText(text, maxWidth, measure) {
  const lines = [];
  for (const para of String(text).split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      const candidate = line === '' ? word : `${line} ${word}`;
      if (measure(candidate) <= maxWidth) { line = candidate; continue; }
      if (line !== '') { lines.push(line); line = ''; }
      if (measure(word) <= maxWidth) { line = word; continue; }
      for (const ch of word) {           // word wider than the box: break it
        if (line === '' || measure(line + ch) <= maxWidth) line += ch;
        else { lines.push(line); line = ch; }
      }
    }
    lines.push(line);
  }
  return lines;
}

// --- Hash (cyrb53) — short stable id for background data URLs ---

function hashString(str) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

// --- Sanitizers (localStorage and imported files are untrusted input) ---

const HEX_RE = /^#[0-9a-f]{6}$/i;

function isDataImage(url) {
  return typeof url === 'string' && url.startsWith('data:image/');
}

// Returns only the style fields of `o` that are valid.
function normalizeStyle(o) {
  const s = {};
  if (Number.isFinite(o.fontSize))      s.fontSize    = clamp(roundOneDecimal(o.fontSize), FONT_MIN, FONT_MAX);
  if (HEX_RE.test(o.textColor))         s.textColor   = o.textColor;
  if (HEX_RE.test(o.shadowColor))       s.shadowColor = o.shadowColor;
  if (Number.isFinite(o.positionX))     s.positionX   = clamp(o.positionX, POS_MIN, POS_MAX);
  if (Number.isFinite(o.positionY))     s.positionY   = clamp(o.positionY, POS_MIN, POS_MAX);
  if (ALIGNS.includes(o.textAlign))     s.textAlign   = o.textAlign;
  if (RATIO_KEYS.includes(o.ratio))     s.ratio       = o.ratio;
  if (EFFECTS.includes(o.effect))       s.effect      = o.effect;
  return s;
}

function sanitizeUI(raw) {
  const o  = raw && typeof raw === 'object' ? raw : {};
  const ui = normalizeStyle(o);
  delete ui.textColor;   // colors are recomputed on every load
  delete ui.shadowColor;
  if (typeof o.advancedOpen === 'boolean')      ui.advancedOpen      = o.advancedOpen;
  if (typeof o.transparentExport === 'boolean') ui.transparentExport = o.transparentExport;
  return ui;
}

// Returns a clean favorite, or null when it can't be one (no usable id or name).
// `backgroundUrl` is kept only if it is '', a preset, a data:image URL or a
// `custom:<hash>` reference.
function sanitizeFavorite(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id   = Number(raw.id);
  const name = typeof raw.name === 'string' ? raw.name.trim().slice(0, 80) : '';
  if (!Number.isFinite(id) || !name) return null;

  const url = typeof raw.backgroundUrl === 'string' ? raw.backgroundUrl : '';
  const knownUrl = url === '' || isDataImage(url) || /^custom:[0-9a-z]+$/.test(url) ||
                   backgroundPresets.some(p => p.url === url);
  return {
    id,
    name,
    text: typeof raw.text === 'string' ? raw.text.slice(0, 500) : '',
    backgroundUrl: knownUrl ? url : '',
    ...STYLE_DEFAULTS,
    ...normalizeStyle(raw),
  };
}

// Sanitizes a favorite and moves an inline data URL background out of it into
// `bgSink` (hash -> data URL), leaving a `custom:<hash>` reference. A reference
// whose data is in neither `bgSink` nor `incoming` is dropped.
function ingestFavorite(raw, incoming, bgSink) {
  const fav = sanitizeFavorite(raw);
  if (!fav) return null;

  if (isDataImage(fav.backgroundUrl)) {
    const hash = hashString(fav.backgroundUrl);
    bgSink[hash] = fav.backgroundUrl;
    fav.backgroundUrl = `custom:${hash}`;
  } else if (fav.backgroundUrl.startsWith('custom:')) {
    const hash = fav.backgroundUrl.slice(7);
    if (!bgSink[hash] && isDataImage(incoming[hash])) bgSink[hash] = incoming[hash];
    if (!bgSink[hash]) fav.backgroundUrl = '';
  }
  return fav;
}

function sanitizeBgMap(raw) {
  const out = {};
  if (raw && typeof raw === 'object') {
    for (const [hash, url] of Object.entries(raw)) {
      if (/^[0-9a-z]+$/.test(hash) && isDataImage(url)) out[hash] = url;
    }
  }
  return out;
}

// --- Toast ---
// Undo toasts stack (up to 3). All other toasts replace the current one.

const _regularToast = { el: null, timer: null };

function toast(message, { type = 'default', undoCallback = null } = {}) {
  const container = document.getElementById('toastContainer');

  if (type === 'undo') {
    // Undo toasts stack — max 3 visible
    const existing = container.querySelectorAll('.toast.undo');
    if (existing.length >= 3) existing[0].remove();
    const t = _buildToast(message, 'undo', undoCallback);
    container.appendChild(t);
    setTimeout(() => t.remove(), 5000);
    return;
  }

  // Regular toasts replace current
  if (_regularToast.el) {
    clearTimeout(_regularToast.timer);
    _regularToast.el.remove();
  }

  const cssClass = type === 'error' ? 'error' : '';
  const t = _buildToast(message, cssClass, null);
  container.appendChild(t);
  _regularToast.el = t;
  _regularToast.timer = setTimeout(() => {
    t.remove();
    _regularToast.el = null;
  }, 3000);
}

function _buildToast(message, cssClass, undoCallback) {
  const t = document.createElement('div');
  t.className = 'toast' + (cssClass ? ' ' + cssClass : '');
  if (cssClass === 'error') t.setAttribute('role', 'alert');

  const msg = document.createElement('span');
  msg.className = 'toast-msg';
  msg.textContent = message;
  t.appendChild(msg);

  if (undoCallback) {
    const btn = document.createElement('button');
    btn.className = 'toast-undo-btn';
    btn.textContent = 'Undo';
    btn.addEventListener('click', () => { undoCallback(); t.remove(); });
    t.appendChild(btn);
  }

  return t;
}

// =============================================================
// --- State ---
// =============================================================

const LS_FAVORITES   = 'pineapple_v2_favorites';
const LS_FAV_BGS     = 'pineapple_v2_fav_bgs';
const LS_CUSTOM_BGS  = 'pineapple_v2_custom_bgs';
const LS_UI          = 'pineapple_v2_ui';
const MAX_CUSTOM_BGS = 5;

const state = {
  ...STYLE_DEFAULTS,
  text:              '',
  backgroundIndex:   0,
  customBackgrounds: [],   // data URLs, newest first; max MAX_CUSTOM_BGS
  advancedOpen:      false,
  transparentExport: false,
};

// Keys of `state` remembered between visits (see persistUI)
const UI_KEYS = ['advancedOpen', 'fontSize', 'textAlign', 'ratio',
                 'positionX', 'positionY', 'effect', 'transparentExport'];

// Favorites are NOT in state — managed separately to avoid
// rebuilding the favorites list on every keystroke.
let favorites = [];
// Backgrounds referenced by favorites as `custom:<hash>`: hash -> data URL.
// Kept apart so a background shared by several favorites is stored once.
let favBgs = {};

// --- setState ---
// Rule: ALL event handlers and async callbacks mutate state through setState().
// Exceptions: init(), and addCustomBg/removeCustomBg, which edit
// state.customBackgrounds and are always followed by a setState().

function setState(patch) {
  Object.assign(state, patch);
  render();
  if (UI_KEYS.some(k => k in patch)) schedulePersistUI();
}

// --- allBackgrounds ---

function allBackgrounds() {
  return [
    ...state.customBackgrounds.map((url, i) => ({
      url,
      thumb: url,
      isCustom: true,
      label: `Custom background ${i + 1}`,
    })),
    ...backgroundPresets,
  ];
}

// --- localStorage helpers ---

function saveToLS(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (_) {
    toast('Could not save: browser storage is full or blocked', { type: 'error' });
    return false;
  }
}

function loadFromLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (_) {
    return fallback;
  }
}

// --- Persistence helpers ---
// Call these explicitly after mutations that need to be saved.
// setState only persists the UI keys, debounced.

let _uiTimer = null;

function persistUI() {
  clearTimeout(_uiTimer);
  _uiTimer = null;
  saveToLS(LS_UI, Object.fromEntries(UI_KEYS.map(k => [k, state[k]])));
}

function schedulePersistUI() {
  clearTimeout(_uiTimer);
  _uiTimer = setTimeout(persistUI, 300);
}

function persistCustomBgs() { saveToLS(LS_CUSTOM_BGS, state.customBackgrounds); }
function persistFavorites() { saveToLS(LS_FAVORITES, favorites); }
function persistFavBgs()    { saveToLS(LS_FAV_BGS, favBgs); }

// =============================================================
// --- Render ---
// =============================================================

// DOM refs — populated in init() after DOMContentLoaded
let _card, _strip, _textarea;

let _renderedBg = null;

function renderCard() {
  const bgs = allBackgrounds();
  const bg  = bgs[state.backgroundIndex] || bgs[0];

  // Assigning a large data URL again on every drag step makes the browser re-parse it
  if (bg.url !== _renderedBg) {
    _renderedBg = bg.url;
    _card.style.backgroundImage = `url('${bg.url}')`;
  }

  const ratio = RATIOS[state.ratio];
  _card.style.setProperty('--ar', `${ratio.w} / ${ratio.h}`);
  _card.style.setProperty('--ar-n', ratio.w / ratio.h);
  _card.style.setProperty('--fs', state.fontSize);
  _card.style.setProperty('--text-color', state.textColor);
  _card.style.setProperty('--shadow-color', state.shadowColor);
  _card.classList.toggle('fx-outline', state.effect === 'outline');

  // Text wrapper — update in place, never replace the element
  let wrapper = _card.querySelector('.text-wrapper');
  if (!wrapper) {
    wrapper = document.createElement('div');
    wrapper.className = 'text-wrapper';
    _card.appendChild(wrapper);
  }

  wrapper.textContent = state.text || '';
  wrapper.style.left      = `${state.positionX}%`;
  wrapper.style.top       = `${state.positionY}%`;
  wrapper.style.textAlign = state.textAlign;
}

// Strip dirty-check — avoids rebuilding on text/color/position changes.
// Anything that edits customBackgrounds must call invalidateStrip().
const _stripPrev = { version: -1, backgroundIndex: -1 };
let _stripVersion = 0;

function invalidateStrip() { _stripVersion++; }

function renderStrip() {
  if (_stripVersion === _stripPrev.version &&
      state.backgroundIndex === _stripPrev.backgroundIndex) return;

  _stripPrev.version         = _stripVersion;
  _stripPrev.backgroundIndex = state.backgroundIndex;

  const bgs       = allBackgrounds();
  const uploadBtn = document.getElementById('btnBgUpload');

  // Keep keyboard focus on the same thumbnail across the rebuild
  const focusedIdx = _strip.contains(document.activeElement)
    ? document.activeElement.dataset.index : undefined;

  // Remove existing thumbnails and separators; keep the upload button
  _strip.querySelectorAll('.thumbnail-wrapper, .strip-separator').forEach(el => el.remove());

  const hasCustom = state.customBackgrounds.length > 0;

  bgs.forEach((bg, i) => {
    // Separator between custom and preset sections
    if (hasCustom && i === state.customBackgrounds.length) {
      const sep = document.createElement('div');
      sep.className = 'strip-separator';
      _strip.insertBefore(sep, uploadBtn);
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'thumbnail-wrapper';

    const thumb = document.createElement('button');
    thumb.type = 'button';
    thumb.className = 'thumbnail' + (i === state.backgroundIndex ? ' active' : '');
    thumb.style.backgroundImage = `url('${bg.thumb}')`;
    thumb.setAttribute('aria-label', bg.label);
    thumb.setAttribute('aria-pressed', i === state.backgroundIndex);
    thumb.setAttribute('title', bg.label);
    thumb.dataset.index = i;
    wrapper.appendChild(thumb);

    if (bg.isCustom) {
      const rmBtn = document.createElement('button');
      rmBtn.type = 'button';
      rmBtn.className = 'btn-remove-bg';
      rmBtn.textContent = '✕';
      rmBtn.setAttribute('aria-label', `Remove ${bg.label}`);
      rmBtn.dataset.index = i;
      wrapper.appendChild(rmBtn);
    }

    _strip.insertBefore(wrapper, uploadBtn);
  });

  if (focusedIdx !== undefined) {
    _strip.querySelector(`.thumbnail[data-index="${focusedIdx}"]`)?.focus({ preventScroll: true });
  }

  // Scroll active thumbnail into view after rebuild
  const activeThumb = _strip.querySelector('.thumbnail.active');
  if (activeThumb) {
    activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
}

// Favorites list dirty-check — avoids rebuilding on every keypress.
// Favorites are immutable once saved, so the ids identify the list.
const _favPrev = { ids: null };

function refreshFavorites() {
  _favPrev.ids = null;
  renderFavoritesList();
}

function renderFavoritesList() {
  const list = document.getElementById('favoritesList');
  if (!list) return;

  const currentIds = favorites.map(f => f.id).join(',');
  if (currentIds === _favPrev.ids) return;
  _favPrev.ids = currentIds;

  list.innerHTML = '';

  if (favorites.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'fav-empty';
    empty.textContent = 'No favorites saved.';
    list.appendChild(empty);
    return;
  }

  // Newest first
  [...favorites].reverse().forEach(fav => {
    const item = document.createElement('div');
    item.className = 'fav-item';

    const name = document.createElement('span');
    name.className = 'fav-name';
    name.textContent = fav.name;
    name.setAttribute('title', fav.name);

    const actions = document.createElement('div');
    actions.className = 'fav-actions';

    const loadBtn = document.createElement('button');
    loadBtn.className = 'btn-load-fav';
    loadBtn.textContent = 'Load';
    loadBtn.setAttribute('aria-label', `Load ${fav.name}`);
    loadBtn.dataset.id = fav.id;

    const delBtn = document.createElement('button');
    delBtn.className = 'btn-delete-fav';
    delBtn.textContent = '✕';
    delBtn.setAttribute('aria-label', `Delete ${fav.name}`);
    delBtn.dataset.id = fav.id;

    actions.appendChild(loadBtn);
    actions.appendChild(delBtn);
    item.appendChild(name);
    item.appendChild(actions);
    list.appendChild(item);
  });
}

function renderControls() {
  // Font size
  const slider  = document.getElementById('sliderFontSize');
  const display = document.getElementById('fontSizeDisplay');
  if (slider)  slider.value = state.fontSize;
  if (display) display.textContent = `${state.fontSize.toFixed(1)}em`;

  // Segmented buttons: align, ratio, effect
  for (const [selector, attr, value] of [
    ['.btn-seg[data-align]',  'align',  state.textAlign],
    ['.btn-seg[data-ratio]',  'ratio',  state.ratio],
    ['.btn-seg[data-effect]', 'effect', state.effect],
  ]) {
    document.querySelectorAll(selector).forEach(btn => {
      const on = btn.dataset[attr] === value;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-pressed', on);
    });
  }

  // Color pickers
  const colorText   = document.getElementById('colorText');
  const colorShadow = document.getElementById('colorShadow');
  if (colorText)   colorText.value   = state.textColor;
  if (colorShadow) colorShadow.value = state.shadowColor;

  const chkTransparent = document.getElementById('chkTransparent');
  if (chkTransparent) chkTransparent.checked = state.transparentExport;

  // Advanced panel visibility
  const panel = document.getElementById('advancedPanel');
  if (panel) panel.hidden = !state.advancedOpen;
  document.getElementById('btnToggleAdvanced')
    ?.setAttribute('aria-expanded', state.advancedOpen);

  // Textarea — skip if focused to prevent cursor jump while typing
  if (_textarea && document.activeElement !== _textarea) {
    _textarea.value = state.text;
  }

  renderFavoritesList();
}

function render() {
  renderCard();
  renderStrip();
  renderControls();
}

// =============================================================
// --- Color System ---
// =============================================================

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Without crossOrigin the canvas is tainted; on file:// it would fail anyway
    if (location.protocol !== 'file:') img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load image: ${url.slice(0, 80)}`));
    img.src = url;
  });
}

// Per-image grid of relative luminance, sampled once. null when the image
// can't be read (tainted canvas on file://, load error).
const _lumCache = new Map();

async function getLumMap(url) {
  if (_lumCache.has(url)) return _lumCache.get(url);

  let map = null;
  try {
    const img    = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = LUM_GRID;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, LUM_GRID, LUM_GRID);
    const data  = ctx.getImageData(0, 0, LUM_GRID, LUM_GRID).data;
    const cells = new Float32Array(LUM_GRID * LUM_GRID);
    for (let i = 0; i < cells.length; i++) {
      cells[i] = relativeLuminance(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
    }
    map = { aspect: img.naturalWidth / img.naturalHeight, cells };
  } catch (_) { /* tainted canvas or load error: leave null */ }

  _lumCache.set(url, map);
  return map;
}

// Card region (0..1) the text currently covers, estimated from its size and position.
function textRegion() {
  const aspect = RATIOS[state.ratio].w / RATIOS[state.ratio].h;
  const lines  = (state.text || ' ').split('\n');
  const longest = Math.max(...lines.map(l => l.length), 1);
  const em     = state.fontSize * EM_CQW / 100;          // fraction of card width
  const w = Math.min(TEXT_BOX, longest * 0.55 * em);
  const h = lines.length * LINE_HEIGHT * em * aspect;    // fraction of card height
  const cx = state.positionX / 100;
  const cy = state.positionY / 100;
  return { x0: cx - w / 2, x1: cx + w / 2, y0: cy - h / 2, y1: cy + h / 2 };
}

function textBackdropLuminance(map) {
  if (!map) return DEFAULT_LUM;
  const aspect = RATIOS[state.ratio].w / RATIOS[state.ratio].h;
  return regionLuminance(map, textRegion(), aspect);
}

async function autoAdjustColors(url) {
  const map = await getLumMap(url);

  // Race condition guard: discard if user changed background while loading
  const currentBg = allBackgrounds()[state.backgroundIndex];
  if (!currentBg || currentBg.url !== url) return;

  setState(pickColors(textBackdropLuminance(map)));
}

function randomColorsForCurrentBg() {
  const currentBg = allBackgrounds()[state.backgroundIndex];
  if (!currentBg) return;
  setState(pickColors(textBackdropLuminance(_lumCache.get(currentBg.url))));
}

// =============================================================
// --- Init ---
// =============================================================

function init() {
  // DOM refs
  _card     = document.getElementById('timeCard');
  _strip    = document.getElementById('bgStrip');
  _textarea = document.getElementById('textInput');

  // Load all persisted data. Everything read back is sanitized: storage can
  // hold data from older versions or edited by hand.
  const savedUI     = sanitizeUI(loadFromLS(LS_UI, {}));
  const savedCustom = loadFromLS(LS_CUSTOM_BGS, []);
  const customBackgrounds = (Array.isArray(savedCustom) ? savedCustom : [])
    .filter(isDataImage).slice(0, MAX_CUSTOM_BGS);

  favBgs = sanitizeBgMap(loadFromLS(LS_FAV_BGS, {}));
  loadStoredFavorites();

  const text            = randomPhrase();
  const totalBgs        = customBackgrounds.length + backgroundPresets.length;
  const backgroundIndex = Math.floor(Math.random() * totalBgs);

  // Single batch mutation — one render() at the end
  Object.assign(state, savedUI, { customBackgrounds, text, backgroundIndex });
  render();

  // Async color update — fires setState when image luminance resolves
  const currentBg = allBackgrounds()[state.backgroundIndex];
  if (currentBg) autoAdjustColors(currentBg.url);

  wireEvents();
}

// Reads favorites from storage, upgrading older formats (inline backgrounds ->
// `custom:` references) and dropping entries that can't be repaired.
function loadStoredFavorites() {
  const raw = loadFromLS(LS_FAVORITES, []);
  const list = Array.isArray(raw) ? raw : [];

  const seen = new Set();
  favorites = list
    .map(f => ingestFavorite(f, {}, favBgs))
    .filter(f => f && !seen.has(f.id) && seen.add(f.id));

  // Drop stored backgrounds no favorite refers to
  const used = new Set(favorites.map(f => f.backgroundUrl.slice(7)));
  for (const hash of Object.keys(favBgs)) if (!used.has(hash)) delete favBgs[hash];

  if (JSON.stringify(favorites) !== JSON.stringify(list)) {
    persistFavBgs();
    persistFavorites();
  }
}

function randomPhrase(current = '') {
  return randomItem(phrases.filter(p => p !== current));
}

// Registered only on the app page, so tests can load this file on their own.
if (document.getElementById('timeCard')) {
  document.addEventListener('DOMContentLoaded', init);
  window.addEventListener('pagehide', () => { if (_uiTimer !== null) persistUI(); });
}

// =============================================================
// --- Drag (mouse, touch and pen) + keyboard ---
// =============================================================

function moveText(dxPct, dyPct) {
  setState({
    positionX: clamp(state.positionX + dxPct, POS_MIN, POS_MAX),
    positionY: clamp(state.positionY + dyPct, POS_MIN, POS_MAX),
  });
}

function initDrag() {
  let drag = null;

  _card.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
    _card.setPointerCapture(e.pointerId);
  });

  _card.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const rect = _card.getBoundingClientRect();
    const dx = (e.clientX - drag.x) / rect.width  * 100;
    const dy = (e.clientY - drag.y) / rect.height * 100;
    drag.x = e.clientX;
    drag.y = e.clientY;
    moveText(dx, dy);
  });

  const end = e => { if (drag && e.pointerId === drag.id) drag = null; };
  _card.addEventListener('pointerup', end);
  _card.addEventListener('pointercancel', end);

  _card.addEventListener('keydown', e => {
    const step = e.shiftKey ? 5 : 1;
    const move = {
      ArrowLeft:  [-step, 0], ArrowRight: [step, 0],
      ArrowUp:    [0, -step], ArrowDown:  [0, step],
    }[e.key];
    if (!move) return;
    e.preventDefault();
    moveText(...move);
  });
}

// =============================================================
// --- Events ---
// =============================================================

function wireEvents() {
  initDrag();

  // --- Text row ---
  _textarea.addEventListener('input', () => {
    setState({ text: _textarea.value });
  });

  document.getElementById('btnRandom').addEventListener('click', () => {
    setState({ text: randomPhrase(state.text) });
  });

  document.getElementById('btnRandomBg').addEventListener('click', () => {
    const all = allBackgrounds();
    if (all.length <= 1) return;
    let idx;
    do { idx = Math.floor(Math.random() * all.length); }
    while (idx === state.backgroundIndex);
    setState({ backgroundIndex: idx });
    autoAdjustColors(all[idx].url);
  });

  document.getElementById('btnDownload').addEventListener('click', exportPNG);

  // --- Background strip (event delegation) ---
  _strip.addEventListener('click', e => {
    const thumb = e.target.closest('.thumbnail');
    if (thumb) {
      const idx = parseInt(thumb.dataset.index, 10);
      setState({ backgroundIndex: idx });
      const bg = allBackgrounds()[idx];
      if (bg) autoAdjustColors(bg.url);
      return;
    }
    const rmBtn = e.target.closest('.btn-remove-bg');
    if (rmBtn) {
      removeCustomBg(parseInt(rmBtn.dataset.index, 10));
      return;
    }
    if (e.target.closest('#btnBgUpload')) {
      document.getElementById('bgUploadInput').click();
    }
  });

  document.getElementById('bgUploadInput').addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) uploadCustomBg(file);
    e.target.value = '';
  });

  // --- Advanced panel toggle ---
  document.getElementById('btnToggleAdvanced').addEventListener('click', () => {
    setState({ advancedOpen: !state.advancedOpen });
  });

  // Keyboard: Escape, Ctrl+S, and Tab inside the import modal.
  // Single listener handles all — avoids duplicate listener bugs.
  document.addEventListener('keydown', e => {
    const modal     = document.getElementById('importModal');
    const modalOpen = !modal.hidden;

    if (e.key === 'Escape') {
      if (modalOpen) {
        cancelImport();  // modal takes priority
      } else if (state.advancedOpen) {
        setState({ advancedOpen: false });
      }
      return;
    }

    if (e.key === 'Tab' && modalOpen) {
      const focusable = [...modal.querySelectorAll('button')];
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (!modal.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      if (!state.advancedOpen) setState({ advancedOpen: true });
      document.getElementById('favoritesSection')
        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      setTimeout(() => document.getElementById('favNameInput')?.focus(), 150);
    }
  });

  // --- Colors ---
  document.getElementById('colorText').addEventListener('input', e => {
    setState({ textColor: e.target.value });
  });
  document.getElementById('colorShadow').addEventListener('input', e => {
    setState({ shadowColor: e.target.value });
  });
  document.getElementById('btnRandomColors').addEventListener('click', randomColorsForCurrentBg);

  // --- Font size ---
  const setFontSize = v => setState({ fontSize: roundOneDecimal(clamp(v, FONT_MIN, FONT_MAX)) });
  document.getElementById('sliderFontSize').addEventListener('input', e => {
    setFontSize(parseFloat(e.target.value));
  });
  document.getElementById('btnFontMinus').addEventListener('click', () => setFontSize(state.fontSize - 0.1));
  document.getElementById('btnFontPlus').addEventListener('click',  () => setFontSize(state.fontSize + 0.1));

  // --- Align, effect, ratio (segmented buttons) ---
  document.querySelectorAll('.btn-seg').forEach(btn => {
    btn.addEventListener('click', () => {
      const { align, effect, ratio } = btn.dataset;
      if (align)  setState({ textAlign: align });
      if (effect) setState({ effect });
      if (ratio)  setState({ ratio });
    });
  });
  document.getElementById('btnResetPosition').addEventListener('click', () => {
    setState({ positionX: 50, positionY: 50, textAlign: 'center' });
  });

  document.getElementById('chkTransparent').addEventListener('change', e => {
    setState({ transparentExport: e.target.checked });
  });

  // --- Favorites ---
  document.getElementById('btnSaveFavorite').addEventListener('click', saveFavorite);

  document.getElementById('favoritesList').addEventListener('click', e => {
    const loadBtn = e.target.closest('.btn-load-fav');
    if (loadBtn) { loadFavorite(Number(loadBtn.dataset.id)); return; }
    const delBtn = e.target.closest('.btn-delete-fav');
    if (delBtn)  { deleteFavorite(Number(delBtn.dataset.id)); }
  });

  document.getElementById('btnExportFavorites').addEventListener('click', exportFavorites);
  document.getElementById('btnImportFavorites').addEventListener('click', () => {
    document.getElementById('importFileInput').click();
  });
  document.getElementById('importFileInput').addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) readImportFile(file);
    e.target.value = '';
  });

  // Import modal buttons
  document.getElementById('importOverlay').addEventListener('click',    cancelImport);
  document.getElementById('btnImportCancel').addEventListener('click',  cancelImport);
  document.getElementById('btnImportMerge').addEventListener('click',   () => confirmImport('merge'));
  document.getElementById('btnImportReplace').addEventListener('click', () => confirmImport('replace'));
}

// =============================================================
// --- Custom Backgrounds ---
// =============================================================

// Reads an image file and returns a JPEG data URL no larger than
// MAX_UPLOAD_SIDE on its long side, so five of them fit in localStorage.
async function downscaleImageFile(file) {
  const src = URL.createObjectURL(file);
  try {
    const img   = await loadImage(src);
    const scale = Math.min(1, MAX_UPLOAD_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width  = Math.round(img.naturalWidth  * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';               // JPEG has no alpha
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', UPLOAD_QUALITY);
  } finally {
    URL.revokeObjectURL(src);
  }
}

// Puts a background first in the list, evicting the oldest when full. Edits
// state.customBackgrounds directly (accepted exception): callers follow with
// a setState carrying the new backgroundIndex.
function addCustomBg(url) {
  if (state.customBackgrounds.length >= MAX_CUSTOM_BGS) {
    state.customBackgrounds.pop();
    toast('Oldest background removed to make room');
  }
  state.customBackgrounds.unshift(url);
  invalidateStrip();
  persistCustomBgs();
}

async function uploadCustomBg(file) {
  let url;
  try {
    url = await downscaleImageFile(file);
  } catch (_) {
    toast('Could not read that image', { type: 'error' });
    return;
  }
  addCustomBg(url);
  setState({ backgroundIndex: 0 });  // auto-select new upload
  autoAdjustColors(url);
}

function removeCustomBg(index) {
  // index is position in allBackgrounds() == position in customBackgrounds[]
  // (custom bgs are always at the start of allBackgrounds)
  const wasActive = index === state.backgroundIndex;

  state.customBackgrounds.splice(index, 1);
  invalidateStrip();
  persistCustomBgs();

  // Recalculate backgroundIndex
  let newIndex = state.backgroundIndex;
  if (wasActive) {
    // Select next available; clamp to valid range
    newIndex = Math.min(index, allBackgrounds().length - 1);
  } else if (index < state.backgroundIndex) {
    // Removed item was before active — shift index down by 1
    newIndex = state.backgroundIndex - 1;
  }

  setState({ backgroundIndex: newIndex });

  if (wasActive) {
    const newBg = allBackgrounds()[newIndex];
    if (newBg) autoAdjustColors(newBg.url);
  }
}

// =============================================================
// --- Favorites CRUD ---
// =============================================================

function saveFavorite() {
  const input   = document.getElementById('favNameInput');
  const errorEl = document.getElementById('favNameError');
  const name    = input.value.trim();

  if (!name) {
    errorEl.hidden = false;
    input.classList.add('error');
    input.focus();
    setTimeout(() => { errorEl.hidden = true; input.classList.remove('error'); }, 2500);
    return;
  }

  const bg = allBackgrounds()[state.backgroundIndex];
  let backgroundUrl = bg.url;
  if (bg.isCustom) {
    // The image goes to favBgs once; the favorite only keeps its hash
    const hash = hashString(bg.url);
    favBgs[hash] = bg.url;
    backgroundUrl = `custom:${hash}`;
    persistFavBgs();
  }

  let id = Date.now();
  while (favorites.some(f => f.id === id)) id++;

  favorites.push({
    id,
    name,
    text:          state.text,
    backgroundUrl,
    fontSize:      state.fontSize,
    textColor:     state.textColor,
    shadowColor:   state.shadowColor,
    positionX:     state.positionX,
    positionY:     state.positionY,
    textAlign:     state.textAlign,
    ratio:         state.ratio,
    effect:        state.effect,
  });

  persistFavorites();
  input.value = '';
  refreshFavorites();
  toast(`"${name}" saved`);
}

function loadFavorite(id) {
  const fav = favorites.find(f => f.id === id);
  if (!fav) return;

  let bgIndex = 0;
  const presetIdx = backgroundPresets.findIndex(p => p.url === fav.backgroundUrl);

  if (presetIdx !== -1) {
    // Preset: account for custom bgs prepended to allBackgrounds
    bgIndex = state.customBackgrounds.length + presetIdx;
  } else if (fav.backgroundUrl.startsWith('custom:')) {
    const url = favBgs[fav.backgroundUrl.slice(7)];
    if (url) {
      bgIndex = state.customBackgrounds.indexOf(url);
      if (bgIndex === -1) { addCustomBg(url); bgIndex = 0; }
    } else {
      toast('That favorite\'s background is no longer available', { type: 'error' });
    }
  }

  setState({
    text:            fav.text,
    backgroundIndex: bgIndex,
    fontSize:        fav.fontSize,
    textColor:       fav.textColor,
    shadowColor:     fav.shadowColor,
    positionX:       fav.positionX,
    positionY:       fav.positionY,
    textAlign:       fav.textAlign,
    ratio:           fav.ratio,
    effect:          fav.effect,
  });
}

function deleteFavorite(id) {
  const idx = favorites.findIndex(f => f.id === id);
  if (idx === -1) return;

  const removed = favorites.splice(idx, 1)[0];
  const nextId  = favorites[idx]?.id;   // the favorite that now sits where it was
  persistFavorites();
  refreshFavorites();

  let undone = false;
  toast(`"${removed.name}" deleted`, {
    type: 'undo',
    undoCallback: () => {
      if (undone) return;
      undone = true;
      // Back before the same neighbor, even if the list changed meanwhile
      const at = favorites.findIndex(f => f.id === nextId);
      favorites.splice(at === -1 ? favorites.length : at, 0, removed);
      persistFavorites();
      refreshFavorites();
    },
  });
}

// =============================================================
// --- Favorites Export / Import ---
// =============================================================

function exportFavorites() {
  const used = new Set(favorites.map(f => f.backgroundUrl.slice(7)));
  const backgrounds = Object.fromEntries(Object.entries(favBgs).filter(([hash]) => used.has(hash)));
  const data = { version: 3, favorites, backgrounds };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob(blob, 'pineapple-favorites.json');
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);  // revoking at once can cancel the download
}

let _pendingImport = null;
let _modalOpener   = null;

function readImportFile(file) {
  const reader = new FileReader();
  reader.onload = e => {
    let parsed;
    try { parsed = JSON.parse(e.target.result); }
    catch (_) { toast('Invalid file', { type: 'error' }); return; }

    if (!parsed || !Array.isArray(parsed.favorites)) {
      toast('Unrecognized format', { type: 'error' }); return;
    }

    const incoming = { ...favBgs, ...sanitizeBgMap(parsed.backgrounds) };
    const bgs      = {};   // backgrounds the imported favorites need; merged on confirm
    const seen     = new Set();
    const valid    = parsed.favorites
      .map(f => ingestFavorite(f, incoming, bgs))
      .filter(f => f && !seen.has(f.id) && seen.add(f.id));
    const skipped  = parsed.favorites.length - valid.length;

    if (valid.length === 0) {
      toast('No valid favorites found', { type: 'error' }); return;
    }

    _pendingImport = { valid, skipped, bgs };
    document.getElementById('importSummary').textContent = skipped > 0
      ? `${valid.length} valid, ${skipped} skipped`
      : `${valid.length} favorite(s) to import`;
    openImportModal();
  };
  reader.readAsText(file);
}

function openImportModal() {
  _modalOpener = document.activeElement;
  document.getElementById('importModal').hidden = false;
  document.getElementById('btnImportMerge').focus();
}

function closeImportModal() {
  document.getElementById('importModal').hidden = true;
  _modalOpener?.focus?.();
  _modalOpener = null;
}

function cancelImport() {
  _pendingImport = null;
  closeImportModal();
}

function confirmImport(mode) {
  if (!_pendingImport) return;
  const { valid, bgs } = _pendingImport;
  let { skipped } = _pendingImport;
  _pendingImport = null;
  closeImportModal();

  let imported;
  if (mode === 'replace') {
    favorites = valid;
    imported  = valid.length;
  } else {
    // Merge — deduplicate by id
    const existingIds = new Set(favorites.map(f => f.id));
    const toAdd = valid.filter(f => !existingIds.has(f.id));
    favorites.push(...toAdd);
    imported = toAdd.length;
    skipped += valid.length - toAdd.length;
  }

  Object.assign(favBgs, bgs);
  persistFavBgs();
  persistFavorites();
  refreshFavorites();
  toast(skipped > 0
    ? `${imported} imported, ${skipped} skipped`
    : `${imported} favorite(s) imported`);
}

// =============================================================
// --- Export PNG ---
// =============================================================
// Drawn straight onto a canvas at a fixed resolution per ratio (RATIOS[..].out),
// reproducing the card's CSS layout: cover background, 90%-wide centered text
// box, em-based size, shadow or outline.

function drawCardText(ctx, W, H) {
  if (!state.text.trim()) return;

  const fontPx = state.fontSize * EM_CQW / 100 * W;
  const lineH  = fontPx * LINE_HEIGHT;
  ctx.font = `${fontPx}px ${FONT_FAMILY}`;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = state.textAlign;

  const lines = wrapText(state.text, W * TEXT_BOX, s => ctx.measureText(s).width);
  const metrics = ctx.measureText('Hg');
  const ascent  = metrics.fontBoundingBoxAscent  ?? fontPx * 0.8;
  const descent = metrics.fontBoundingBoxDescent ?? fontPx * 0.2;

  const cx   = state.positionX / 100 * W;
  const cy   = state.positionY / 100 * H;
  const left = cx - W * TEXT_BOX / 2;
  const x    = { left, center: cx, right: left + W * TEXT_BOX }[state.textAlign];
  const top  = cy - lines.length * lineH / 2;

  lines.forEach((line, i) => {
    // Center the glyph box inside the line box, as CSS does
    const y = top + i * lineH + (lineH - (ascent + descent)) / 2 + ascent;

    if (state.effect === 'outline') {
      ctx.lineJoin    = 'round';
      ctx.lineWidth   = W * OUTLINE_CQW / 100;
      ctx.strokeStyle = state.shadowColor;
      ctx.strokeText(line, x, y);
    } else {
      const d = W * SHADOW_CQW / 100;
      ctx.fillStyle = state.shadowColor;
      ctx.fillText(line, x + d, y + d);
      ctx.fillText(line, x - d, y - d);
    }
    ctx.fillStyle = state.textColor;
    ctx.fillText(line, x, y);
  });
}

async function renderCardToCanvas() {
  const [W, H] = RATIOS[state.ratio].out;
  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  if (!state.transparentExport) {
    const bgs = allBackgrounds();
    const bg  = bgs[state.backgroundIndex] || bgs[0];
    const img = await loadImage(bg.url);
    ctx.drawImage(img, ...coverRect(img.naturalWidth, img.naturalHeight, W, H));
  }

  // The card font comes from a web font: make sure it is loaded before measuring
  try {
    await document.fonts.load(`40px ${FONT_FAMILY}`, state.text);
    await document.fonts.ready;
  } catch (_) { /* falls back to sans-serif */ }

  drawCardText(ctx, W, H);
  return canvas;
}

async function exportPNG() {
  const btn     = document.getElementById('btnDownload');
  const overlay = document.getElementById('downloadOverlay');
  btn.disabled   = true;
  overlay.hidden = false;

  try {
    const canvas = await renderCardToCanvas();
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob returned null')), 'image/png');
    });
    const suffix = state.transparentExport ? '-transparent' : '';
    downloadBlob(blob, `pineapple-time-card-${state.ratio.replace(':', '-')}${suffix}.png`);
  } catch (err) {
    console.error('Export failed:', err);
    if (location.protocol === 'file:' && err instanceof DOMException && err.name === 'SecurityError') {
      toast('PNG export blocked on file:// — use the online version or serve the folder locally', { type: 'error' });
    } else {
      toast('Export error', { type: 'error' });
    }
  } finally {
    btn.disabled   = false;
    overlay.hidden = true;
  }
}
