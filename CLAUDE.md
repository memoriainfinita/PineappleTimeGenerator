# Pineapple Time Generator — CLAUDE.md

## Stack

- `index.html` — markup only
- `style.css` — all CSS (custom properties, layout, card, strip, panel, modals, toasts)
- `app.js` — all JS (Data, Utils, State, Render, Events, Init)
- `tests/test-utils.html` — browser unit tests; loads the real `app.js` (open it over http)
- `tests/smoke.mjs` — end-to-end smoke test in Chromium (`node tests/smoke.mjs`, needs Playwright); CI runs it from `.github/workflows/test.yml`
- No build step. Serverless. The app runs from `file://`, except PNG export of non-transparent cards (canvas tainting): serve over http for that.

## Architecture

Single `state` object, mutated only via `setState(patch)` which always calls `render()`.  
Exception: `init()` mutates state directly with `Object.assign` + one `render()`.

DOM is always derived from state. Strip and favorites list use dirty-checks to avoid rebuilding on every keystroke. Anything that edits `state.customBackgrounds` must call `invalidateStrip()`.

The card is a CSS size container: text size and shadow are in `cqw`, so the card looks the same at any screen size. The PNG export (`renderCardToCanvas`) redraws the card on a canvas at a fixed resolution per ratio (`RATIOS[...].out`), reproducing that layout; if you change the text CSS, change `drawCardText` too.

Style fields live in one list, `STYLE_DEFAULTS`, plus one validator each in `STYLE_VALIDATORS`; favorites, persisted UI and sanitizers derive from them. Card sizes are constants in `app.js` injected as CSS variables (`applyCardMetrics`). `render()` skips card style and control updates when only the position changed (drag).

Everything read back from localStorage or an imported file goes through the sanitizers (`sanitizeFavorite`, `sanitizeUI`, ...). Favorites store custom backgrounds by reference (`custom:<hash>`), with the image in `pineapple_v2_fav_bgs`.

## Testing Checklist (v2)

`node tests/smoke.mjs` runs most of this list automatically. Run the rest by hand, serving the folder over http (`python -m http.server`).

**UI:**
- [ ] No explanatory text in the app: every button, control and the card has a tooltip (`title`) instead

**Init:**
- [ ] Loads with random phrase in textarea
- [ ] Loads with random background active, active thumbnail visible in strip
- [ ] Colors update when `autoAdjustColors` resolves (initial flash acceptable)
- [ ] Reload several times: background and phrase change

**Text row:**
- [ ] Phrase ↺ picks a random phrase, different from current
- [ ] Colors ↺ updates text/shadow colors coherently with background (curated palette)
- [ ] Download ↓ exports PNG (see Export PNG section)

**Text & Drag:**
- [ ] Typing in textarea → text updates in card in real time
- [ ] Textarea cursor does NOT jump to end while typing
- [ ] Multiline text (Enter in textarea): line breaks preserved in card
- [ ] Mouse drag: text stays within card bounds
- [ ] No text selection in document during drag
- [ ] Touch drag (DevTools): page does NOT scroll during drag on card
- [ ] Reset → text returns to 50/50/center

**Backgrounds:**
- [ ] Click thumbnails: changes background and updates colors
- [ ] Active thumbnail always visible after change (auto-scroll)
- [ ] Upload button (+) is the first item of the strip and stays visible while it scrolls
- [ ] Upload custom image: first thumbnail, auto-selected
- [ ] Upload 5 images: 6th evicts oldest with toast; uploads are downscaled (long side <= 1920px)
- [ ] ✕ on custom thumbnail: removes correctly, reindexing correct
- [ ] Reload: custom backgrounds persist

**Advanced panel:**
- [ ] ▼ Customize opens/closes panel; state persists on reload
- [ ] Escape closes panel
- [ ] Escape closes import modal if open (panel stays)
- [ ] Ctrl+S opens panel and focuses favorite name input
- [ ] +/− font size: no float drift (always one decimal)
- [ ] Align L/C/R: visible on multiline text
- [ ] 16:9 / 4:3 / 9:16 / 1:1 buttons: change aspect ratio; text keeps its size relative to the card
- [ ] Shadow / Outline: switches the text effect
- [ ] Arrow keys on the focused card move the text (Shift = 5)

**Favorites:**
- [ ] Save without name: "Enter a name" + red border on input
- [ ] Save with name: appears at top of list
- [ ] Load: restores full state including background
- [ ] Delete: toast with Undo 5s; Undo restores at original position
- [ ] Export: JSON with `{ "version": 3, "favorites": [...], "backgrounds": {...} }`
- [ ] Import + merge: no duplicates created
- [ ] Import + replace: list fully replaced
- [ ] Cancel import (overlay / Escape / button): nothing imported

**Export PNG:**
- [ ] PNG without UI chrome
- [ ] PNG resolution fixed per ratio: 1920x1080, 1440x1080, 1080x1920, 1080x1080
- [ ] Background, text, colors, effect and position exported correctly (match the card)
- [ ] Transparent PNG: no background, text only
- [ ] From `file://`: non-transparent export shows the explanatory error

**Persistence:**
- [ ] Reload: `advancedOpen`, text size, alignment, position, format and effect restored
- [ ] Reload: custom backgrounds persist
- [ ] Reload: favorites persist
