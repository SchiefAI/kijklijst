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
css/style.css       → Alle styling (één bestand, ~2228 regels)
js/data.js          → Persoonlijke titels + IMDB mapping (NIET in git)
js/data.example.js  → Template met voorbeeldtitels (WEL in git)
js/app.js           → Alle applicatielogica (~2163 regels)
server.py           → Lokale Python server met /api/save en /api/state endpoints
state.json          → User state: watched, ratings, order, tmdb_key, omdb_key (NIET in git)
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
- `state.json` bevat user state (watched, ratings, volgorde, tmdb_key, omdb_key) — gedeeld tussen alle apparaten
- `server.py` draait als lokale HTTP server (standaard `127.0.0.1`, met `--lan` vlag op `0.0.0.0` voor mobiele toegang) en biedt:
  - `POST /api/save` — schrijft data.js bij (titels toevoegen/verwijderen)
  - `GET /api/state` — leest state.json; whitelist: watched, ratings, order, tmdb_key, omdb_key
  - `POST /api/state` — schrijft state.json bij; whitelist: watched, ratings, order, tmdb_key, omdb_key
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
| State vars + save functies + debouncedSyncState/loadState | ~16-93 |
| Helpers (hashColor, getKey, escapeHtml, imdbUrl, jwUrl) | ~95-163 |
| Star rating HTML helpers + ratingBlockHtml | ~165-213 |
| View mode (grid/list) | ~215-222 |
| DOM refs | ~224-236 |
| populateDropdowns() (single-pass) | ~238-265 |
| Dynamic dropdown counts | ~267-308 |
| Toast notifications (showToast + undo) | ~310-332 |
| Render (central, incl. empty-state + filter hints + scores) | ~334-510 |
| Card click → openDetail() | ~512-522 |
| toggleWatch (met confirm + toast + undo) | ~524-563 |
| removeItem (met confirm + toast + undo) | ~565-598 |
| updateStats | ~600-607 |
| Star rating interaction | ~597-645 |
| Sparkle effect (5 sterren) | ~647-664 |
| Filters (type, status, genre, lang, sort, view toggle) | ~666-700 |
| Mobile filter toggle | ~702-727 |
| Stat pills als filter shortcuts | ~729-759 |
| resetFilters() + resetFiltersKeepSearch() | ~729-770 |
| Search input + clear button | ~760-777 |
| Hero poster mosaic builder | ~772-798 |
| Add title modal + TMDB + IMDb fetch | ~799-888 |
| Random picker | ~889-1015 |
| Drag-and-drop (desktop + touch) + reorderCustomOrder | ~1016-1158 |
| Settings gear button + openSettings() | ~1160-1252 |
| TMDB auto-complete (searchTmdb, mapTmdbLang) | ~1160-1332 |
| Bulk import (searchTmdbSingle, buildItemFromTmdb, fetchImdbId) | ~1334-1579 |
| Filter badge (updateFilterBadge) | ~1581-1593 |
| Centralized Escape key handler | ~1595-1608 |
| Service Worker registratie | ~1606-1617 |
| IMDb backfill (searchTmdbTyped, bestTmdbMatch, backfillImdbIds) | ~1619-1689 |
| RT + IMDb scores via OMDB (fetchRtScore, backfillRtScores) | ~1691-1739 |
| refreshAllFromTmdb (one-time TMDB description refresh) | ~1741-1774 |
| Recommendations (getTopRatedSeeds, fetchAndShowRecs, openRecs, addFromRecs) | ~1776-2015 |
| Detail overlay (openDetail, closeDetail, detail event handlers) | ~2017-2137 |
| Scroll to top + sticky controls | ~2139-2148 |
| Init + loadState + backfill trigger | ~2150-2163 |

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
- Server-side whitelist: alleen `watched`, `ratings`, `order`, `tmdb_key`, `omdb_key` worden opgeslagen/uitgelezen
- TMDB API key wordt gesynchroniseerd via `state.json` (gedeeld tussen apparaten) en opgeslagen in localStorage
- OMDB API key wordt gesynchroniseerd via `state.json` (gedeeld tussen apparaten) en opgeslagen in localStorage
- TMDB en OMDB API keys in password-velden met show/hide toggle
- Server error responses bevatten generieke meldingen (geen interne details)

### UX patronen
- `showToast(message, undoFn)` voor feedback bij acties; met optionele undo-callback (5s timeout)
- Destructieve acties (verwijderen, watch toggle) hebben `confirm()` + toast met undo-optie
- `updateFilterBadge()` toont een gouden dot op de Filter-knop + "reset" knop bij actieve filters
- Escape key sluit alle modals/overlays (centralized handler)
- `render()` bewaart scroll positie via `window.scrollY`
- `@media (prefers-reduced-motion: reduce)` schakelt alle animaties uit
- Grid cards tonen alleen poster + titel + jaar/scores; klik opent detail overlay met volledige info
- Detail overlay: twee-koloms layout (poster + info), collapst naar single-column op mobiel; bevat metadata, scores, genres, beschrijving, IMDb/JustWatch links, watch/remove acties en interactieve sterrenrating
- List view cards tonen nog volledige info (beschrijving, links, acties, rating)
- Klik op "Mijn Kijklijst" h1 reset alle filters + zoekveld
- Na toevoegen van titel: zoekbalk wordt gevuld met de titel zodat alleen die card zichtbaar is
- Search clear-knop (✕) naast het zoekveld op desktop
- Na bulk import of aanbevelingen-toevoeging worden alleen de net toegevoegde titels getoond; bij elke gebruikersinteractie verdwijnt dit filter
- IMDb rating (gele badge) en RT score (🍅) getoond op cards wanneer OMDB key geconfigureerd; scores gecached in localStorage (`kijklijst_rt_scores`)
- Filterbalk is sticky (plakt bovenaan bij scrollen); `.controls-sticky` wrapper met `.stuck` class voor shadow-effect
- Aanbevelingen modal (🎯 Tips): toont seed-attributie ("Vanwege X"), genre-tags, klikbare posters/titels (TMDB link) en shuffle-knop

### IMDb auto-linking
- `IMDB` object in `data.js` mapt titels → IMDb IDs
- `fetchImdbId(tmdbId, mediaType)` haalt IMDb ID op via TMDB `/external_ids` endpoint
- Bij single add via TMDB: IMDb ID wordt op de achtergrond opgehaald en opgeslagen
- Bij bulk import: IMDb ID per titel opgehaald tijdens lookup
- `backfillImdbIds()` draait 3s na init; gebruikt opgeslagen `tmdbId` wanneer beschikbaar, valt terug op titel-zoekopdracht
- `searchTmdbTyped()` zoekt type-specifiek (`/search/movie` of `/search/tv`)
- `bestTmdbMatch()` matcht op jaar (exact → ±1 → titel-match) om foute matches te voorkomen

### Scores via OMDB (RT + IMDb)
- Scores opgehaald via OMDB API (`omdbapi.com`) op basis van IMDb ID
- `fetchRtScore(imdbId)` retourneert een object `{ rt: "85%", imdb: "7.4" }` (beide optioneel)
- IMDb rating getoond op cards als gele "IMDb" badge (naast RT score); RT score in lichtgrijs (`var(--text-dim)`)
- `backfillRtScores()` draait automatisch 5s na init + bij opslaan van OMDB key; haalt scores op voor titels zonder score of met oud string-formaat
- Scores gecached in localStorage (`kijklijst_rt_scores`) als `{ imdbId: { rt: "85%", imdb: "7.4" } }` object; oude string-waarden worden automatisch ge-upgrade
- Sorteeropties: IMDb (hoog→laag / laag→hoog) en Rotten Tomatoes (hoog→laag / laag→hoog)
- OMDB key gesynchroniseerd via `state.json` (net als TMDB key)

### Aanbevelingen (Recommendations)
- `🎯 Tips` knop in filterbalk opent recommendations modal
- `getTopRatedSeeds(minStars)` selecteert top 8 titels met hoogste rating; drempel verlaagt automatisch (4 → 3.5 → 3)
- `getRatingStars(key)` helper extraheert numerieke waarde uit rating object `{ stars: number, review?: string }`
- `ensureTmdbIds(seeds)` zoekt ontbrekende tmdbIds op via TMDB voordat aanbevelingen worden opgehaald
- Per seed: TMDB `/movie/{id}/recommendations` of `/tv/{id}/recommendations`
- Deduplicatie: bestaande titels via `getKey()` + duplicaten via tmdbId
- Elke aanbeveling toont seed-attributie ("Vanwege X"), TMDB score en genre-tags (max 3)
- `recsAllResults` bewaart volledige pool in-memory; shuffle-knop (🔄) reshufflet zonder nieuwe API calls
- Per-item "+" knop → `buildItemFromTmdb()` → `fetchImdbId()` → `syncToFile()`

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
- **Bump na elke wijziging** aan static assets → huidige versie: `'kijklijst-v25'`
- `data.js` staat **niet** in STATIC_ASSETS (verandert bij elke add/remove)
- Cache strategieën:
  - Static assets (excl. data.js) → cache-first
  - Google Fonts → cache-first
  - Poster images (media-amazon.com, tmdb.org) → network-first met cache fallback
  - `/api/*` endpoints → altijd netwerk (nooit gecached)
  - TMDB API calls → altijd netwerk
  - OMDB API calls → altijd netwerk

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
Grid: 6 kolommen desktop, 4 kolommen tablet (≤900px), 2 kolommen mobiel (≤600px). Posters in staand formaat (aspect-ratio 2/3).
Breakpoints: `@media (max-width: 900px)`, `@media (max-width: 600px)` en `@media (max-width: 380px)` in style.css.

## Niet doen

- **Geen npm/node_modules** — dit is een zero-dependency project
- **Geen data.js committen** — bevat persoonlijke titels, staat in .gitignore
- **Geen state.json committen** — bevat persoonlijke state, staat in .gitignore
- **Geen API keys in code** — TMDB en OMDB keys zitten in `state.json` (server-synced) en localStorage
- **Geen externe CSS/JS** — behalve Google Fonts CDN
- **Geen state.json of localStorage wissen** zonder backup — dat is alle gebruikersdata
