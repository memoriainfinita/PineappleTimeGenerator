# Pineapple Time Generator v2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the app in tres archivos separados (index.html / style.css / app.js) con arquitectura state-driven limpia que corrige todos los bugs conocidos de v1.

**Architecture:** Un objeto `state` central, mutado únicamente via `setState(patch)` que siempre llama `render()`. Init es la única excepción (mutación directa + un solo render). DOM siempre derivado del state. El strip de fondos y la lista de favoritos solo se reconstruyen cuando cambian sus datos — no en cada keypress.

**Tech Stack:** Vanilla JS ES2020+, CSS custom properties, html2canvas CDN, "Some Time Later" font CDN, localStorage.

**Spec:** `docs/superpowers/specs/2026-05-24-v2-design.md`

**CDN links (copiar tal cual):**
- Font: `https://fonts.cdnfonts.com/css/some-time-later`
- html2canvas: `https://html2canvas.hertzen.com/dist/html2canvas.min.js`

---

## File Map

| File | Responsabilidad |
|------|----------------|
| `index.html` | Markup only — estructura, IDs, links a CSS y JS |
| `style.css` | Todo el CSS — custom properties, layout, card, strip, panel, modals, toasts |
| `app.js` | Todo el JS — Data, Utils, State, Render, Events, Init |
| `tests/test-utils.html` | Test harness de browser para funciones puras |

---

## Task 0: Crear rama de trabajo

**Files:** ninguno

- [ ] **Step 0.1: Crear y cambiar a rama feat/v2-rewrite**

```bash
git checkout -b feat/v2-rewrite
git status
```

Esperado: `On branch feat/v2-rewrite`, working tree clean.

---

## Task 1: HTML skeleton + style.css

**Files:**
- Create: `index.html`
- Create: `style.css`

- [ ] **Step 1.1: Crear index.html**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pineapple Time Generator</title>
  <link href="https://fonts.cdnfonts.com/css/some-time-later" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
</head>
<body>

  <header>
    <h1 class="app-title">Pineapple Time Generator</h1>
  </header>

  <main>

    <!-- Card preview -->
    <div id="cardContainer">
      <div id="timeCard">
        <!-- .text-wrapper injected by render() -->
      </div>
      <div id="downloadOverlay" class="download-overlay" hidden>
        <div class="spinner"></div>
        <span>Generando...</span>
      </div>
    </div>

    <!-- Background strip -->
    <div id="bgStrip">
      <!-- thumbnails injected by renderStrip() -->
      <input type="file" id="bgUploadInput" accept="image/*" hidden>
      <button id="btnBgUpload" class="btn-bg-upload" aria-label="Subir fondo">+</button>
    </div>

    <!-- Text row -->
    <div id="textRow">
      <textarea id="textInput" rows="1" placeholder="Escribe tu texto..."></textarea>
      <button id="btnRandom" title="Frase aleatoria">↺</button>
      <button id="btnDownload" title="Descargar PNG">↓</button>
    </div>

    <!-- Advanced panel -->
    <div id="advancedSection">
      <button id="btnToggleAdvanced" class="btn-toggle-advanced">▼ Personalizar</button>
      <div id="advancedPanel" hidden>

        <div class="panel-section" id="sectionColors">
          <span class="panel-label">Colores</span>
          <label class="color-label">Texto <input type="color" id="colorText" value="#3e1600"></label>
          <label class="color-label">Sombra <input type="color" id="colorShadow" value="#ffeb99"></label>
          <button id="btnRandomColors" class="btn-random-colors">Colores aleatorios</button>
        </div>

        <div class="panel-section" id="sectionSize">
          <span class="panel-label">Tamaño de texto</span>
          <button id="btnFontMinus" class="btn-font-step">−</button>
          <span id="fontSizeDisplay">3.0em</span>
          <button id="btnFontPlus"  class="btn-font-step">+</button>
          <input type="range" id="sliderFontSize" min="0.5" max="8" step="0.1" value="3">
        </div>

        <div class="panel-section" id="sectionPosition">
          <span class="panel-label">Posición</span>
          <label class="slider-label">X <input type="range" id="sliderX" min="5" max="95" value="50"></label>
          <label class="slider-label">Y <input type="range" id="sliderY" min="5" max="95" value="50"></label>
          <div class="align-buttons">
            <button id="btnAlignLeft"   class="btn-align" data-align="left">L</button>
            <button id="btnAlignCenter" class="btn-align" data-align="center">C</button>
            <button id="btnAlignRight"  class="btn-align" data-align="right">R</button>
          </div>
          <button id="btnResetPosition" class="btn-reset">Reset</button>
        </div>

        <div class="panel-section" id="sectionRatio">
          <span class="panel-label">Formato</span>
          <button id="btnRatio" class="btn-ratio">16:9 → 4:3</button>
        </div>

        <div class="panel-section" id="favoritesSection">
          <span class="panel-label">Favoritos</span>
          <div class="fav-save-row">
            <input type="text" id="favNameInput" placeholder="Nombre del favorito">
            <button id="btnSaveFavorite" class="btn-save-fav">Guardar</button>
          </div>
          <span id="favNameError" class="fav-error" hidden>Escribe un nombre</span>
          <div id="favoritesList"></div>
          <div class="fav-io-row">
            <button id="btnExportFavorites" class="btn-export-fav">Exportar JSON</button>
            <button id="btnImportFavorites" class="btn-import-fav">Importar JSON</button>
            <input type="file" id="importFileInput" accept=".json" hidden>
          </div>
        </div>

      </div><!-- /advancedPanel -->
    </div><!-- /advancedSection -->

  </main>

  <!-- Import modal -->
  <div id="importModal" hidden>
    <div class="modal-overlay" id="importOverlay"></div>
    <div class="modal-box">
      <h2>Importar favoritos</h2>
      <p id="importSummary"></p>
      <div class="modal-buttons">
        <button id="btnImportMerge"   class="btn-merge">Combinar</button>
        <button id="btnImportReplace" class="btn-replace">Reemplazar</button>
        <button id="btnImportCancel"  class="btn-cancel-modal">Cancelar</button>
      </div>
    </div>
  </div>

  <!-- Toast container -->
  <div id="toastContainer"></div>

  <script src="https://html2canvas.hertzen.com/dist/html2canvas.min.js"></script>
  <script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 1.2: Crear style.css**

```css
/* ============================================================
   Custom Properties
   ============================================================ */
:root {
  --sponge-yellow:   #FFD800;
  --sponge-blue:     #0070BB;
  --ocean-dark:      #0a1626;
  --ocean-mid:       #1E2F45;
  --ocean-light:     #2d436c;
  --patrick-pink:    #FF5252;
  --seaweed-green:   #8BC34A;
  --jellyfish-purple:#9C27B0;
  --sand-orange:     #e67e22;
  --radius:          4px;
}

/* ============================================================
   Base
   ============================================================ */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background-color: var(--ocean-dark);
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  min-height: 100vh;
}

button {
  border: none;
  border-radius: var(--radius);
  padding: 0.4rem 0.8rem;
  cursor: pointer;
  font-size: 0.9rem;
  color: white;
}

input[type="text"], input[type="range"], textarea {
  border-radius: var(--radius);
  border: 1px solid var(--ocean-light);
  background: var(--ocean-mid);
  color: white;
  font-size: 0.9rem;
  padding: 0.4rem 0.6rem;
}

input[type="text"]::placeholder,
textarea::placeholder { color: #667; }

/* ============================================================
   Header
   ============================================================ */
header {
  text-align: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--ocean-light);
}

.app-title {
  font-family: 'Some Time Later', sans-serif;
  font-size: 1.6rem;
  color: var(--sponge-yellow);
  text-shadow: 2px 2px 0 var(--sponge-blue);
}

/* ============================================================
   Main layout
   ============================================================ */
main {
  max-width: 960px;
  margin: 0 auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* ============================================================
   Card
   ============================================================ */
#cardContainer {
  position: relative;
  width: 100%;
}

#timeCard {
  position: relative;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  aspect-ratio: 16 / 9;
  font-size: 16px;                    /* em base for text-wrapper */
  font-family: 'Some Time Later', sans-serif;
  background: #000 center / cover no-repeat;
  overflow: hidden;
  cursor: grab;
  box-shadow: 0 5px 15px rgba(0,0,0,0.7);
  border-radius: var(--radius);
}

#timeCard:active { cursor: grabbing; }

#timeCard.ratio-4-3 { aspect-ratio: 4 / 3; }

.text-wrapper {
  position: absolute;
  width: 90%;
  transform: translate(-50%, -50%);
  white-space: pre-wrap;
  overflow-wrap: break-word;
  /* left, top, font-size, text-align set by renderCard() */
}

/* Download overlay — positioned on cardContainer, not timeCard.
   html2canvas captures timeCard only, so overlay never appears in export. */
.download-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 112, 187, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  font-size: 1.1rem;
  color: white;
}

.spinner {
  width: 22px;
  height: 22px;
  border: 3px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ============================================================
   Background strip
   ============================================================ */
#bgStrip {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  overflow-x: auto;
  padding: 0.4rem 0;
  scrollbar-width: thin;
  scrollbar-color: var(--ocean-light) transparent;
}

.thumbnail-wrapper {
  position: relative;
  flex-shrink: 0;
}

.thumbnail {
  width: 64px;
  height: 40px;
  background: #333 center / cover no-repeat;
  border-radius: var(--radius);
  border: 2px solid #444;
  cursor: pointer;
  display: block;
}

.thumbnail:hover  { border-color: var(--sponge-yellow); }
.thumbnail.active { border-color: var(--sponge-blue); box-shadow: 0 0 6px rgba(0,112,187,0.6); }

.btn-remove-bg {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 17px;
  height: 17px;
  border-radius: 50%;
  background: var(--patrick-pink);
  color: white;
  font-size: 9px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.strip-separator {
  flex-shrink: 0;
  width: 1px;
  height: 32px;
  background: var(--ocean-light);
}

.btn-bg-upload {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  background: var(--ocean-mid);
  border: 2px dashed var(--ocean-light);
  color: var(--sponge-yellow);
  font-size: 1.3rem;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ============================================================
   Text row
   ============================================================ */
#textRow {
  display: flex;
  gap: 0.4rem;
  align-items: center;
}

#textInput {
  flex: 1;
  height: 2.4rem;
  resize: none;
  overflow: hidden;
  line-height: 1.4;
}

#btnRandom   { background: var(--patrick-pink);     flex-shrink: 0; font-size: 1.1rem; }
#btnDownload { background: var(--jellyfish-purple); flex-shrink: 0; font-size: 1.1rem; }

#btnDownload:disabled { opacity: 0.5; cursor: not-allowed; }

/* ============================================================
   Advanced panel
   ============================================================ */
#advancedSection { border-top: 1px solid var(--ocean-light); }

.btn-toggle-advanced {
  width: 100%;
  text-align: left;
  background: transparent;
  color: var(--sponge-yellow);
  padding: 0.65rem 0;
  font-size: 0.95rem;
}

#advancedPanel {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding-bottom: 0.5rem;
}

/* [hidden] attribute takes precedence — no extra CSS needed */

.panel-section {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  padding: 0.6rem;
  background: rgba(255,255,255,0.03);
  border-radius: var(--radius);
}

.panel-label {
  font-size: 0.75rem;
  color: #89a;
  width: 100%;
  margin-bottom: 0.1rem;
}

/* Colors section */
.color-label {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.85rem;
}

input[type="color"] {
  width: 34px;
  height: 34px;
  padding: 2px;
  border: none;
  background: transparent;
  cursor: pointer;
}

.btn-random-colors {
  background: linear-gradient(135deg, var(--patrick-pink), var(--sponge-blue), var(--seaweed-green));
}

/* Size section */
.btn-font-step {
  background: var(--ocean-mid);
  border: 1px solid var(--ocean-light);
  width: 32px;
  height: 32px;
  padding: 0;
  font-size: 1.1rem;
}

#fontSizeDisplay {
  font-size: 0.85rem;
  min-width: 3rem;
  text-align: center;
  color: var(--sponge-yellow);
}

#sliderFontSize { flex: 1; min-width: 80px; }

/* Position section */
.slider-label {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.85rem;
  flex: 1;
  min-width: 120px;
}

.slider-label input[type="range"] { flex: 1; border: none; }

.align-buttons { display: flex; gap: 0.25rem; }

.btn-align {
  background: var(--ocean-mid);
  border: 1px solid var(--ocean-light);
  width: 32px;
  height: 32px;
  padding: 0;
}

.btn-align.active { background: var(--sponge-blue); border-color: var(--sponge-blue); }

.btn-reset { background: var(--ocean-mid); border: 1px solid var(--ocean-light); font-size: 0.8rem; }

/* Ratio section */
.btn-ratio { background: var(--sand-orange); }

/* Favorites section */
#favoritesSection { flex-direction: column; align-items: stretch; }

.fav-save-row { display: flex; gap: 0.4rem; }
.fav-save-row input { flex: 1; }

/* Error state for name input */
#favNameInput.error { border-color: var(--patrick-pink); }

.fav-error { font-size: 0.8rem; color: var(--patrick-pink); }

.btn-save-fav { background: var(--seaweed-green); flex-shrink: 0; }

#favoritesList {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-height: 200px;
  overflow-y: auto;
}

.fav-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.5rem;
  background: rgba(255,255,255,0.04);
  border-radius: var(--radius);
}

.fav-name {
  flex: 1;
  font-size: 0.85rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fav-actions { display: flex; gap: 0.25rem; flex-shrink: 0; }

.btn-load-fav   { background: var(--sponge-blue);   padding: 0.2rem 0.5rem; font-size: 0.78rem; }
.btn-delete-fav { background: var(--patrick-pink);  padding: 0.2rem 0.5rem; font-size: 0.78rem; }

.fav-empty { font-size: 0.85rem; color: #667; font-style: italic; }

.fav-io-row { display: flex; gap: 0.4rem; }
.btn-export-fav { background: var(--ocean-light); flex: 1; }
.btn-import-fav { background: var(--ocean-mid); border: 1px solid var(--ocean-light); flex: 1; }

/* ============================================================
   Import Modal
   ============================================================ */
#importModal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(10, 22, 38, 0.88);
}

.modal-box {
  position: relative;
  background: var(--ocean-mid);
  border-radius: 8px;
  padding: 1.5rem;
  max-width: 380px;
  width: 90%;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
}

.modal-box h2  { color: var(--sponge-yellow); margin-bottom: 0.6rem; font-size: 1.1rem; }
.modal-box p   { color: #cde; margin-bottom: 1rem; font-size: 0.9rem; }

.modal-buttons { display: flex; gap: 0.5rem; justify-content: flex-end; flex-wrap: wrap; }

.btn-merge        { background: var(--sponge-blue); }
.btn-replace      { background: var(--patrick-pink); }
.btn-cancel-modal { background: var(--ocean-light); }

/* ============================================================
   Toasts
   ============================================================ */
#toastContainer {
  position: fixed;
  bottom: 1.25rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column-reverse;
  gap: 0.4rem;
  z-index: 2000;
  pointer-events: none;
  min-width: 220px;
  max-width: 90vw;
}

.toast {
  background: var(--seaweed-green);
  color: white;
  padding: 0.55rem 0.9rem;
  border-radius: var(--radius);
  box-shadow: 0 2px 10px rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  pointer-events: auto;
  font-size: 0.88rem;
  animation: toast-in 0.18s ease;
}

.toast.error { background: var(--patrick-pink); }
.toast.undo  { background: var(--ocean-light); border: 1px solid var(--sponge-blue); }

@keyframes toast-in {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0);   }
}

.toast-msg  { flex: 1; }

.toast-undo-btn {
  background: none;
  border: 1px solid rgba(255,255,255,0.5);
  color: white;
  padding: 0.15rem 0.45rem;
  font-size: 0.78rem;
  cursor: pointer;
  border-radius: 3px;
  flex-shrink: 0;
}

/* ============================================================
   Responsive
   ============================================================ */
@media (max-width: 600px) {
  main { padding: 0.5rem; gap: 0.5rem; }
  .app-title { font-size: 1.1rem; }
  .thumbnail { width: 52px; height: 32px; }
}
```

- [ ] **Step 1.3: Verificar layout en browser**

Abrir `index.html` directamente en Chrome. Verificar:
- Header con título visible
- Área del card (negro, ratio 16:9)
- Strip de fondos vacío con botón +
- Fila de texto (textarea + dos botones)
- Botón "▼ Personalizar" visible
- Sin errores en consola

- [ ] **Step 1.4: Commit**

```bash
git add index.html style.css
git commit -m "feat: add v2 html skeleton and stylesheet"
```

---

## Task 2: app.js — Data + Utils + test harness

**Files:**
- Create: `app.js`
- Create: `tests/test-utils.html`

- [ ] **Step 2.1: Crear app.js con la sección Data**

```js
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
```

- [ ] **Step 2.2: Añadir sección Utils**

Append al mismo `app.js`:

```js
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
```

- [ ] **Step 2.3: Crear tests/test-utils.html**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Utils Tests</title>
  <style>
    body { font-family: monospace; padding: 1rem; background: #111; color: #eee; }
    .pass { color: #8BC34A; }
    .fail { color: #FF5252; font-weight: bold; }
    #summary { margin-top: 1rem; font-size: 1.1rem; }
  </style>
</head>
<body>
<h1>Utils Tests</h1>
<div id="output"></div>
<div id="summary"></div>
<script>
// Inline copies of the functions under test (keep in sync with app.js Utils)
const DARK_PALETTE  = ['#3e1600', '#1a0a00', '#0d1b2a', '#1b2a1b', '#2a0a2a'];
const LIGHT_PALETTE = ['#ffeb99', '#ffe566', '#fff4cc', '#ffd700', '#fff8e1'];

function clamp(val, min, max) { return Math.min(Math.max(val, min), max); }
function roundOneDecimal(val) { return Math.round(val * 10) / 10; }
function colorBrightness(hex) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return 0.299*r + 0.587*g + 0.114*b;
}
function generateDarkColor()  { return DARK_PALETTE[Math.floor(Math.random()*DARK_PALETTE.length)]; }
function generateLightColor() { return LIGHT_PALETTE[Math.floor(Math.random()*LIGHT_PALETTE.length)]; }

// Harness
let passed = 0, failed = 0;
const out = document.getElementById('output');
function assert(desc, condition) {
  const div = document.createElement('div');
  if (condition) { passed++; div.className='pass'; div.textContent=`✓ ${desc}`; }
  else           { failed++; div.className='fail'; div.textContent=`✗ ${desc}`; }
  out.appendChild(div);
}

// clamp
assert('clamp(5, 0, 10) = 5',   clamp(5,  0, 10) === 5);
assert('clamp(-1, 0, 10) = 0',  clamp(-1, 0, 10) === 0);
assert('clamp(11, 0, 10) = 10', clamp(11, 0, 10) === 10);
assert('clamp(5, 5, 95) = 5',   clamp(5,  5, 95) === 5);
assert('clamp(4, 5, 95) = 5',   clamp(4,  5, 95) === 5);

// roundOneDecimal
assert('round(3.00) = 3',    roundOneDecimal(3.00) === 3);
assert('round(7.95) → 8.0',  roundOneDecimal(7.95) === Math.round(7.95*10)/10);
assert('round(0.55) → 0.6',  roundOneDecimal(0.55) === Math.round(0.55*10)/10);

// colorBrightness
assert('white = 255',               Math.round(colorBrightness('#ffffff')) === 255);
assert('black = 0',                 Math.round(colorBrightness('#000000')) === 0);
assert('yellow (#FFD800) > 128',    colorBrightness('#FFD800') > 128);
assert('#3e1600 < 128',             colorBrightness('#3e1600') < 128);

// generateDarkColor — always returns from DARK_PALETTE
for (let i = 0; i < 20; i++) {
  assert(`generateDarkColor() #${i} in DARK_PALETTE`, DARK_PALETTE.includes(generateDarkColor()));
}
// generateLightColor — always returns from LIGHT_PALETTE
for (let i = 0; i < 20; i++) {
  assert(`generateLightColor() #${i} in LIGHT_PALETTE`, LIGHT_PALETTE.includes(generateLightColor()));
}

document.getElementById('summary').textContent = `${passed} passed, ${failed} failed`;
</script>
</body>
</html>
```

- [ ] **Step 2.4: Abrir tests/test-utils.html en browser**

Verificar: todos los asserts pasan (✓ verde). Si alguno falla, corregir antes de continuar.

- [ ] **Step 2.5: Commit**

```bash
git add app.js tests/test-utils.html
git commit -m "feat: add Data, Utils sections and test harness"
```

---

## Task 3: app.js — State + allBackgrounds

**Files:**
- Modify: `app.js`

- [ ] **Step 3.1: Añadir sección State a app.js**

Append al final de `app.js`:

```js
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
```

- [ ] **Step 3.2: Verificar en consola de browser**

Abrir `index.html`. En consola:

```js
console.assert(state.positionX === 50, 'positionX default');
console.assert(state.ratio === '16:9', 'ratio default');
console.assert(allBackgrounds().length === 15, 'allBackgrounds has 15 presets');
console.assert(allBackgrounds()[0].label === 'Band Geeks', 'first preset label');
console.log('State OK');
```

Esperado: `State OK` sin assertion errors.

- [ ] **Step 3.3: Commit**

```bash
git add app.js
git commit -m "feat: add State, setState, allBackgrounds, localStorage helpers"
```

---

## Task 4: app.js — Render

**Files:**
- Modify: `app.js`

- [ ] **Step 4.1: Añadir renderCard()**

Append a `app.js`:

```js
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
```

- [ ] **Step 4.2: Añadir renderStrip() con dirty-check**

Append a `app.js`:

```js
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
```

- [ ] **Step 4.3: Añadir renderFavoritesList() con dirty-check y renderControls()**

Append a `app.js`:

```js
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
```

- [ ] **Step 4.4: Añadir render() dispatcher**

Append a `app.js`:

```js
function render() {
  renderCard();
  renderStrip();
  renderControls();
}
```

- [ ] **Step 4.5: Verificar render en consola**

Abrir `index.html`. En consola, asignar DOM refs manualmente y llamar render:

```js
_card     = document.getElementById('timeCard');
_strip    = document.getElementById('bgStrip');
_overlay  = document.getElementById('downloadOverlay');
_textarea = document.getElementById('textInput');

state.text = 'Three Days Later';
state.backgroundIndex = 2;  // Frankendoodle
render();
```

Esperado: card muestra el fondo de Frankendoodle con el texto "Three Days Later" centrado.

- [ ] **Step 4.6: Commit**

```bash
git add app.js
git commit -m "feat: add render functions (renderCard, renderStrip, renderControls)"
```

---

## Task 5: app.js — Color system

**Files:**
- Modify: `app.js`

- [ ] **Step 5.1: Añadir autoAdjustColors con cache y race guard**

Append a `app.js`:

```js
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
```

- [ ] **Step 5.2: Verificar color system en browser**

En consola (con DOM refs asignados del paso 4.5):

```js
autoAdjustColors('backgrounds/band-geeks.jpg').then(() => {
  const inLight = ['#ffeb99','#ffe566','#fff4cc','#ffd700','#fff8e1'];
  const inDark  = ['#3e1600','#1a0a00','#0d1b2a','#1b2a1b','#2a0a2a'];
  console.assert(inLight.includes(state.textColor) || inDark.includes(state.textColor),
    'textColor in palette');
  console.log('Colors OK — textColor:', state.textColor, 'shadowColor:', state.shadowColor);
});
```

Esperado: colores en paleta, card actualizado.

- [ ] **Step 5.3: Commit**

```bash
git add app.js
git commit -m "feat: add color system (autoAdjustColors, cache, race guard, curated palettes)"
```

---

## Task 6: app.js — Init + localStorage persistence

**Files:**
- Modify: `app.js`

- [ ] **Step 6.1: Añadir función init()**

Append a `app.js`.

> **Nota:** init() no llama `wireEvents()` todavía — esa función no existe hasta Task 9. Se añade el placeholder de llamada en Task 9.

```js
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

  // wireEvents() — added in Task 9
}

function _randomPhrase(current) {
  const pool = phrases.filter(p => p !== current);
  return pool[Math.floor(Math.random() * pool.length)];
}

document.addEventListener('DOMContentLoaded', init);
```

- [ ] **Step 6.2: Añadir funciones de persistencia**

Append a `app.js`:

```js
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
```

- [ ] **Step 6.3: Verificar init en browser**

Recargar `index.html`. Verificar:
- Card muestra un fondo aleatorio
- Card muestra un texto aleatorio de la lista de frases
- No hay errores en consola (aunque no haya interactividad aún — wireEvents no existe)
- Recargar varias veces → fondo y frase cambian aleatoriamente

- [ ] **Step 6.4: Commit**

```bash
git add app.js
git commit -m "feat: add init (batch Object.assign), localStorage persistence helpers"
```

---

## Task 7: app.js — Mouse drag

**Files:**
- Modify: `app.js`

- [ ] **Step 7.1: Añadir initMouseDrag()**

Append a `app.js`:

```js
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
```

- [ ] **Step 7.2: Llamar initMouseDrag() desde init() temporalmente**

Editar `init()` — añadir `initMouseDrag()` justo antes del comentario `// wireEvents() — added in Task 9`:

```js
  // Drag (temporary — moved inside wireEvents() in Task 9)
  initMouseDrag();

  // wireEvents() — added in Task 9
```

- [ ] **Step 7.3: Verificar drag en browser**

Recargar. Arrastrar el texto con el ratón. Verificar:
- El texto sigue al ratón
- Al soltar queda en la nueva posición
- No se selecciona texto del documento durante el drag
- El texto no sale del card

- [ ] **Step 7.4: Commit**

```bash
git add app.js
git commit -m "feat: add mouse drag for text positioning"
```

---

## Task 8: app.js — Touch drag

**Files:**
- Modify: `app.js`

- [ ] **Step 8.1: Añadir initTouchDrag()**

Append a `app.js`:

```js
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
```

- [ ] **Step 8.2: Llamar initTouchDrag() desde init() temporalmente**

Editar `init()` — añadir `initTouchDrag()` junto a `initMouseDrag()`:

```js
  initMouseDrag();
  initTouchDrag();

  // wireEvents() — added in Task 9
```

- [ ] **Step 8.3: Verificar en DevTools touch mode**

Chrome DevTools → Toggle device toolbar (Ctrl+Shift+M). Arrastrar el texto. Verificar:
- El texto sigue el dedo
- La página NO scrollea durante el drag en el card
- El texto queda en la posición al levantar

- [ ] **Step 8.4: Commit**

```bash
git add app.js
git commit -m "feat: add touch drag (passive:false, single-finger)"
```

---

## Task 9: app.js — wireEvents() + Advanced panel

**Files:**
- Modify: `app.js`

- [ ] **Step 9.1: Añadir wireEvents()**

Append a `app.js`. wireEvents() llama a initMouseDrag/initTouchDrag internamente, por lo que las llamadas temporales en init() se eliminarán en el paso siguiente.

```js
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
```

- [ ] **Step 9.2: Actualizar init() — reemplazar llamadas directas por wireEvents()**

En `init()`, reemplazar:

```js
  // Drag (temporary — moved inside wireEvents() in Task 9)
  initMouseDrag();
  initTouchDrag();

  // wireEvents() — added in Task 9
```

por:

```js
  wireEvents();
```

La función `init()` completa debe quedar así:

```js
function init() {
  _card     = document.getElementById('timeCard');
  _strip    = document.getElementById('bgStrip');
  _overlay  = document.getElementById('downloadOverlay');
  _textarea = document.getElementById('textInput');

  const savedUI     = loadFromLS(LS_UI, {});
  const savedCustom = loadFromLS(LS_CUSTOM_BGS, []);
  favorites         = loadFromLS(LS_FAVORITES, []);

  const customBackgrounds = Array.isArray(savedCustom) ? savedCustom : [];
  const advancedOpen      = savedUI.advancedOpen ?? false;
  const text              = _randomPhrase('');
  const totalBgs          = customBackgrounds.length + backgroundPresets.length;
  const backgroundIndex   = Math.floor(Math.random() * totalBgs);

  Object.assign(state, { customBackgrounds, advancedOpen, text, backgroundIndex });
  render();

  const currentBg = allBackgrounds()[state.backgroundIndex];
  if (currentBg) autoAdjustColors(currentBg.url);

  wireEvents();
}
```

- [ ] **Step 9.3: Verificar panel y controles en browser**

Recargar. Verificar:
- "▼ Personalizar" abre y cierra el panel
- Escape cierra el panel; Escape también cierra el import modal cuando está abierto
- Ctrl+S abre el panel y foca el input de nombre
- Sliders de posición mueven el texto
- Botones L/C/R cambian la alineación (visible en texto de dos líneas — pulsar Enter en el textarea)
- Reset vuelve al centro
- Slider de font size y +/− funcionan sin float drift
- 16:9/4:3 toggle cambia el aspect ratio
- Color pickers actualizan el texto en tiempo real

- [ ] **Step 9.4: Commit**

```bash
git add app.js
git commit -m "feat: wire all events, keyboard shortcuts (single keydown listener)"
```

---

## Task 10: app.js — Custom background upload/remove

**Files:**
- Modify: `app.js`

- [ ] **Step 10.1: Añadir uploadCustomBg() y removeCustomBg()**

Append a `app.js`:

```js
// =============================================================
// --- Custom Backgrounds ---
// =============================================================

function uploadCustomBg(file) {
  const reader = new FileReader();
  reader.onload = e => {
    const dataUrl = e.target.result;

    if (state.customBackgrounds.length >= MAX_CUSTOM_BGS) {
      state.customBackgrounds.pop(); // evict oldest
      toast('Fondo más antiguo eliminado para hacer espacio');
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
```

- [ ] **Step 10.2: Verificar upload/remove en browser**

Recargar. Verificar:
- Click en `+` abre el selector de archivo
- Al seleccionar: aparece como primer thumbnail, se autoselecciona, el card la muestra
- ✕ en thumbnail custom elimina el fondo correctamente
- Si el fondo eliminado era el activo, el card cambia al siguiente disponible
- Subir 5 imágenes: la 6ª elimina la más antigua con toast
- Recargar: los fondos custom persisten

- [ ] **Step 10.3: Commit**

```bash
git add app.js
git commit -m "feat: add custom background upload, remove, persistence (max 5)"
```

---

## Task 11: app.js — Favorites CRUD

**Files:**
- Modify: `app.js`

- [ ] **Step 11.1: Añadir saveFavorite(), loadFavorite(), deleteFavorite()**

Append a `app.js`:

```js
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
  toast(`"${name}" guardado`);
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
        toast('Fondo más antiguo eliminado para hacer espacio');
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
  toast(`"${removed.name}" eliminado`, {
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
```

- [ ] **Step 11.2: Verificar favorites CRUD en browser**

Recargar. Verificar:
- Guardar sin nombre: mensaje "Escribe un nombre" + borde rojo en el input
- Guardar con nombre: aparece en lista (más reciente arriba)
- Cargar un favorito: restaura todo el state (fondo, colores, posición, ratio, texto)
- Eliminar: desaparece, toast con "Deshacer"
- Deshacer: reaparece en su posición original
- Recargar: favoritos persisten

- [ ] **Step 11.3: Commit**

```bash
git add app.js
git commit -m "feat: add favorites save/load/delete with undo"
```

---

## Task 12: app.js — Favorites export/import

**Files:**
- Modify: `app.js`

- [ ] **Step 12.1: Añadir exportFavorites(), readImportFile(), cancelImport(), confirmImport()**

Append a `app.js`:

```js
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
    catch (_) { toast('Archivo no válido', { type: 'error' }); return; }

    if (!parsed || !Array.isArray(parsed.favorites)) {
      toast('Formato no reconocido', { type: 'error' }); return;
    }

    const required = ['id','name','text','backgroundUrl','fontSize',
                      'textColor','shadowColor','positionX','positionY','textAlign','ratio'];
    const valid   = parsed.favorites.filter(f => required.every(k => k in f));
    const skipped = parsed.favorites.length - valid.length;

    if (valid.length === 0) {
      toast('No se encontraron favoritos válidos', { type: 'error' }); return;
    }

    _pendingImport = { valid, skipped };
    document.getElementById('importSummary').textContent = skipped > 0
      ? `${valid.length} válido(s), ${skipped} omitido(s)`
      : `${valid.length} favorito(s) para importar`;
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
      ? `${toAdd.length} importado(s), ${dupesSkipped} omitido(s)`
      : `${toAdd.length} favorito(s) importado(s)`);
    return;
  }

  // replace path
  persistFavorites();
  _favPrev.count = -1;
  renderFavoritesList();
  toast(skipped > 0
    ? `${valid.length} importado(s), ${skipped} omitido(s)`
    : `${valid.length} favorito(s) importado(s)`);
}
```

- [ ] **Step 12.2: Verificar export/import en browser**

Recargar. Verificar:
- Guardar 2-3 favoritos → Exportar → descarga `pineapple-favorites.json`
- Abrir el JSON: estructura `{ "version": 2, "favorites": [...] }`
- Importar el mismo archivo → modal con resumen
- Cerrar overlay, Escape o Cancelar → modal desaparece sin importar nada
- Combinar → favoritos añadidos, duplicados ignorados
- Reemplazar → lista sustituida completamente
- Importar JSON malformado → toast "Archivo no válido"
- Importar JSON válido sin campo `favorites` → toast "Formato no reconocido"

- [ ] **Step 12.3: Commit**

```bash
git add app.js
git commit -m "feat: add favorites export/import (versioned JSON, merge/replace, dedup)"
```

---

## Task 13: app.js — Export PNG

**Files:**
- Modify: `app.js`

- [ ] **Step 13.1: Añadir exportPNG()**

Append a `app.js`:

```js
// =============================================================
// --- Export PNG ---
// =============================================================

function exportPNG() {
  const btn = document.getElementById('btnDownload');
  btn.disabled     = true;
  _overlay.hidden  = false;

  const filename = `pineapple-time-card-${state.ratio.replace(':', '-')}.png`;

  html2canvas(_card, {
    scale:      2,
    useCORS:    true,
    allowTaint: false,
    // downloadOverlay is outside _card (sibling of timeCard inside cardContainer),
    // so it never appears in the capture. onclone is kept as safety net.
    onclone: cloned => {
      const ov = cloned.getElementById('downloadOverlay');
      if (ov) ov.remove();
    },
  }).then(canvas => {
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href = url; a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }).catch(err => {
    console.error('Export failed:', err);
    toast('Error al exportar', { type: 'error' });
  }).finally(() => {
    btn.disabled    = false;
    _overlay.hidden = true;
  });
}
```

- [ ] **Step 13.2: Verificar export desde servidor local**

Nota: desde `file://` los fondos predefinidos pueden aparecer en blanco. Servir con un servidor local:

```bash
# Windows (cualquiera de estas):
py -m http.server 8080
python -m http.server 8080
# Abrir: http://localhost:8080
```

Verificar:
- Click en ↓ → overlay "Generando..." aparece, botón deshabilitado
- Descarga `pineapple-time-card-16-9.png`
- PNG sin UI chrome — solo card con fondo y texto
- PNG resolución 2x del card (card 900px → PNG ≈1800px ancho)
- Con fondo custom (base64): export funciona también desde `file://`

- [ ] **Step 13.3: Commit**

```bash
git add app.js
git commit -m "feat: add PNG export (html2canvas scale:2, toBlob non-blocking)"
```

---

## Task 14: Verificación end-to-end + limpieza

**Files:**
- Modify: `CLAUDE.md` (actualizar testing checklist a v2)

- [ ] **Step 14.1: Ejecutar el testing checklist completo**

Servir desde `py -m http.server 8080`. Abrir `http://localhost:8080`.

**Init:**
- [ ] Carga con frase aleatoria en el textarea
- [ ] Carga con fondo aleatorio activo y thumbnail activo visible en strip
- [ ] Colores se actualizan al resolverse `autoAdjustColors` (flash inicial aceptable)
- [ ] Recargar varias veces: fondo y frase cambian

**Text & Drag:**
- [ ] Escribir en textarea → texto se actualiza en card en tiempo real
- [ ] El cursor del textarea NO salta al final mientras se escribe
- [ ] Texto multilinea (Enter en textarea): se preservan saltos en el card
- [ ] Arrastrar texto con ratón: no sale del card
- [ ] No se selecciona texto del documento al arrastrar
- [ ] Arrastrar con touch (DevTools): la página no scrollea durante el drag
- [ ] Sliders X/Y mueven el texto
- [ ] Reset → texto vuelve a 50/50/center

**Fondos:**
- [ ] Clicar thumbnails: cambia fondo y actualiza colores
- [ ] Thumbnail activo siempre visible tras cambio (scroll automático)
- [ ] Subir imagen custom: primer thumbnail, se autoselecciona
- [ ] Subir 5 imágenes: la 6ª elimina la más antigua con toast
- [ ] ✕ en thumbnail custom: elimina correctamente, reindexación correcta
- [ ] Recargar: fondos custom persisten

**Advanced panel:**
- [ ] ▼ abre/cierra el panel; estado persiste al recargar
- [ ] Escape cierra el panel
- [ ] Escape cierra el import modal si está abierto (panel no se cierra)
- [ ] Ctrl+S abre el panel y foca el nombre de favorito
- [ ] Colores aleatorios: coherentes con el fondo (paleta curada)
- [ ] +/− font size: sin float drift (siempre un decimal)
- [ ] Align L/C/R: visible en texto de múltiples líneas
- [ ] 16:9 ↔ 4:3 toggle: cambia el aspect ratio

**Favoritos:**
- [ ] Guardar sin nombre: mensaje "Escribe un nombre" + borde rojo en input
- [ ] Guardar con nombre: aparece arriba de la lista
- [ ] Cargar: restaura todo el state incluyendo fondo
- [ ] Eliminar: toast con Deshacer 5s; Deshacer restaura en posición original
- [ ] Exportar: JSON con `{ "version": 2, "favorites": [...] }`
- [ ] Importar y combinar: no crea duplicados
- [ ] Importar y reemplazar: sustituye la lista completa
- [ ] Cancelar import (overlay / Escape / botón): no importa nada

**Export PNG:**
- [ ] PNG sin UI chrome
- [ ] PNG resolución ~2x del card
- [ ] Fondo, texto, colores y posición exportados correctamente

**Persistencia:**
- [ ] Recargar: `advancedOpen` se restaura
- [ ] Recargar: fondos custom persisten
- [ ] Recargar: favoritos persisten

- [ ] **Step 14.2: Actualizar CLAUDE.md**

En `CLAUDE.md`, reemplazar la sección "Testing Checklist" por el checklist del paso anterior (ya verificado).

- [ ] **Step 14.3: Commit final**

```bash
git add app.js CLAUDE.md
git commit -m "feat: v2 complete — state-driven rewrite with all v1 bugs fixed"
```

---

## Self-Review

**Spec coverage:**

| Sección spec | Cubierto en |
|---|---|
| Arquitectura 3 archivos | Task 1 |
| Estado único + setState | Task 3 |
| allBackgrounds() | Task 3 |
| backgroundPresets con label | Task 2 |
| renderCard (position, textAlign, shadow, font-size) | Task 4 |
| classList.toggle para ratio (no sobreescribe clases) | Task 4 |
| renderStrip dirty-check + scroll-into-view | Task 4 |
| renderFavoritesList dirty-check | Task 4 |
| renderControls + textarea focus guard | Task 4 |
| autoAdjustColors + race guard + cache | Task 5 |
| Paletas curadas DARK/LIGHT | Task 2 |
| Random Colors button | Task 9 |
| Init batch Object.assign (spec requirement) | Task 6 |
| Init sin llamada a wireEvents hasta Task 9 | Tasks 6-9 |
| localStorage try/catch | Task 3 |
| Persistencia customBgs, advancedOpen, favorites | Task 6 |
| Mouse drag + user-select | Task 7 |
| Touch drag passive:false | Task 8 |
| Drag clamp [5, 95] | Tasks 7-8 |
| Single keydown listener (Escape + Ctrl+S) | Task 9 |
| Escape: modal tiene prioridad sobre panel | Task 9 |
| Font size [0.5, 8] step 0.1 + round | Task 9 |
| overflow-wrap: break-word | Task 1 (style.css) |
| #favNameInput.error CSS | Task 1 (style.css) |
| Custom bg upload max-5 eviction | Task 10 |
| Favorites save/load/delete+undo | Task 11 |
| _favPrev invalidado en save/delete/import | Tasks 11-12 |
| loadFavorite: direct mutation documentada como excepción aceptada | Task 11 |
| Favorites export/import versioned | Task 12 |
| Import deduplicación por id | Task 12 |
| Import schema validation | Task 12 |
| Export PNG toBlob scale:2 | Task 13 |
| file:// limitation + Windows server command | Task 13 |
| Toasts 3s + undo stack | Task 2 (Utils) |
| Separador custom/preset en strip | Task 4 |
| Custom thumbnail aria-label | Task 4 |
| Borrar custom bg con reindexación | Task 10 |
| Init random phrase (excluye actual) | Task 6 |
| `<textarea>` pre-wrap | Task 1 (HTML) |
| SRI hashes | Post-PR (out of plan scope) |
