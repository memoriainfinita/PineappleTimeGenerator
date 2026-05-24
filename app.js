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

// SpongeBob-themed palettes — intentionally limited for visual coherence
const DARK_PALETTE  = ['#3e1600', '#1a0a00', '#0d1b2a', '#1b2a1b', '#2a0a2a'];
const LIGHT_PALETTE = ['#ffeb99', '#ffe566', '#fff4cc', '#ffd700', '#fff8e1'];

// =============================================================
// --- Utils ---
// =============================================================

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function roundOneDecimal(val) {
  return Math.round(val * 10) / 10;
}

function colorBrightness(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b;
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
    btn.textContent = 'Deshacer';
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
  textColor:         '#3e1600',
  shadowColor:       '#ffeb99',
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
      label: `Fondo personalizado ${i + 1}`,
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
      toast('Error: almacenamiento lleno', { type: 'error' });
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
      rmBtn.setAttribute('aria-label', `Eliminar ${bg.label}`);
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
    empty.textContent = 'No hay favoritos guardados.';
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

  // Position sliders
  const sliderX = document.getElementById('sliderX');
  const sliderY = document.getElementById('sliderY');
  if (sliderX) sliderX.value = state.positionX;
  if (sliderY) sliderY.value = state.positionY;

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
    img.crossOrigin = 'anonymous';
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
  document.getElementById('sliderX').addEventListener('input', e => {
    setState({ positionX: parseInt(e.target.value, 10) });
  });
  document.getElementById('sliderY').addEventListener('input', e => {
    setState({ positionY: parseInt(e.target.value, 10) });
  });
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
