# tui-trends

Cyberpunk Google Trends visualizer in your terminal.

![screenshot](https://raw.githubusercontent.com/mateusz-michalik/tui-trends/main/assets/screenshot.png)

## Install globally

**From npm:**

```bash
npm install -g tui-trends
tui-trends "buy bitcoin"
```

**From this repo:**

```bash
npm install
npm run build
npm install -g .
tui-trends "buy bitcoin"
```

**One-off without installing:**

```bash
npx tui-trends "buy bitcoin"
```

## Usage

```bash
# Google Trends (default)
tui-trends "buy bitcoin"

# npm package download trends — no rate limits, great for testing
tui-trends --npm react
tui-trends --npm typescript
tui-trends --npm next
```

## Development

```bash
npm install
npm start -- "buy bitcoin"        # runs via tsx, no build step
npm run dev -- "buy bitcoin"      # tsx watch mode, reloads on save
npm start -- --npm react          # npm mode in dev
```

## Keybindings

| Key       | Action                   |
| --------- | ------------------------ |
| `q`       | Quit                     |
| `← →`    | Cycle through themes     |

## Themes

Cycle through 6 built-in colour themes with `←` / `→`:

| # | Name        | Vibe                          |
|---|-------------|-------------------------------|
| 1 | Synthwave   | Neon cyan & hot pink (default)|
| 2 | Matrix      | All green on black            |
| 3 | C64         | Commodore 64 blue/white       |
| 4 | Amber       | Phosphor amber monitor        |
| 5 | Nord        | Muted arctic pastels          |
| 6 | Blood Moon  | Deep red & orange             |

## What you'll see

- **Loading screen** — animated spinner with ASCII art banner while data is fetched
- **Line chart** — braille-rendered trend line (0–100 index, last 12 months)
- **Bar chart** — top regions (Google mode) or peak download weeks (npm mode)
- **Table** — related queries (Google mode) or monthly download breakdown (npm mode)

## Stack

- [Rezi](https://rezitui.dev) — TypeScript TUI framework with native C rendering engine
- [google-trends-api](https://www.npmjs.com/package/google-trends-api) — unofficial Google Trends client
- [tsx](https://github.com/privatenumber/tsx) — run TypeScript directly

## Notes

- Requires Node 18+ (uses native `fetch` for npm API)
- Google Trends mode hits `trends.google.com` directly and may rate-limit if called repeatedly
- Use `--npm` mode for unlimited local testing
- Best displayed in a terminal at least 120 columns wide
