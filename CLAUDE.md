# CLAUDE.md — Development Guide

## Project

**Mijn Kijklijst** is een persoonlijke film- en serie-watchlist PWA. Zero dependencies, vanilla HTML/CSS/JS, volledig offline bruikbaar. Alle gebruikersdata zit in localStorage.

## Quickstart

```bash
cp js/data.example.js js/data.js   # eenmalig
python3 -m http.server 8000        # of ./start.sh
# open http://localhost:8000
```

## Bestandsstructuur

```
index.html          → Hoofd-HTML, alle overlays/modals
css/style.css       → Alle styling (één bestand, ~900 regels)
js/data.js          → Persoonlijke titels + IMDB mapping (NIET in git)
js/data.example.js  → Template met voorbeeldtitels (WEL in git)
js/app.js           → Alle applicatielogica (~1040 regels)
sw.js               → Service Worker (cache-first static, network-first posters)
manifest.json       → PWA manifest (standalone, dark theme)
icons/              → PWA iconen (192px, 512px)
start.sh            → Startscript (port 8420)
start.command       → macOS dubbelklik-startscript (port 8000)
```

## Architectuur

### Data flow
- `data.js` bevat het `DATA` array (standaard-titels) en `IMDB` mapping object
- `app.js` laadt DATA, past hidden-items toe (localStorage), voegt custom-items toe
- Alle state (watched, ratings, custom titles, sort order, view mode, TMDB key) zit in localStorage
- `render()` is de centrale functie — filtert, sorteert en rendert de hele grid

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
| Hidden titles (localStorage) | Regels 1-14 |
| Custom titles | 16-23 |
| Watched/Ratings/Order state | 25-47 |
| TMDB key (localStorage) | 49-51 |
| Star rating HTML helpers | 106-151 |
| View mode (grid/list) | 153-159 |
| Dynamic dropdown counts | 195-236 |
| Render (central) | 238-362 |
| Star rating interaction | 409-446 |
| Sparkle effect (5 sterren) | 448-465 |
| Stat pills als filter shortcuts | 492-507 |
| Hero poster mosaic builder | 515-540 |
| Add title modal + TMDB | 542-1014 |
| Random picker | 612-721 |
| Drag-and-drop (desktop + touch) | 723-884 |
| TMDB auto-complete | 886-1027 |

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
- **Bump na elke wijziging** aan static assets → verander `'kijklijst-v2'` naar `'kijklijst-v3'` etc.
- Cache strategieën:
  - Static assets → cache-first
  - Google Fonts → cache-first
  - Poster images (media-amazon.com, tmdb.org) → network-first met cache fallback
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
Breakpoints: `@media (max-width: 600px)` en `@media (max-width: 380px)` onderaan style.css.

### Film reels (hero decoratie)
SVG film reels in index.html als `.film-reel--left` en `.film-reel--right`. Subtiele gouden tint, 50s rotatie. Hidden op mobiel (<600px).

## Niet doen

- **Geen npm/node_modules** — dit is een zero-dependency project
- **Geen data.js committen** — bevat persoonlijke titels, staat in .gitignore
- **Geen API keys in code** — TMDB key zit in localStorage
- **Geen externe CSS/JS** — behalve Google Fonts CDN
- **Geen localStorage wissen** zonder backup — dat is alle gebruikersdata
