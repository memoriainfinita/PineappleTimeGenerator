# Pineapple Time Generator

[![Live demo](https://img.shields.io/badge/demo-GitHub%20Pages-blue)](https://memoriainfinita.github.io/PinnapleTimeGenerator/)
[![License](https://img.shields.io/badge/license-GPL--3.0-blue)](LICENSE)

SpongeBob-themed time card generator. Create title cards in the style of the show's iconic scene transitions and export them as clean PNGs for video editing.

## Quick Start

**Online:** [Open Pineapple Time Generator](https://memoriainfinita.github.io/PinnapleTimeGenerator/) — no install needed.

**Local:**
```bash
git clone https://github.com/memoriainfinita/PinnapleTimeGenerator.git
```
Open `index.html` in a browser. No dependencies to install. Works offline (except the font CDN).

## Features

- **Text:** write your own or pick from 35+ iconic phrases; loads a random one on start
- **Backgrounds:** 15 SpongeBob episode backgrounds + custom image upload; loads a random one on start
- **Smart colors:** auto-contrast analyzes background brightness and picks readable text/shadow colors
- **Style:** font size (+/- buttons or slider), text color, shadow color
- **Positioning:** drag text directly on the card, or use X/Y sliders and alignment buttons
- **Aspect ratio:** toggle between 16:9 and 4:3
- **Favorites:** save, load, delete presets; export/import as JSON
- **Export:** clean PNG (no borders or UI chrome)

## How to Use

1. Write your text or pick a phrase from the dropdown
2. Choose a background from the grid or upload your own
3. Hit "Random Colors" to auto-set readable colors, or adjust manually
4. Drag the text on screen or use the sliders to reposition
5. Save as a favorite if you want to come back to this setup
6. Click "Download" to export as PNG

**Keyboard shortcut:** `Ctrl+S` focuses the favorites name field.

## Special Dedication

This project is dedicated to **[CuriousMarc](https://www.youtube.com/c/Curiousmarc)** — a YouTube channel I've been watching for years. They use SpongeBob time cards throughout their videos on vintage computing and electronics restoration. *Merci beaucoup* to Marc and his team.

## Planned Improvements

- Custom font options
- Additional export formats (JPG, GIF, video)
- Animation effects
- Templates library
- Batch processing

## Technologies

- HTML5 / CSS3 / JavaScript (vanilla)
- [html2canvas](https://html2canvas.hertzen.com/) for image export

## Development

Built with vibe coding and Claude AI assistance. Single-file approach — everything in `index.html`, no build step.

## License

GPL-3.0 — free to use, modify, and distribute. Derivatives must also be GPL-3.0.

---

Created with ❤️ by [mi](https://github.com/memoriainfinita)
