# CLAUDE.md — Development Guide

## Project

**Mijn Kijklijst** is een persoonlijke film- en serie-watchlist PWA. Zero dependencies, vanilla HTML/CSS/JS, volledig offline bruikbaar. Titels worden gesynchroniseerd naar `data.js` via een lokale Python server; user-specifieke state (watched, ratings, volgorde) wordt via de server opgeslagen in `state.json` zodat alle apparaten dezelfde state delen. localStorage dient als fallback wanneer de server niet bereikbaar is.

## Quickstart

```bash
cp js/data.example.js js/data.js   # eenmalig
python3 server.py                  # of ./start.sh
# open http://localhost:8420
```

## Bestandsstructuur

```
index.html          → Hoofd-HTML, alle overlays/modals
css/style.css       → Alle styling (één bestand, ~1851 regels)
js/data.js          → Persoonlijke titels + IMDB mapping (NIET in git)
js/data.example.js  → Template met voorbeeldtitels (WEL in git)
js/app.js           → Alle applicatielogica (~1694 regels)
server.py           → Lokale Python server met /api/save en /api/state endpoints
state.json          → User state: watched, ratings, order, tmdb_key (NIET in git)
sw.js               → Service Worker (cache-first static, network-first posters)
manifest.json       → PWA manifest (standalone, dark theme)
icons/              → PWA iconen (192px, 512px)
start.sh            → Startscript Linux/macOS (port 8420, via server.py)
start.command       → macOS dubbelklik-startscript (port 8420, via server.py)
start.bat           → Windows startscript (port 8420, via server.py)
```

## Architectuur

### Data flow
- `data.js` bevat het `DATA` array (ALLE titels) en `IMDB` mapping object — dit is de single source of truth voor titels
- `state.json` bevat user state (watched, ratings, volgorde, tmdb_key) — gedeeld tussen alle apparaten
- `server.py` draait als lokale HTTP server (standaard `127.0.0.1`, met `--lan` vlag op `0.0.0.0` voor mobiele toegang) en biedt:
  - `POST /api/save` — schrijft data.js bij (titels toevoegen/verwijderen)
  - `GET /api/state` — leest state.json; whitelist: watched, ratings, order, tmdb_key
  - `POST /api/state` — schrijft state.json bij; whitelist: watched, ratings, order, tmdb_key
  - `GET /state.json` — geblokkeerd (404) om directe toegang te voorkomen
- `app.js` laadt DATA bij opstart en synchroniseert wijzigingen automatisch terug naar data.js via `syncToFile()`
- Bij opstart: `loadState()` haalt state van server; als server leeg is wordt huidige localStorage geseeded naar server
- Bij elke state-wijziging: `debouncedSyncState()` (300ms debounce) POST de volledige state naar de server
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
| State vars + save functies + debouncedSyncState/loadState | ~16-85 |
| Helpers (hashColor, getKey, escapeHtml, imdbUrl, jwUrl) | ~87-155 |
| Star rating HTML helpers + ratingBlockHtml | ~157-205 |
| View mode (grid/list) | ~207-214 |
| DOM refs | ~216-224 |
| populateDropdowns() (single-pass) | ~226-253 |
| Dynamic dropdown counts | ~255-296 |
| Toast notifications (showToast + undo) | ~298-320 |
| Render (central, incl. empty-state + filter hints) | ~322-480 |
| Card description expand/collapse (poster + info click) | ~482-499 |
| toggleWatch (met confirm + toast + undo) | ~501-528 |
| removeItem (met confirm + toast + undo) | ~530-563 |
| updateStats | ~565-572 |
| Star rating interaction | ~574-622 |
| Sparkle effect (5 sterren) | ~624-641 |
| Filters (type, status, genre, lang, sort, view toggle) | ~643-670 |
| Mobile filter toggle | ~672-678 |
| Stat pills als filter shortcuts | ~680-698 |
| resetFilters() + resetFiltersKeepSearch() | ~700-726 |
| h1 click reset | ~728 |
| Search input + clear button | ~730-747 |
| Hero poster mosaic builder | ~749-775 |
| Add title modal + TMDB + IMDb fetch | ~776-864 |
| Random picker | ~866-991 |
| Drag-and-drop (desktop + touch) + reorderCustomOrder | ~993-1135 |
| TMDB auto-complete (searchTmdb, mapTmdbLang) | ~1137-1284 |
| Bulk import (searchTmdbSingle, buildItemFromTmdb, fetchImdbId) | ~1286-1539 |
| Filter badge (updateFilterBadge) | ~1541-1553 |
| Centralized Escape key handler | ~1555-1562 |
| Service Worker registratie | ~1564-1567 |
| IMDb backfill (searchTmdbTyped, bestTmdbMatch, backfillImdbIds) | ~1569-1639 |
| refreshAllFromTmdb (one-time TMDB description refresh) | ~1641-1672 |
| Scroll to top | ~1674-1681 |
| Init + loadState + backfill trigger | ~1683-1694 |

## Conventies

### Code stijl
- Vanilla JS, geen frameworks, geen build step
- Geen semicolons verplicht (mix in codebase, wees consistent per blok)
- `getKey(item)` genereert unieke key: `item.t.toLowerCase().replace(/[^a-z0-9]/g,'')`
- localStorage keys prefixed met `kijklijst_`
- CSS gebruikt BEM-achtige naamgeving maar niet strict

### Security
- `escapeHtml()` gebruiken voor alle user/API-data die in innerHTML terechtkomt
- `escapeAttr()` voor data in HTML-attributen
- `safeImageUrl()` sanitized poster-URLs (alleen http/https toegestaan)
- Server bindt standaard op `127.0.0.1`; `--lan` vlag of `KIJKLIJST_LAN=1` env var voor `0.0.0.0`
- `GET /state.json` geblokkeerd met 404 (alleen via `/api/state` endpoint)
- Server-side whitelist: alleen `watched`, `ratings`, `order`, `tmdb_key` worden opgeslagen/uitgelezen
- TMDB API key wordt gesynchroniseerd via `state.json` (gedeeld tussen apparaten) en opgeslagen in localStorage
- TMDB API key in password-veld met show/hide toggle
- Server error responses bevatten generieke meldingen (geen interne details)

### UX patronen
- `showToast(message, undoFn)` voor feedback bij acties; met optionele undo-callback (5s timeout)
- Destructieve acties (verwijderen, watch toggle) hebben `confirm()` + toast met undo-optie
- `updateFilterBadge()` toont een gouden dot op de Filter-knop + "reset" knop bij actieve filters
- Escape key sluit alle modals/overlays (centralized handler)
- `render()` bewaart scroll positie via `window.scrollY`
- `@media (prefers-reduced-motion: reduce)` schakelt alle animaties uit
- Card-beschrijvingen afgekapt op 3 regels (grid, 2 op mobiel) / 2 regels (list, 1 op mobiel); klik poster of tekst om uit te vouwen
- Klik op "Mijn Kijklijst" h1 reset alle filters + zoekveld
- Na toevoegen van titel: zoekbalk wordt gevuld met de titel zodat alleen die card zichtbaar is
- Search clear-knop (✕) naast het zoekveld op desktop
- Na bulk import worden alleen de net toegevoegde titels getoond; bij elke gebruikersinteractie verdwijnt dit filter

### IMDb auto-linking
- `IMDB` object in `data.js` mapt titels → IMDb IDs
- `fetchImdbId(tmdbId, mediaType)` haalt IMDb ID op via TMDB `/external_ids` endpoint
- Bij single add via TMDB: IMDb ID wordt op de achtergrond opgehaald en opgeslagen
- Bij bulk import: IMDb ID per titel opgehaald tijdens lookup
- `backfillImdbIds()` draait 3s na init; gebruikt opgeslagen `tmdbId` wanneer beschikbaar, valt terug op titel-zoekopdracht
- `searchTmdbTyped()` zoekt type-specifiek (`/search/movie` of `/search/tv`)
- `bestTmdbMatch()` matcht op jaar (exact → ±1 → titel-match) om foute matches te voorkomen

### Data formaat (data.js)
```javascript
{ t: "Titel", y: "2024", type: "film"|"serie", lang: "Engels", d: "Beschrijving", img: "poster-url", g: "Genre1, Genre2", tmdbId: 12345 }
```
Alle velden behalve `t` en `type` zijn optioneel. `tmdbId` wordt automatisch opgeslagen bij TMDB-toevoegingen en gebruikt voor efficiëntere IMDb backfill.

### Genre systeem
17 vaste genres met emoji-mapping in `GENRE_ICONS`. Nieuwe genres worden automatisch ondersteund maar krijgen 🎬 als fallback-icoon.

### Taal mapping
TMDB taalcodes → Nederlandse namen in `mapTmdbLang()`. Voeg nieuwe talen daar toe.

## Service Worker

- Versie bijhouden in `CACHE_VERSION` (sw.js regel 1)
- **Bump na elke wijziging** aan static assets → verander `'kijklijst-v8'` naar `'kijklijst-v9'` etc.
- `data.js` staat **niet** in STATIC_ASSETS (verandert bij elke add/remove)
- Cache strategieën:
  - Static assets (excl. data.js) → cache-first
  - Google Fonts → cache-first
  - Poster images (media-amazon.com, tmdb.org) → network-first met cache fallback
  - `/api/*` endpoints → altijd netwerk (nooit gecached)
  - TMDB API calls → altijd netwerk

## Veelvoorkomende taken

### Nieuwe feature toevoegen
1. HTML in `index.html` (overlay/modal als nodig)
2. CSS in `css/style.css` (volg glassmorphism pattern)
3. JS in `js/app.js` (state via `debouncedSyncState()`, render in `render()`, user-data via `escapeHtml()`)
4. Bump `CACHE_VERSION` in `sw.js`
5. Toast feedback via `showToast()` bij gebruikersacties

### Nieuw genre toevoegen
Voeg emoji toe aan `GENRE_ICONS` in app.js. Zonder mapping werkt het alsnog (fallback 🎬).

### Responsive aanpassingen
Grid: 5 kolommen desktop, 2 kolommen mobiel (≤600px). Posters in staand formaat (aspect-ratio 2/3).
Breakpoints: `@media (max-width: 600px)` en `@media (max-width: 380px)` onderaan style.css.

## Niet doen

- **Geen npm/node_modules** — dit is een zero-dependency project
- **Geen data.js committen** — bevat persoonlijke titels, staat in .gitignore
- **Geen state.json committen** — bevat persoonlijke state, staat in .gitignore
- **Geen API keys in code** — TMDB key zit in `state.json` (server-synced) en localStorage
- **Geen externe CSS/JS** — behalve Google Fonts CDN
- **Geen state.json of localStorage wissen** zonder backup — dat is alle gebruikersdata
