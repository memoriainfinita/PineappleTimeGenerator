# Pineapple Time Generator — State

## System

- Repo: https://github.com/memoriainfinita/PinnapleTimeGenerator
- Live demo: https://memoriainfinita.github.io/PinnapleTimeGenerator/
- Stack v2: index.html + style.css + app.js, no build step
- Storage: LocalStorage for favorites

## Files

| File | Status | Notes |
|------|--------|-------|
| `index.html` | active | v2 — markup only |
| `style.css` | active | v2 — full stylesheet |
| `app.js` | active | v2 — full JS (Data, Utils, State, Render, Events, Init) |
| `CLAUDE.md` | active | v2 testing checklist |
| `tests/test-utils.html` | active | browser test harness for pure functions |
| `backgrounds/` | active | preset images, unchanged in v2 |
| `LICENSE` | active | GPL-3.0 |
| `docs/superpowers/specs/2026-05-24-v2-design.md` | active | final spec |
| `docs/superpowers/plans/2026-05-24-v2-implementation.md` | active | executed plan |
| `archive/` | active | index-v1.html, original, CLAUDE.md v1, obsolete docs |

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
- PNG export via toBlob scale:2
- Single keydown listener for Escape + Ctrl+S

Key decisions:
- Drag clamping [5, 95] (safe area)
- `.text-wrapper` width: 90% for textAlign to work
- `classList.toggle` for ratio (doesn't overwrite classes)
- Favorites: newest first, dedup by id on merge
- Versioned JSON export `{ version: 2, favorites: [] }`
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
- 2026-05-24 (session 4): UI tweaks — random colors button moved to text row, page background darkened, buttons unified, position sliders removed (drag replaces them), advanced panel in 4-column grid, UI translated to English.

## TODO

- [x] New session: read v2 spec and invoke writing-plans for implementation plan
- [x] Execute v2 plan — `docs/superpowers/plans/2026-05-24-v2-implementation.md`
- [ ] Manual end-to-end verification in browser (checklist in CLAUDE.md)
- [ ] Decide whether to push to GitHub Pages
