# Pineapple Time Generator - Claude Context

## Project Overview
A SpongeBob-themed time card generator inspired by the iconic title cards from the show. Single HTML file application with no dependencies (except html2canvas for image export).

## Tech Stack
- Pure HTML/CSS/JavaScript
- html2canvas for image export
- LocalStorage for favorites persistence
- "Some Time Later" font from CDN

## Key Features
1. **Text Customization**: Custom text input + 35+ predefined SpongeBob phrases
2. **Visual Styling**: Font size, colors, text shadows, positioning (X/Y + alignment)
3. **Backgrounds**: 17 predefined SpongeBob backgrounds + custom image upload
4. **Aspect Ratios**: Toggle between 16:9 and 4:3 formats
5. **Favorites System**: Save/load/delete favorite presets (stored in LocalStorage)
6. **Export**: Download as PNG with selected aspect ratio

## Architecture
- **Single File**: Everything in `PineappleTimeGenerator.html`
- **No Build Process**: Ready to run, just open in browser
- **No External Dependencies**: Except html2canvas CDN

## Code Style
- Vanilla JavaScript (no frameworks)
- CSS custom properties for theming
- Minimal, clean code structure
- Mobile-responsive design

## Current Branch: main
Latest improvements merged from feature/improvements branch.

## Recently Implemented ✅
1. ✅ Smart auto-contrast system (analyzes background brightness)
2. ✅ Drag & drop text positioning
3. ✅ Font size +/- buttons
4. ✅ Improved UI legibility (system font for controls)
5. ✅ Clean exports (no TV border)
6. ✅ Safe area margins for video production
7. ✅ Responsive thumbnail grid layout
8. ✅ Favorites system fully functional

## Pending Improvements (To Discuss)
1. Custom font options
2. Animation effects
3. Batch processing
4. Templates library
5. Additional export formats (JPG, GIF, video)

## Development Notes
- Always test position indicator visibility
- Ensure html2canvas doesn't capture UI overlays
- Maintain backward compatibility with saved favorites
- Keep file size reasonable (single HTML approach)

## Testing Checklist
- [ ] Text positioning works smoothly
- [ ] Custom backgrounds can be uploaded/removed
- [ ] Favorites save/load/delete correctly
- [ ] Download generates clean PNG (no UI elements)
- [ ] Aspect ratio toggle works properly
- [ ] Mobile responsive on small screens
- [ ] LocalStorage persists across sessions
