# Pineapple Time Generator — State

## System

- Repo: https://github.com/memoriainfinita/PinnapleTimeGenerator
- Live demo: https://memoriainfinita.github.io/PinnapleTimeGenerator/
- Stack v2 (listo para implementar): index.html + style.css + app.js, sin build step
- Storage: LocalStorage para favorites

## Files

| File | Status | Notes |
|------|--------|-------|
| `index.html` | archivado | v1 → `archive/index-v1.html` |
| `style.css` | pendiente | se creará en v2 (Task 1) |
| `app.js` | pendiente | se creará en v2 (Task 2–13) |
| `backgrounds/` | activo | imágenes predefinidas, sin cambios en v2 |
| `LICENSE` | activo | GPL-3.0 |
| `docs/superpowers/specs/2026-05-24-v2-design.md` | activo | spec final, 4 pasadas de gaps resueltos |
| `docs/superpowers/plans/2026-05-24-v2-implementation.md` | activo | plan listo para ejecutar (14 tasks) |
| `archive/` | activo | index-v1.html, original, CLAUDE.md, docs obsoletos |

## v2 — Diseño aprobado y plan listo (2026-05-24)

Spec: `docs/superpowers/specs/2026-05-24-v2-design.md`
Plan: `docs/superpowers/plans/2026-05-24-v2-implementation.md`

Resumen arquitectura v2:
- 3 archivos: index.html (markup) / style.css / app.js
- Estado único `state` + `setState(patch)` centralizado
- `render()` siempre derivado del state; strip y lista de favoritos con dirty-check
- Init: batch `Object.assign` + un solo `render()`
- Drag mouse y touch (passive:false)
- autoAdjustColors async con race guard y brightness cache
- Paletas curadas SpongeBob (DARK/LIGHT)
- Soft delete favoritos con undo toast (5s, stackeable x3)
- Custom backgrounds persistidos en localStorage (max 5)
- Export PNG via toBlob scale:2
- Single keydown listener para Escape + Ctrl+S

Decisiones clave resueltas en sesión:
- Clamping drag [5, 95] (safe area)
- .text-wrapper width: 90% para que textAlign funcione
- classList.toggle para ratio (no sobreescribe clases)
- Favorites: newest first, dedup por id en merge
- JSON export versionado `{ version: 2, favorites: [] }`
- favNameInput.error CSS incluido en style.css
- wireEvents() sólo se llama cuando está definida (Task 9)

## Preferences

- [style] Separación HTML/CSS/JS. Sin build step. Confirmed 2026-05-24.
- [style] Vanilla JS, sin frameworks, sin npm en runtime. Confirmed 2026-05-24.
- [filosofía] Tool única, un objetivo, open source GPL-3 para la humanidad. Confirmed 2026-05-24.
- [workflow] state.md es única fuente de verdad — CLAUDE.md archivado. Confirmed 2026-05-24.
- [deploy] App es serverless (file:// compatible). Sin servidor local necesario para desarrollo. Confirmed 2026-05-24.

## History

- 2026-05-01: Primera sesión. Push de badges al README. Renombrado archivo original. Creado state.md.
- 2026-05-24 (sesión 1): Limpieza profunda de v1. Brainstorming v2: diseño aprobado, spec commiteado.
- 2026-05-24 (sesión 2): 4 pasadas de análisis de gaps en spec. Plan de implementación escrito (14 tasks), revisado (12 gaps corregidos), archivados archivos obsoletos (index v1, CLAUDE.md, docs AI). Plan listo para ejecutar en próxima sesión.

## TODO

- [x] Sesión nueva: leer spec v2 e invocar writing-plans para plan de implementación
- [ ] **SIGUIENTE SESIÓN:** ejecutar plan v2 — `docs/superpowers/plans/2026-05-24-v2-implementation.md`
- [ ] Después de implementar: decidir si v2 reemplaza main o PR separado
