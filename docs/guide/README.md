# Pineapple Time Generator guide

How to make a time card. The [README](../../README.md) lists the features; this page is a short walk through.

Open https://memoriainfinita.github.io/PineappleTimeGenerator/. Everything happens in your browser. If you run it yourself, serve it over http (`python -m http.server`): from `file://` the PNG export breaks.

## Make a card

![A card: the text over a background, the strip of backgrounds and the controls](img/card.png)

The page starts with a random phrase over a random background. Then:

1. **Write your text** in the box under the card, or press **Phrase ↺** for one of the 35 or more iconic phrases
2. **Choose a background** from the strip below the card, press **Background ↺** for a random one, or press **+** at the end of the strip to upload an image of your own
3. Press **Colors ↺**: it looks at how bright the background is and picks a text colour and a shadow colour that read well on it
4. **Drag the text** on the card to place it
5. Press **Download ↓** to get a PNG at twice the size of the card, with none of the page around it

Your own backgrounds stay in the browser. The strip keeps up to five: a sixth replaces the oldest one, and the ✕ on one of yours removes it.

## Customize

**▼ Customize** opens a panel under the controls; Esc closes it.

![The customize panel: colours, text size, alignment and format](img/customize.png)

- **Colors**: the text and the shadow, by hand
- **Text size**: the − and + buttons or the slider
- **Align**: L, C or R, which you see on text of several lines (Enter in the box makes a new line); **Reset** puts the text back in the centre
- **Format**: switches the card between 16:9 and 4:3
- **Favorites**: save the card as you have it, with a name, and load it later. `Ctrl+S` opens the panel and puts you in the name field. Deleting one shows a message with Undo for a few seconds. **Export** writes your favorites to a JSON file, and **Import** brings a file back, merging with the ones you have or replacing them

Favorites, your backgrounds and whether the panel was open are remembered when you reload the page.
