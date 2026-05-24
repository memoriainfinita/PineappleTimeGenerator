# Pineapple Time Generator - Claude Context

## Project Overview
SpongeBob-themed time card generator inspired by the iconic title cards from the show. Single HTML file, no build process.

## Tech Stack
- Vanilla HTML/CSS/JavaScript
- html2canvas (CDN) for PNG export
- LocalStorage for favorites
- "Some Time Later" font (CDN)
- Background images from SpongeBob SquarePants episodes

## Architecture
- **Single file:** `index.html` — everything lives here
- **No build process:** open in browser and go
- **No external dependencies** beyond the two CDN scripts above

## Features
1. Custom text + 35+ predefined SpongeBob phrases (random on load)
2. Font size, colors, text shadow, X/Y positioning, text alignment
3. 15 predefined backgrounds + custom image upload (random on load)
4. Drag & drop text repositioning
5. Smart auto-contrast (analyzes background brightness to pick readable colors)
6. Toggle 16:9 / 4:3 aspect ratio
7. Favorites system (save/load/delete, export/import JSON)
8. Clean PNG export (no UI chrome)

## Code Style
- Vanilla JS, no frameworks
- CSS custom properties for theming
- Mobile-responsive

## Development Notes
- `textAlign` is stored on `.text-wrapper`, not on `#timeCard` directly
- `autoAdjustColors` always picks new random colors within the contrast constraint — intentional, not deterministic
- html2canvas `onclone` removes the `.download-overlay` before capture
- Backward compatibility: favorites saved before textPositionX/Y existed default to center on load

## Pending (To Discuss)
- [ ] Custom font options
- [ ] Animation effects
- [ ] Additional export formats (JPG, GIF, video)
- [ ] Templates library
- [ ] Batch processing

## Testing Checklist
- [ ] Text positioning (sliders + drag)
- [ ] Custom background upload/remove
- [ ] Favorites save/load/delete
- [ ] Favorites export/import (merge and replace paths)
- [ ] Download PNG clean (no overlay)
- [ ] Aspect ratio toggle
- [ ] Mobile responsive
- [ ] LocalStorage persists across sessions
- [ ] Ctrl+S shortcut opens favorites tab
