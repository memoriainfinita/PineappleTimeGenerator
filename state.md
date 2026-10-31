---
created: 2026-05-01
last_updated: 2026-10-31
---

# Pineapple Time Generator — State

## System

- Repo: https://github.com/memoriainfinita/PineappleTimeGenerator
- Live demo: https://memoriainfinita.github.io/PineappleTimeGenerator/
- Stack v2: index.html + style.css + app.js, no build step
- Storage: LocalStorage for favorites, custom backgrounds and UI settings

## Files

| File | Status | Notes |
|------|--------|-------|
| `index.html` | active | v2 — markup only |
| `style.css` | active | v2 — full stylesheet |
| `app.js` | active | v2 — full JS (Data, Utils, State, Render, Events, Init) |
| `CLAUDE.md` | active | v2 testing checklist |
| `tests/test-utils.html` | active | browser unit tests; load the real `app.js` |
| `tests/smoke.mjs` | active | Chromium end-to-end smoke test (Playwright, test-only); `node tests/smoke.mjs` |
| `.github/workflows/test.yml` | active | runs `tests/smoke.mjs` on push and PR; never run on GitHub yet |
| `favicon.svg` | active | tab icon |
| `backgrounds/` | active | preset images (downscaled to <= 2560px, same file names); `thumbs/` holds the 256x160 WebP strip thumbnails; originals in `.archive/backgrounds-original/` |
| `LICENSE` | active | GPL-3.0 |
| `docs/superpowers/specs/2026-05-24-v2-design.md` | active | final spec |
| `docs/superpowers/plans/2026-05-24-v2-implementation.md` | active | executed plan |
| `README.md` | active | screenshot at `docs/PineappleTimeGenerator-demo.png` |
| `.archive/` | gitignored | index-v1.html, original, CLAUDE.md v1, obsolete docs |

## v2 — Architecture

Spec: `docs/superpowers/specs/2026-05-24-v2-design.md`
Plan: `docs/superpowers/plans/2026-05-24-v2-implementation.md`

- 3 files: index.html (markup) / style.css / app.js
- Single `state` object + centralized `setState(patch)`
- `render()` always derived from state; strip and favorites list use dirty-checks
- Init: batch `Object.assign` + single `render()`
- Mouse and touch drag (passive:false)
- `autoAdjustColors` async with race guard and brightness cache
- Curated SpongeBob palettes (DARK/LIGHT)
- Soft delete favorites with undo toast (5s, stackable x3)
- Custom backgrounds persisted in localStorage (max 5)
- PNG export drawn on a canvas at a fixed size per ratio (no html2canvas)
- Card is a CSS size container; text size and shadow in cqw
- Ratios 16:9, 4:3, 9:16, 1:1; shadow or outline effect; transparent PNG option
- Pointer Events drag, arrow-key nudge on the focused card
- Colors picked by WCAG contrast over the region behind the text
- Everything read from localStorage or imports goes through sanitizers
- Favorites reference custom backgrounds as `custom:<hash>`; image stored once in `pineapple_v2_fav_bgs`; export format `{ version: 3, favorites, backgrounds }`
- Uploads downscaled to JPEG, long side <= 1920px
- UI settings (size, align, position, format, effect, transparent, panel) persisted
- Single keydown listener for Escape + Ctrl+S

Key decisions:
- Drag clamping [5, 95] (safe area)
- `.text-wrapper` width: 90% for textAlign to work
- `classList.toggle` for ratio (doesn't overwrite classes)
- Favorites: newest first, dedup by id on merge
- `favNameInput.error` CSS included in style.css
- `wireEvents()` called only after it is defined (Task 9)

## Preferences

- [style] HTML/CSS/JS separation. No build step. Confirmed 2026-05-24.
- [style] Vanilla JS, no frameworks, no npm at runtime. Confirmed 2026-05-24.
- [philosophy] Single tool, single purpose, open source GPL-3 for humanity. Confirmed 2026-05-24.
- [workflow] state.md is single source of truth. Confirmed 2026-05-24.
- [deploy] App is serverless (file:// compatible). No local server needed for development. Confirmed 2026-05-24.
- [i18n] App, code and documentation in English. Confirmed 2026-05-24.

## History

- 2026-05-01: Session 1. Pushed README badges. Renamed original file. Created state.md.
- 2026-05-24 (session 1): Deep v1 cleanup. v2 brainstorm: design approved, spec committed.
- 2026-05-24 (session 2): 4 rounds of gap analysis on spec. Implementation plan written (14 tasks), revised (12 gaps fixed), obsolete files archived. Plan ready to execute.
- 2026-05-24 (session 3): Reviewed 3 plan gaps (hidden/CSS specificity, uploadCustomBg mutation undocumented, CLAUDE.md in gitignore). Plan fixed. v2 implementation executed in full (14 tasks, 12 commits). App live on main.
- 2026-05-24 (session 4): UI tweaks — random colors button moved to text row, page background darkened, buttons unified, position sliders removed (drag replaces them), advanced panel in 4-column grid, UI translated to English. Drag hint added below card. README and CLAUDE.md cleaned (no slop, factual fixes).
- 2026-05-24 (session 5): PNG export broken on file:// (SecurityError on toBlob). Speculative edits reverted. Needs proper diagnosis before touching.
- 2026-05-30 (session 6): Diagnosed PNG export bug. Root cause: Firefox assigns opaque unique origin to each file:// URL — canvas always taints, toDataURL/toBlob both fail. No JS-only fix without bundling images as base64. Decision: accept Chrome-only for local file:// export. Graceful error toast in Firefox. Fixed _getImageBrightness crossOrigin noise on file://.
- 2026-06-16 (session 7): Corrected session 6 conclusion. PNG export of preset backgrounds also fails in Chrome on file:// — reproduced. It is a file:// canvas-tainting limitation in ALL browsers, not Chrome-specific. Export error message rewritten to say so. Verified export works when served over http (python -m http.server). Added "Background ↺" button to text row (random over all backgrounds + autoAdjustColors). Expanded color palettes 5→18 each, rebalanced dark palette for perceptible hue (near-black originals looked identical) and light palette away from near-identical yellows. Removed dead colorBrightness(); updated stale color defaults and palette comment. README: documented server requirement, added Background ↺.
- 2026-10-31: Review and fix pass. Fixed: stale strip thumbnail when the custom list was full, text size not scaling with the card, unvalidated imports and storage reads, localStorage quota (downscaled uploads, favorites reference backgrounds), Spanish "Cargar", revokeObjectURL race, undo position. Removed dead code (mousedown `btn-remove-bg` check, `onclone`, `useCORS`, duplicated import and custom-bg blocks, stale `colorBrightness` in tests). Replaced html2canvas with a canvas export at fixed resolution. Added 9:16 and 1:1, transparent PNG, outline effect, contrast-based colors, UI persistence, keyboard and screen reader support, favicon and meta tags, thumbnails and optimized backgrounds (13.2MB -> 8.4MB full images plus thumbs). Tests: unit tests now load the real `app.js`; added `tests/smoke.mjs` and a CI workflow. `state.md` removed from `.gitignore` (it is tracked).
- 2026-09-24: Repo renamed from `PinnapleTimeGenerator` to `PineappleTimeGenerator` (typo). GitHub redirects the repo; the old Pages URL returns 404.

## TODO

- [x] New session: read v2 spec and invoke writing-plans for implementation plan
- [x] Execute v2 plan — `docs/superpowers/plans/2026-05-24-v2-implementation.md`
- [x] Fix PNG export on file:// — confirmed file:// limitation in all browsers; export works when served over http; error message and README updated
- [x] End-to-end verification of the CLAUDE.md checklist in Chromium: automated in `tests/smoke.mjs`, passing on 2026-10-31
- [ ] Manual check in Firefox, Safari and a real touch device (drag, `cqw` text sizing, outline, export)
- [ ] Manual check with the web font loaded: the sandbox could not reach `fonts.cdnfonts.com`, so export alignment was only compared with the fallback font
- [ ] Regenerate `docs/guide/img/*.png` (`scripts/screenshots.mjs`): the customize panel changed
- [ ] Confirm `.github/workflows/test.yml` passes on GitHub
