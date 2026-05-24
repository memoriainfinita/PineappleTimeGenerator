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
