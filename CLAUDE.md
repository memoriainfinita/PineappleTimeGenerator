# Pineapple Time Generator — CLAUDE.md

## Stack

- `index.html` — markup only
- `style.css` — all CSS (custom properties, layout, card, strip, panel, modals, toasts)
- `app.js` — all JS (Data, Utils, State, Render, Events, Init)
- `tests/test-utils.html` — browser test harness for pure functions
- No build step. Serverless. `file://` compatible.

## Architecture

Single `state` object, mutated only via `setState(patch)` which always calls `render()`.  
Exception: `init()` mutates state directly with `Object.assign` + one `render()`.

DOM is always derived from state. Strip and favorites list use dirty-checks to avoid rebuilding on every keystroke.

## Testing Checklist (v2)

Open `index.html` in Chrome directly.

**Init:**
- [ ] Loads with random phrase in textarea
- [ ] Loads with random background active, active thumbnail visible in strip
- [ ] Colors update when `autoAdjustColors` resolves (initial flash acceptable)
- [ ] Reload several times: background and phrase change

**Text & Drag:**
- [ ] Typing in textarea → text updates in card in real time
- [ ] Textarea cursor does NOT jump to end while typing
- [ ] Multiline text (Enter in textarea): line breaks preserved in card
- [ ] Mouse drag: text stays within card bounds
- [ ] No text selection in document during drag
- [ ] Touch drag (DevTools): page does NOT scroll during drag on card
- [ ] X/Y sliders move text
- [ ] Reset → text returns to 50/50/center

**Backgrounds:**
- [ ] Click thumbnails: changes background and updates colors
- [ ] Active thumbnail always visible after change (auto-scroll)
- [ ] Upload custom image: first thumbnail, auto-selected
- [ ] Upload 5 images: 6th evicts oldest with toast
- [ ] ✕ on custom thumbnail: removes correctly, reindexing correct
- [ ] Reload: custom backgrounds persist

**Advanced panel:**
- [ ] ▼ opens/closes panel; state persists on reload
- [ ] Escape closes panel
- [ ] Escape closes import modal if open (panel stays)
- [ ] Ctrl+S opens panel and focuses favorite name input
- [ ] Random colors: coherent with background (curated palette)
- [ ] +/− font size: no float drift (always one decimal)
- [ ] Align L/C/R: visible on multiline text
- [ ] 16:9 ↔ 4:3 toggle: changes aspect ratio

**Favorites:**
- [ ] Save without name: "Escribe un nombre" + red border on input
- [ ] Save with name: appears at top of list
- [ ] Load: restores full state including background
- [ ] Delete: toast with Undo 5s; Undo restores at original position
- [ ] Export: JSON with `{ "version": 2, "favorites": [...] }`
- [ ] Import + merge: no duplicates created
- [ ] Import + replace: list fully replaced
- [ ] Cancel import (overlay / Escape / button): nothing imported

**Export PNG:**
- [ ] PNG without UI chrome
- [ ] PNG resolution ~2x of card
- [ ] Background, text, colors and position exported correctly

**Persistence:**
- [ ] Reload: `advancedOpen` restored
- [ ] Reload: custom backgrounds persist
- [ ] Reload: favorites persist
