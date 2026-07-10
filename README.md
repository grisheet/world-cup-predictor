# World Cup Match Predictor

A minimalist, client-side FIFA World Cup 2026 match predictor. Select any two national teams to instantly generate a match forecast, compare squad ratings, inspect depth charts, and visualize starting lineups — all in a single-page interface.

**Live demo:** https://grisheet.github.io/world-cup-predictor

---

## Features

- **Match Prediction** — Weighted strength algorithm calculates win/draw probabilities for each matchup
- **Team Comparison** — Side-by-side attack, midfield, defense, and overall ratings
- **Depth Chart** — Manager info, tactical formation, and full squad breakdown (starters, subs, reserves)
- **Lineup Visualizer** — Starting XI displayed on a pitch view in formation order
- **No backend required** — Pure HTML, CSS, and vanilla JavaScript

---

## Teams Included

| Team | Attack | Midfield | Defense |
|------|--------|----------|---------|
| Argentina | 89 | 88 | 86 |
| Brazil | — | — | — |
| England | — | — | — |
| France | — | — | — |
| Germany | — | — | — |
| Spain | — | — | — |
| Netherlands | — | — | — |
| Morocco | — | — | — |
| Portugal | — | — | — |
| Belgium | — | — | — |

---

## How the Prediction Works

Each team is assigned a **strength score** using a weighted formula:

```
Strength = (attack × 0.30) + (midfield × 0.22) + (defense × 0.22)
         + (form × 0.16) + (worldCupHistory × 0.10)
```

The difference in strength between the two teams shifts the win/draw probabilities, with caps applied to keep results realistic. The final output shows a percentage chance of Team 1 win, draw, or Team 2 win.

---

## Project Structure

```
world-cup-predictor/
├── index.html      # App shell and layout
├── style.css       # Styling (Inter font, dark card UI)
├── script.js       # All app logic — prediction, rendering, data loading
└── teams.json      # Team data: ratings, managers, formations, squads
```

---

## Getting Started

No build tools or dependencies needed.

1. Clone the repo:
   ```bash
   git clone https://github.com/grisheet/world-cup-predictor.git
   cd world-cup-predictor
   ```

2. Serve locally (required for the `fetch` call to `teams.json` to work):
   ```bash
   # Python 3
   python3 -m http.server 8080
   ```

3. Open `http://localhost:8080` in your browser.

> Opening `index.html` directly via `file://` will fail due to browser CORS restrictions on local fetches.

---

## Adding a Team

Edit `teams.json` and add an entry following this schema:

```json
{
  "name": "Country Name",
  "ratings": {
    "attack": 85,
    "midfield": 82,
    "defense": 80,
    "overall": 82
  },
  "form": 80,
  "worldCupHistory": 75,
  "manager": { "name": "Manager Name", "picture": "" },
  "formation": "4-3-3",
  "startingXI": [
    { "name": "Player Name", "position": "GK", "picture": "" }
  ],
  "substitutes": [],
  "reserves": []
}
```

---

## Tech Stack

- **HTML5** — Semantic markup
- **CSS3** — Card-based layout, Inter font via Google Fonts
- **Vanilla JavaScript (ES6+)** — DOM manipulation, Fetch API, template literals
- **JSON** — Static data store for team rosters and ratings

---

## License

MIT
