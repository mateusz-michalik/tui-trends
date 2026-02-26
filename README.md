# tui-trends

Cyberpunk Google Trends visualizer in your terminal.

## Usage

```bash
# Install dependencies (only once)
npm install

# Run with a search term
npm start -- "buy bitcoin"
npm start -- "taylor swift"
npm start -- "rust programming language"
```

## Keybindings

| Key | Action |
|-----|--------|
| `q` | Quit |
| `r` | Refresh / re-fetch data |
| `↑ ↓` | Scroll the related queries table |

## What you'll see

- **Loading screen** — animated spinner with ASCII art banner while data is fetched
- **Interest Over Time** — braille-rendered line chart (0–100 scale, last 12 months)
- **Top Regions** — horizontal bar chart of countries with highest search interest
- **Related Queries** — scrollable table of related search terms and their scores

## Stack

- [Rezi](https://rezitui.dev) — TypeScript TUI framework with native C rendering engine
- [google-trends-api](https://www.npmjs.com/package/google-trends-api) — unofficial Google Trends client
- [figlet](https://www.npmjs.com/package/figlet) — ASCII art banner
- [tsx](https://github.com/privatenumber/tsx) — run TypeScript directly

## Notes

- Requires an internet connection (hits `trends.google.com` directly)
- Google Trends may rate-limit requests if called too frequently
- Best displayed in a terminal at least 120 columns wide
