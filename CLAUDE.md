# CLAUDE.md — Development Guide

## Project

**Mijn Kijklijst** is een persoonlijke film- en serie-watchlist PWA. Zero dependencies, vanilla HTML/CSS/JS, volledig offline bruikbaar. Titels worden gesynchroniseerd naar `data.js` via een lokale Python server; user-specifieke state (watched, ratings, volgorde) wordt via de server opgeslagen in `state.json` zodat alle apparaten dezelfde state delen. localStorage dient als fallback wanneer de server niet bereikbaar is.

## Quickstart

```bash
cp js/data.example.js js/data.js   # eenmalig
python3 server.py 8000             # of ./start.sh
# open http://localhost:8000
```

## Bestandsstructuur

```
index.html          → Hoofd-HTML, alle overlays/modals
css/style.css       → Alle styling (één bestand, ~1497 regels)
js/data.js          → Persoonlijke titels + IMDB mapping (NIET in git)
js/data.example.js  → Template met voorbeeldtitels (WEL in git)
js/app.js           → Alle applicatielogica (~1109 regels)
server.py           → Lokale Python server met /api/save en /api/state endpoints
state.json          → User state: watched, ratings, order, tmdb_key (NIET in git)
sw.js               → Service Worker (cache-first static, network-first posters)
manifest.json       → PWA manifest (standalone, dark theme)
icons/              → PWA iconen (192px, 512px)
start.sh            → Startscript (port 8420, via server.py)
start.command       → macOS dubbelklik-startscript (port 8000, via server.py)
```

## Architectuur

### Data flow
- `data.js` bevat het `DATA` array (ALLE titels) en `IMDB` mapping object — dit is de single source of truth voor titels
- `state.json` bevat user state (watched, ratings, volgorde, TMDB key) — gedeeld tussen alle apparaten
- `server.py` draait als lokale HTTP server en biedt:
  - `POST /api/save` — schrijft data.js bij (titels toevoegen/verwijderen)
  - `GET /api/state` — leest state.json (of `{}` als niet bestaat)
  - `POST /api/state` — schrijft state.json bij (watched, ratings, order, tmdb_key)
- `app.js` laadt DATA bij opstart en synchroniseert wijzigingen automatisch terug naar data.js via `syncToFile()`
- Bij opstart: `loadState()` haalt state van server; als server leeg is wordt huidige localStorage geseeded naar server
- Bij elke state-wijziging: `syncState()` POST de volledige state naar de server
- View mode (grid/list) blijft bewust in localStorage (device-specifiek)
- `render()` is de centrale functie — filtert, sorteert en rendert de hele grid
- Als de server niet draait (bijv. via `file://`), valt de app terug op alleen-lezen mode met localStorage als state-opslag

### CSS variabelen (design tokens)
```css
--bg: #070a12          /* achtergrond */
--surface: #111827     /* card achtergrond */
--accent: #e5a00d      /* goud/accent */
--film-color: #3b82f6  /* blauw, badge + pill */
--serie-color: #a855f7 /* paars, badge + pill */
--watched-color: #22c55e /* groen, check + pill */
--text: #e6edf3        /* primaire tekst */
--text-dim: #8b949e    /* secundaire tekst */
```

### Glassmorphism pattern
Cards, buttons en dropdowns gebruiken:
```css
background: rgba(13,18,32,.4);
backdrop-filter: blur(10px);
border: 1px solid rgba(255,255,255,.08);
```

### Hero sectie lagen (z-index)
1. `.hero-posters` (z-0) — poster mosaic, opacity .22, blur 2.5px
2. `.hero-vignette` (z-1) — radial + linear gradient overlay
3. `.hero-aurora` (z-2) — animerende gekleurde glows
4. `.hero-spotlight` (z-3) — sweepend lichteffect
5. `.hero-content` (z-4) — titel, stats, filmreels
6. `.hero-separator` (z-5) — gouden lijn onderaan

### Fonts
- **Monoton** — h1 titel (retro cinema), met shimmer gradient animatie
- **Inter** — body tekst (400, 500, 600, 700)

## Features & code-locaties

| Feature | Locatie in app.js |
|---------|------------------|
| syncToFile() (data.js sync) | Regels 1-14 |
| State vars + save functies + syncState/loadState | 16-78 |
| Star rating HTML helpers | ~133-178 |
| View mode (grid/list) | ~180-187 |
| Dynamic dropdown counts | ~224-264 |
| Render (central, incl. empty-state + filter hints) | ~267-411 |
| Star rating interaction | ~451-471 |
| Sparkle effect (5 sterren) | ~490-506 |
| Stat pills als filter shortcuts | ~542-556 |
| resetFilters() | ~558-568 |
| Hero poster mosaic builder | ~577-601 |
| Add title modal + TMDB | ~610-1082 |
| openAdd() (met prefill + directe TMDB search) | ~610-630 |
| Random picker | ~699-788 |
| Drag-and-drop (desktop + touch) | ~796-951 |
| TMDB auto-complete | ~956-1095 |

## Conventies

### Code stijl
- Vanilla JS, geen frameworks, geen build step
- Geen semicolons verplicht (mix in codebase, wees consistent per blok)
- `getKey(item)` genereert unieke key: `item.t.toLowerCase().replace(/[^a-z0-9]/g,'')`
- localStorage keys prefixed met `kijklijst_`
- CSS gebruikt BEM-achtige naamgeving maar niet strict

### Data formaat (data.js)
```javascript
{ t: "Titel", y: "2024", type: "film"|"serie", lang: "Engels", d: "Beschrijving", img: "poster-url", g: "Genre1, Genre2" }
```
Alle velden behalve `t` en `type` zijn optioneel.

### Genre systeem
17 vaste genres met emoji-mapping in `GENRE_ICONS`. Nieuwe genres worden automatisch ondersteund maar krijgen 🎬 als fallback-icoon.

### Taal mapping
TMDB taalcodes → Nederlandse namen in `mapTmdbLang()`. Voeg nieuwe talen daar toe.

## Service Worker

- Versie bijhouden in `CACHE_VERSION` (sw.js regel 1)
- **Bump na elke wijziging** aan static assets → verander `'kijklijst-v5'` naar `'kijklijst-v6'` etc.
- Cache strategieën:
  - Static assets → cache-first
  - Google Fonts → cache-first
  - Poster images (media-amazon.com, tmdb.org) → network-first met cache fallback
  - `/api/*` endpoints → altijd netwerk (nooit gecached)
  - TMDB API calls → altijd netwerk

## Veelvoorkomende taken

### Nieuwe feature toevoegen
1. HTML in `index.html` (overlay/modal als nodig)
2. CSS in `css/style.css` (volg glassmorphism pattern)
3. JS in `js/app.js` (state in localStorage, render in `render()`)
4. Bump `CACHE_VERSION` in `sw.js`

### Nieuw genre toevoegen
Voeg emoji toe aan `GENRE_ICONS` in app.js. Zonder mapping werkt het alsnog (fallback 🎬).

### Responsive aanpassingen
Grid: 5 kolommen desktop, 3 kolommen tablet (≤600px), 2 kolommen kleine telefoons (≤380px). Posters in staand formaat (aspect-ratio 2/3).
Breakpoints: `@media (max-width: 600px)` en `@media (max-width: 380px)` onderaan style.css.

### Film reels (hero decoratie)
SVG film reels in index.html als `.film-reel--left` en `.film-reel--right`. Subtiele gouden tint, 50s rotatie. Hidden op mobiel (<600px).

## Niet doen

- **Geen npm/node_modules** — dit is een zero-dependency project
- **Geen data.js committen** — bevat persoonlijke titels, staat in .gitignore
- **Geen state.json committen** — bevat persoonlijke state, staat in .gitignore
- **Geen API keys in code** — TMDB key zit in state.json/localStorage
- **Geen externe CSS/JS** — behalve Google Fonts CDN
- **Geen state.json of localStorage wissen** zonder backup — dat is alle gebruikersdata
