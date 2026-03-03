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
css/style.css       → Alle styling (één bestand, ~1813 regels)
js/data.js          → Persoonlijke titels + IMDB mapping (NIET in git)
js/data.example.js  → Template met voorbeeldtitels (WEL in git)
js/app.js           → Alle applicatielogica (~1575 regels)
server.py           → Lokale Python server met /api/save en /api/state endpoints
state.json          → User state: watched, ratings, order, tmdb_key (NIET in git)
sw.js               → Service Worker (cache-first static, network-first posters)
manifest.json       → PWA manifest (standalone, dark theme)
icons/              → PWA iconen (192px, 512px)
start.sh            → Startscript (port 8420, via server.py)
start.command       → macOS dubbelklik-startscript (port 8420, via server.py)
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
| State vars + save functies + debouncedSyncState/loadState | ~16-84 |
| Helpers (hashColor, getKey, escapeHtml, imdbUrl, jwUrl) | ~86-142 |
| Star rating HTML helpers + ratingBlockHtml | ~143-192 |
| View mode (grid/list) | ~193-200 |
| populateDropdowns() (single-pass) | ~213-234 |
| Dynamic dropdown counts | ~236-277 |
| Toast notifications (showToast + undo) | ~287-307 |
| Render (central, incl. empty-state + filter hints) | ~309-464 |
| Card description expand/collapse (click handler) | ~466-469 |
| toggleWatch (met confirm + toast + undo) | ~472-500 |
| removeItem (met confirm + toast + undo) | ~501-540 |
| Star rating interaction | ~542-580 |
| Sparkle effect (5 sterren) | ~596-610 |
| Stat pills als filter shortcuts | ~647-660 |
| resetFilters() | ~664-674 |
| Hero poster mosaic builder | ~683-707 |
| Add title modal + TMDB + IMDb fetch | ~728-800 |
| Random picker | ~810-875 |
| Drag-and-drop (desktop + touch) + reorderCustomOrder | ~936-1060 |
| TMDB auto-complete (searchTmdb, mapTmdbLang) | ~1080-1210 |
| Bulk import (searchTmdbSingle, buildItemFromTmdb, fetchImdbId) | ~1229-1428 |
| Filter badge (updateFilterBadge) | ~1469-1475 |
| Centralized Escape key handler | ~1483-1484 |
| IMDb backfill (searchTmdbTyped, bestTmdbMatch, backfillImdbIds) | ~1491-1560 |
| Init + loadState + backfill trigger | ~1564-1575 |

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
- Server error responses bevatten generieke meldingen (geen interne details)
- TMDB API key in password-veld met show/hide toggle

### UX patronen
- `showToast(message, undoFn)` voor feedback bij acties; met optionele undo-callback (5s timeout)
- Destructieve acties (verwijderen, watch toggle) hebben `confirm()` + toast met undo-optie
- `updateFilterBadge()` toont een gouden dot op de Filter-knop + "reset" knop bij actieve filters
- Escape key sluit alle modals/overlays (centralized handler)
- `render()` bewaart scroll positie via `window.scrollY`
- `@media (prefers-reduced-motion: reduce)` schakelt alle animaties uit
- Card-beschrijvingen zijn afgekapt op 3 regels (grid) / 2 regels (list); klik om uit te vouwen
- Na toevoegen van titel: zoekbalk wordt gevuld met de titel zodat alleen die card zichtbaar is
- Search clear-knop (✕) naast het zoekveld op desktop

### IMDb auto-linking
- `IMDB` object in `data.js` mapt titels → IMDb IDs
- `fetchImdbId(tmdbId, mediaType)` haalt IMDb ID op via TMDB `/external_ids` endpoint
- Bij single add via TMDB: IMDb ID wordt op de achtergrond opgehaald en opgeslagen
- Bij bulk import: IMDb ID per titel opgehaald tijdens lookup
- `backfillImdbIds()` draait 3s na init; valideert alleen titels zonder IMDB entry
- `searchTmdbTyped()` zoekt type-specifiek (`/search/movie` of `/search/tv`)
- `bestTmdbMatch()` matcht op jaar (exact → ±1 → titel-match) om foute matches te voorkomen

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
- **Geen API keys in code** — TMDB key zit in state.json/localStorage
- **Geen externe CSS/JS** — behalve Google Fonts CDN
- **Geen state.json of localStorage wissen** zonder backup — dat is alle gebruikersdata
