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

const backgroundPresets = [
  { url: 'backgrounds/band-geeks.jpg',          label: 'Band Geeks' },
  { url: 'backgrounds/club-spongebob.jpg',       label: 'Club SpongeBob' },
  { url: 'backgrounds/frankendoodle.jpg',        label: 'Frankendoodle' },
  { url: 'backgrounds/fry-cook-games.jpg',       label: 'Fry Cook Games' },
  { url: 'backgrounds/gary-bath.jpg',            label: 'Gary Takes a Bath' },
  { url: 'backgrounds/graveyard-shift.jpg',      label: 'Graveyard Shift' },
  { url: 'backgrounds/im-with-stupid.jpg',       label: "I'm with Stupid" },
  { url: 'backgrounds/jellyfish-hunter.jpg',     label: 'Jellyfish Hunter' },
  { url: 'backgrounds/krusty-love.png',          label: 'Krusty Love' },
  { url: 'backgrounds/pressure.jpg',             label: 'Pressure' },
  { url: 'backgrounds/procrastination.jpg',      label: 'Procrastination' },
  { url: 'backgrounds/sandy-worm.jpg',           label: 'Sandy, SpongeBob & the Worm' },
  { url: 'backgrounds/shanghaied.jpg',           label: 'Shanghaied' },
  { url: 'backgrounds/spongeguard-on-duty.png',  label: 'SpongeGuard on Duty' },
  { url: 'backgrounds/squid-on-strike.png',      label: 'Squid on Strike' },
];

// SpongeBob-themed palettes — dark for light backgrounds, light for dark backgrounds
const DARK_PALETTE  = ['#5c2e0d', '#7a1f1f', '#0d3a5c', '#1f5f2a', '#5a1f6b',
                       '#0d4d4d', '#6b4a00', '#7a2d4d', '#2a2a6b', '#5c1500',
                       '#1a4d1a', '#4d0d2a', '#0d2e4d', '#3a1f5c', '#6b2d0d',
                       '#0d4d3a', '#4d1f1f', '#3a3a0d'];
const LIGHT_PALETTE = ['#ffe566', '#fff4cc', '#ffd6e0', '#d6f5ff', '#e0ffd6',
                       '#f0e6ff', '#ffe0b3', '#fff2b3', '#d6ffe9', '#ffffff',
                       '#ffccdd', '#cce6ff', '#fff0cc', '#e6ffcc', '#ffe6f0',
                       '#ccfff0', '#f5d6ff', '#ffd9b3'];

// =============================================================
// --- Utils ---
// =============================================================

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function roundOneDecimal(val) {
  return Math.round(val * 10) / 10;
}

function generateDarkColor() {
  return DARK_PALETTE[Math.floor(Math.random() * DARK_PALETTE.length)];
}

function generateLightColor() {
  return LIGHT_PALETTE[Math.floor(Math.random() * LIGHT_PALETTE.length)];
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
const LS_CUSTOM_BGS  = 'pineapple_v2_custom_bgs';
const LS_UI          = 'pineapple_v2_ui';
const MAX_CUSTOM_BGS = 5;

const state = {
  text:              '',
  backgroundIndex:   0,
  customBackgrounds: [],   // base64 URLs; max MAX_CUSTOM_BGS
  fontSize:          3,    // em; range [0.5, 8]
  textColor:         '#5c2e0d',
  shadowColor:       '#ffe566',
  positionX:         50,   // [5, 95]
  positionY:         50,   // [5, 95]
  textAlign:         'center',
  ratio:             '16:9',
  advancedOpen:      false,
};

// Favorites are NOT in state — managed separately to avoid
// rebuilding the favorites list on every keystroke.
let favorites = [];

// --- setState ---
// Rule: ALL event handlers and async callbacks mutate state through setState().
// Exception: init() mutates state directly and calls render() once.

function setState(patch) {
  Object.assign(state, patch);
  render();
}

// --- allBackgrounds ---

function allBackgrounds() {
  return [
    ...state.customBackgrounds.map((url, i) => ({
      url,
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
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      toast('Storage full', { type: 'error' });
    }
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

// =============================================================
// --- Render ---
// =============================================================

// DOM refs — populated in init() after DOMContentLoaded
let _card, _strip, _overlay, _textarea;

function renderCard() {
  const bgs = allBackgrounds();
  const bg  = bgs[state.backgroundIndex] || bgs[0];

  _card.style.backgroundImage = `url('${bg.url}')`;
  // Use classList.toggle to avoid clobbering other potential classes
  _card.classList.toggle('ratio-4-3', state.ratio === '4:3');

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
  wrapper.style.fontSize  = `${state.fontSize}em`;
  wrapper.style.textAlign = state.textAlign;

  _card.style.color      = state.textColor;
  _card.style.textShadow =
    `2px 2px 0 ${state.shadowColor}, -2px -2px 0 ${state.shadowColor}`;
}

// Strip dirty-check — avoids rebuilding on text/color/position changes
const _stripPrev = { customLength: -1, backgroundIndex: -1 };

function renderStrip() {
  const changed =
    state.customBackgrounds.length !== _stripPrev.customLength ||
    state.backgroundIndex          !== _stripPrev.backgroundIndex;

  if (!changed) return;

  _stripPrev.customLength    = state.customBackgrounds.length;
  _stripPrev.backgroundIndex = state.backgroundIndex;

  const bgs       = allBackgrounds();
  const uploadBtn = document.getElementById('btnBgUpload');

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

    const thumb = document.createElement('div');
    thumb.className = 'thumbnail' + (i === state.backgroundIndex ? ' active' : '');
    thumb.style.backgroundImage = `url('${bg.url}')`;
    thumb.setAttribute('aria-label', bg.label);
    thumb.setAttribute('title', bg.label);
    thumb.dataset.index = i;
    wrapper.appendChild(thumb);

    if (bg.isCustom) {
      const rmBtn = document.createElement('button');
      rmBtn.className = 'btn-remove-bg';
      rmBtn.textContent = '✕';
      rmBtn.setAttribute('aria-label', `Remove ${bg.label}`);
      rmBtn.dataset.index = i;
      wrapper.appendChild(rmBtn);
    }

    _strip.insertBefore(wrapper, uploadBtn);
  });

  // Scroll active thumbnail into view after rebuild
  const activeThumb = _strip.querySelector('.thumbnail.active');
  if (activeThumb) {
    activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
}

// Favorites list dirty-check — avoids rebuilding on every keypress
const _favPrev = { count: -1, ids: '' };

function renderFavoritesList() {
  const list = document.getElementById('favoritesList');
  if (!list) return;

  // Cheap dirty-check: compare count + concatenated ids
  const currentIds = favorites.map(f => f.id).join(',');
  if (favorites.length === _favPrev.count && currentIds === _favPrev.ids) return;
  _favPrev.count = favorites.length;
  _favPrev.ids   = currentIds;

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
    loadBtn.textContent = 'Cargar';
    loadBtn.dataset.id = fav.id;

    const delBtn = document.createElement('button');
    delBtn.className = 'btn-delete-fav';
    delBtn.textContent = '✕';
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

  // Align buttons
  document.querySelectorAll('.btn-align').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.align === state.textAlign);
  });

  // Color pickers
  const colorText   = document.getElementById('colorText');
  const colorShadow = document.getElementById('colorShadow');
  if (colorText)   colorText.value   = state.textColor;
  if (colorShadow) colorShadow.value = state.shadowColor;

  // Ratio button label
  const btnRatio = document.getElementById('btnRatio');
  if (btnRatio) btnRatio.textContent =
    state.ratio === '16:9' ? '16:9 → 4:3' : '4:3 → 16:9';

  // Advanced panel visibility
  const panel = document.getElementById('advancedPanel');
  if (panel) panel.hidden = !state.advancedOpen;

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

const _brightnessCache = new Map(); // url -> brightness

async function _getImageBrightness(url) {
  if (_brightnessCache.has(url)) return _brightnessCache.get(url);

  return new Promise(resolve => {
    const img = new Image();
    if (location.protocol !== 'file:') img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width  = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 100, 100);
        const data = ctx.getImageData(0, 0, 100, 100).data;
        let total = 0;
        for (let i = 0; i < data.length; i += 4) {
          total += 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
        }
        const brightness = total / (100 * 100);
        _brightnessCache.set(url, brightness);
        resolve(brightness);
      } catch (_) {
        _brightnessCache.set(url, 128); // CORS/taint fallback
        resolve(128);
      }
    };
    img.onerror = () => { _brightnessCache.set(url, 128); resolve(128); };
    img.src = url;
  });
}

async function autoAdjustColors(url) {
  const brightness = await _getImageBrightness(url);

  // Race condition guard: discard if user changed background while loading
  const currentBg = allBackgrounds()[state.backgroundIndex];
  if (!currentBg || currentBg.url !== url) return;

  const textColor   = brightness < 128 ? generateLightColor() : generateDarkColor();
  const shadowColor = brightness < 128 ? generateDarkColor()  : generateLightColor();
  setState({ textColor, shadowColor });
}

function randomColorsForCurrentBg() {
  const currentBg = allBackgrounds()[state.backgroundIndex];
  if (!currentBg) return;
  const brightness = _brightnessCache.get(currentBg.url) ?? 128;
  const textColor   = brightness < 128 ? generateLightColor() : generateDarkColor();
  const shadowColor = brightness < 128 ? generateDarkColor()  : generateLightColor();
  setState({ textColor, shadowColor });
}

// =============================================================
// --- Init ---
// =============================================================

function init() {
  // DOM refs
  _card     = document.getElementById('timeCard');
  _strip    = document.getElementById('bgStrip');
  _overlay  = document.getElementById('downloadOverlay');
  _textarea = document.getElementById('textInput');

  // Load all persisted data (each read is individually try/catch via loadFromLS)
  const savedUI     = loadFromLS(LS_UI, {});
  const savedCustom = loadFromLS(LS_CUSTOM_BGS, []);
  favorites         = loadFromLS(LS_FAVORITES, []);

  // Compute all init values upfront
  const customBackgrounds = Array.isArray(savedCustom) ? savedCustom : [];
  const advancedOpen      = savedUI.advancedOpen ?? false;
  const text              = _randomPhrase('');
  const totalBgs          = customBackgrounds.length + backgroundPresets.length;
  const backgroundIndex   = Math.floor(Math.random() * totalBgs);

  // Single batch mutation — one render() at the end (spec requirement)
  Object.assign(state, { customBackgrounds, advancedOpen, text, backgroundIndex });
  render();

  // Async color update — fires setState when image brightness resolves
  const currentBg = allBackgrounds()[state.backgroundIndex];
  if (currentBg) autoAdjustColors(currentBg.url);

  wireEvents();
}

function _randomPhrase(current) {
  const pool = phrases.filter(p => p !== current);
  return pool[Math.floor(Math.random() * pool.length)];
}

document.addEventListener('DOMContentLoaded', init);

// --- Persistence helpers ---
// Call these explicitly after mutations that need to be saved.
// NOT called automatically in setState — only persists what changed.

function persistUI() {
  saveToLS(LS_UI, { advancedOpen: state.advancedOpen });
}

function persistCustomBgs() {
  saveToLS(LS_CUSTOM_BGS, state.customBackgrounds);
}

function persistFavorites() {
  saveToLS(LS_FAVORITES, favorites);
}

// =============================================================
// --- Drag (mouse) ---
// =============================================================

function initMouseDrag() {
  let dragging = false;
  let lastX, lastY;

  _card.addEventListener('mousedown', e => {
    if (e.target.classList.contains('btn-remove-bg')) return;
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    _card.style.userSelect = 'none';
    e.preventDefault();
  });

  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const rect = _card.getBoundingClientRect();
    const dx = (e.clientX - lastX) / rect.width  * 100;
    const dy = (e.clientY - lastY) / rect.height * 100;
    lastX = e.clientX;
    lastY = e.clientY;
    setState({
      positionX: clamp(state.positionX + dx, 5, 95),
      positionY: clamp(state.positionY + dy, 5, 95),
    });
  });

  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    _card.style.userSelect = '';
  });
}

// =============================================================
// --- Drag (touch) ---
// =============================================================

function initTouchDrag() {
  let lastTX, lastTY;

  _card.addEventListener('touchstart', e => {
    if (e.touches.length !== 1) return;
    lastTX = e.touches[0].clientX;
    lastTY = e.touches[0].clientY;
  }, { passive: true });

  _card.addEventListener('touchmove', e => {
    if (e.touches.length !== 1) return;
    e.preventDefault(); // blocks page scroll during drag
    const rect = _card.getBoundingClientRect();
    const dx = (e.touches[0].clientX - lastTX) / rect.width  * 100;
    const dy = (e.touches[0].clientY - lastTY) / rect.height * 100;
    lastTX = e.touches[0].clientX;
    lastTY = e.touches[0].clientY;
    setState({
      positionX: clamp(state.positionX + dx, 5, 95),
      positionY: clamp(state.positionY + dy, 5, 95),
    });
  }, { passive: false }); // passive:false required for preventDefault
}

// =============================================================
// --- Events ---
// =============================================================

function wireEvents() {
  // Drag (replaces temporary calls in init)
  initMouseDrag();
  initTouchDrag();

  // --- Text row ---
  _textarea.addEventListener('input', () => {
    setState({ text: _textarea.value });
  });

  document.getElementById('btnRandom').addEventListener('click', () => {
    setState({ text: _randomPhrase(state.text) });
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
    persistUI();
  });

  // Keyboard: Escape + Ctrl+S
  // Single listener handles both — avoids duplicate listener bugs.
  document.addEventListener('keydown', e => {
    const modalOpen = !document.getElementById('importModal').hidden;

    if (e.key === 'Escape') {
      if (modalOpen) {
        cancelImport();  // modal takes priority
      } else if (state.advancedOpen) {
        setState({ advancedOpen: false });
        persistUI();
      }
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (!state.advancedOpen) {
        setState({ advancedOpen: true });
        persistUI();
      }
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
  document.getElementById('sliderFontSize').addEventListener('input', e => {
    setState({ fontSize: roundOneDecimal(parseFloat(e.target.value)) });
  });
  document.getElementById('btnFontMinus').addEventListener('click', () => {
    setState({ fontSize: roundOneDecimal(clamp(state.fontSize - 0.1, 0.5, 8)) });
  });
  document.getElementById('btnFontPlus').addEventListener('click', () => {
    setState({ fontSize: roundOneDecimal(clamp(state.fontSize + 0.1, 0.5, 8)) });
  });

  // --- Position ---
  document.querySelectorAll('.btn-align').forEach(btn => {
    btn.addEventListener('click', () => setState({ textAlign: btn.dataset.align }));
  });
  document.getElementById('btnResetPosition').addEventListener('click', () => {
    setState({ positionX: 50, positionY: 50, textAlign: 'center' });
  });

  // --- Ratio ---
  document.getElementById('btnRatio').addEventListener('click', () => {
    setState({ ratio: state.ratio === '16:9' ? '4:3' : '16:9' });
  });

  // --- Favorites ---
  document.getElementById('btnSaveFavorite').addEventListener('click', saveFavorite);

  document.getElementById('favoritesList').addEventListener('click', e => {
    const loadBtn = e.target.closest('.btn-load-fav');
    if (loadBtn) { loadFavorite(parseInt(loadBtn.dataset.id, 10)); return; }
    const delBtn = e.target.closest('.btn-delete-fav');
    if (delBtn)  { deleteFavorite(parseInt(delBtn.dataset.id, 10)); }
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

function uploadCustomBg(file) {
  const reader = new FileReader();
  reader.onload = e => {
    const dataUrl = e.target.result;

    // Direct mutation of state.customBackgrounds is an accepted exception here
    // (same as in loadFavorite) — setState is called immediately after with the
    // updated backgroundIndex so render() gets the correct final state.
    if (state.customBackgrounds.length >= MAX_CUSTOM_BGS) {
      state.customBackgrounds.pop(); // evict oldest
      toast('Oldest background removed to make room');
    }

    state.customBackgrounds.unshift(dataUrl); // new upload at index 0
    persistCustomBgs();
    setState({ backgroundIndex: 0 });         // auto-select new upload
    autoAdjustColors(dataUrl);
  };
  reader.readAsDataURL(file);
}

function removeCustomBg(index) {
  // index is position in allBackgrounds() == position in customBackgrounds[]
  // (custom bgs are always at the start of allBackgrounds)
  const wasActive = index === state.backgroundIndex;

  state.customBackgrounds.splice(index, 1);
  persistCustomBgs();

  // Recalculate backgroundIndex
  let newIndex = state.backgroundIndex;
  if (wasActive) {
    // Select next available; clamp to valid range
    newIndex = Math.min(index, allBackgrounds().length - 1);
    if (newIndex < 0) newIndex = 0;
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
  favorites.push({
    id:            Date.now(),
    name,
    text:          state.text,
    backgroundUrl: bg ? bg.url : '',
    fontSize:      state.fontSize,
    textColor:     state.textColor,
    shadowColor:   state.shadowColor,
    positionX:     state.positionX,
    positionY:     state.positionY,
    textAlign:     state.textAlign,
    ratio:         state.ratio,
  });

  persistFavorites();
  input.value = '';
  // Invalidate dirty-check so list rebuilds
  _favPrev.count = -1;
  renderFavoritesList();
  toast(`"${name}" saved`);
}

function loadFavorite(id) {
  const fav = favorites.find(f => f.id === id);
  if (!fav) return;

  const presetIdx = backgroundPresets.findIndex(p => p.url === fav.backgroundUrl);
  let bgIndex;

  if (presetIdx !== -1) {
    // Preset: account for custom bgs prepended to allBackgrounds
    bgIndex = state.customBackgrounds.length + presetIdx;
  } else if (fav.backgroundUrl) {
    // Custom bg: re-insert if not already present
    // Note: direct mutation of state.customBackgrounds here is an accepted
    // exception — setState is called immediately after with the new bgIndex.
    let customIdx = state.customBackgrounds.indexOf(fav.backgroundUrl);
    if (customIdx === -1) {
      if (state.customBackgrounds.length >= MAX_CUSTOM_BGS) {
        state.customBackgrounds.pop();
        toast('Oldest background removed to make room');
      }
      state.customBackgrounds.unshift(fav.backgroundUrl);
      persistCustomBgs();
      customIdx = 0;
    }
    bgIndex = customIdx;
  } else {
    bgIndex = 0;
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
  });
}

function deleteFavorite(id) {
  const idx = favorites.findIndex(f => f.id === id);
  if (idx === -1) return;

  const removed = favorites.splice(idx, 1)[0];
  persistFavorites();
  _favPrev.count = -1; // invalidate dirty-check
  renderFavoritesList();

  let undone = false;
  toast(`"${removed.name}" deleted`, {
    type: 'undo',
    undoCallback: () => {
      if (undone) return;
      undone = true;
      favorites.splice(idx, 0, removed); // re-insert at original position
      persistFavorites();
      _favPrev.count = -1;
      renderFavoritesList();
    },
  });
}

// =============================================================
// --- Favorites Export / Import ---
// =============================================================

function exportFavorites() {
  const data = { version: 2, favorites };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'pineapple-favorites.json';
  a.click();
  URL.revokeObjectURL(url);
}

let _pendingImport = null;

function readImportFile(file) {
  const reader = new FileReader();
  reader.onload = e => {
    let parsed;
    try { parsed = JSON.parse(e.target.result); }
    catch (_) { toast('Invalid file', { type: 'error' }); return; }

    if (!parsed || !Array.isArray(parsed.favorites)) {
      toast('Unrecognized format', { type: 'error' }); return;
    }

    const required = ['id','name','text','backgroundUrl','fontSize',
                      'textColor','shadowColor','positionX','positionY','textAlign','ratio'];
    const valid   = parsed.favorites.filter(f => required.every(k => k in f));
    const skipped = parsed.favorites.length - valid.length;

    if (valid.length === 0) {
      toast('No valid favorites found', { type: 'error' }); return;
    }

    _pendingImport = { valid, skipped };
    document.getElementById('importSummary').textContent = skipped > 0
      ? `${valid.length} valid, ${skipped} skipped`
      : `${valid.length} favorite(s) to import`;
    document.getElementById('importModal').hidden = false;
  };
  reader.readAsText(file);
}

function cancelImport() {
  _pendingImport = null;
  document.getElementById('importModal').hidden = true;
}

function confirmImport(mode) {
  if (!_pendingImport) return;
  const { valid, skipped } = _pendingImport;
  _pendingImport = null;
  document.getElementById('importModal').hidden = true;

  if (mode === 'replace') {
    favorites = valid;
  } else {
    // Merge — deduplicate by id
    const existingIds = new Set(favorites.map(f => f.id));
    const toAdd = valid.filter(f => !existingIds.has(f.id));
    favorites.push(...toAdd);
    const dupesSkipped = (valid.length - toAdd.length) + skipped;
    persistFavorites();
    _favPrev.count = -1;
    renderFavoritesList();
    toast(dupesSkipped > 0
      ? `${toAdd.length} imported, ${dupesSkipped} skipped`
      : `${toAdd.length} favorite(s) imported`);
    return;
  }

  // replace path
  persistFavorites();
  _favPrev.count = -1;
  renderFavoritesList();
  toast(skipped > 0
    ? `${valid.length} imported, ${skipped} skipped`
    : `${valid.length} favorite(s) imported`);
}

// =============================================================
// --- Export PNG ---
// =============================================================

function exportPNG() {
  const btn = document.getElementById('btnDownload');
  btn.disabled    = true;
  _overlay.hidden = false;

  const filename = `pineapple-time-card-${state.ratio.replace(':', '-')}.png`;

  html2canvas(_card, {
    scale:      2,
    useCORS:    true,
    allowTaint: true,
    // downloadOverlay is outside _card (sibling of timeCard inside cardContainer),
    // so it never appears in the capture. onclone is kept as safety net.
    onclone: cloned => {
      const ov = cloned.getElementById('downloadOverlay');
      if (ov) ov.remove();
    },
  }).then(canvas => {
    const a = document.createElement('a');
    a.download = filename;
    a.href = canvas.toDataURL('image/png');
    a.click();
  }).catch(err => {
    console.error('Export failed:', err);
    if (location.protocol === 'file:' && err instanceof DOMException && err.name === 'SecurityError') {
      toast('PNG export blocked on file:// — use the online version or serve the folder locally', { type: 'error' });
    } else {
      toast('Export error', { type: 'error' });
    }
  }).finally(() => {
    btn.disabled    = false;
    _overlay.hidden = true;
  });
}
