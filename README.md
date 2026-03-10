# Mijn Kijklijst

Een persoonlijke film- en serie-tracker als Progressive Web App (PWA). Geen account nodig, zero dependencies. Titels worden gesynchroniseerd naar `data.js` via een lokale Python server; persoonlijke voorkeuren (gezien-status, ratings, volgorde) worden via de server opgeslagen in `state.json` zodat alle apparaten dezelfde state delen.

![Tech](https://img.shields.io/badge/stack-HTML%20%2B%20CSS%20%2B%20Vanilla%20JS-blue)
![PWA](https://img.shields.io/badge/PWA-installeerbaar-green)
![Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)

---

## Inhoudsopgave

- [Starten](#starten)
- [Installeren als app](#installeren-als-app)
- [Features](#features)
  - [Films & series beheren](#films--series-beheren)
  - [Filters & zoeken](#filters--zoeken)
  - [Sorteren](#sorteren)
  - [Weergave](#weergave)
  - [Persoonlijke rating](#persoonlijke-rating)
  - [Random picker](#random-picker)
  - [Drag-and-drop volgorde](#drag-and-drop-volgorde)
  - [TMDB auto-complete](#tmdb-auto-complete)
  - [Bulk import](#bulk-import)
  - [Detail overlay](#detail-overlay)
  - [Aanbevelingen](#aanbevelingen)
- [TMDB API key instellen](#tmdb-api-key-instellen)
- [OMDB API key instellen](#omdb-api-key-instellen)
- [Dataopslag](#dataopslag)
- [Projectstructuur](#projectstructuur)
- [Technische details](#technische-details)
- [Veelgestelde vragen](#veelgestelde-vragen)

---

## Starten

### Eerste keer (na clonen)

```bash
git clone https://github.com/JOUW-USERNAME/kijklijst.git
cd kijklijst
cp js/data.example.js js/data.js
```

`data.js` bevat je persoonlijke titels en staat in `.gitignore` — deze wordt niet meegecommit. Het voorbeeldbestand bevat een handvol titels om mee te starten. Voeg je eigen films en series toe via de app (+ knop) of bewerk `data.js` handmatig.

### Server starten

De app draait via een simpele lokale webserver. Python 3 is het enige vereiste (standaard aanwezig op macOS en de meeste Linux-systemen).

### Optie 1: Start-script (aanbevolen)

```bash
cd /pad/naar/kijklijst
./start.sh
```

Dit start een server op **port 8420** en opent automatisch je browser.

### Optie 2: macOS dubbelklik

Dubbelklik op `start.command` in Finder. Dit start de server op **port 8420** en opent Chrome. In de terminal verschijnt het adres voor mobiel gebruik (bijv. `http://192.168.x.x:8420`).

> **Eigen icoon instellen:** Rechtermuisklik op `start.command` → **Toon info** (⌘I) → klik op het icoon linksboven → plak een afbeelding met ⌘V. Gebruik bijv. `icons/icon-512.png` uit het project (open in Preview → ⌘A → ⌘C) voor hetzelfde icoon als de PWA.

### Optie 3: Windows

Dubbelklik op `start.bat`, of open een terminal:

```cmd
cd pad\naar\kijklijst
python server.py
```

> **Let op:** Op Windows heet het commando vaak `python` in plaats van `python3`.

### Optie 4: Handmatig (macOS/Linux)

```bash
cd /pad/naar/films
python3 server.py 8000
```

Open daarna `http://localhost:8000` in je browser.

> **Mobiel?** Voeg `--lan` toe (bijv. `python3 server.py --lan` of `./start.sh --lan`) om de app bereikbaar te maken vanaf je telefoon of tablet op hetzelfde wifi-netwerk.

> **Tip:** Je kunt ook gewoon `index.html` openen als bestand, maar dan werken de service worker, TMDB-zoekfunctie, auto-sync en state-synchronisatie niet. Titels worden dan wél getoond, maar wijzigingen worden alleen in localStorage opgeslagen.

---

## Installeren als app

Omdat het een PWA is, kun je de kijklijst als "echte" app installeren:

| Platform | Hoe |
|----------|-----|
| **Chrome / Edge** | Klik op het **⊕** icoon in de adresbalk → "Installeren" |
| **Safari (iOS)** | Deel-knop → "Zet op beginscherm" |
| **Android (Chrome)** | Menu (⋮) → "App installeren" |

Na installatie opent de app fullscreen zonder adresbalk.

---

## Features

### Films & series beheren

**Toevoegen:**
1. Klik op de **+** knop in de header (naast de statistieken)
2. Typ een titel — als je een TMDB API key hebt ingesteld, verschijnen automatisch suggesties
3. Selecteer een suggestie (vult alle velden automatisch in) of typ handmatig
4. Kies "Film" of "Serie"
5. Klik "Toevoegen"

**Gezien markeren:**
- Open de detail overlay (klik op een card) en klik "○ Markeer als gezien"
- De card wordt gedempt weergegeven met een groen ✓ vinkje
- Klik nogmaals om de markering ongedaan te maken
- Bij elke actie verschijnt een toast-melding met **"Ongedaan maken"** optie

**Verwijderen:**
- Open de detail overlay en klik "✕ Verwijderen"
- Een bevestigingsdialoog verschijnt, gevolgd door een toast-melding met **"Ongedaan maken"** knop (5 seconden)
- Het item wordt volledig verwijderd (inclusief rating en watch-status)

**Links:**
- **IMDb** — opent de IMDb-pagina van de titel (IMDb IDs worden automatisch opgehaald via TMDB)
- **Waar te kijken** — zoekt op JustWatch waar je de titel kunt streamen in Nederland

**Titel als reset:**
- Klik op "Mijn Kijklijst" in de header om alle filters en het zoekveld te resetten

### Filters & zoeken

| Filter | Werking |
|--------|---------|
| **Type** | Alles / Films / Series — klik de knoppen in de controls-balk |
| **Status** | Alles / Niet gezien / Gezien |
| **Genre** | Dropdown met alle genres + aantallen |
| **Taal** | Dropdown met alle talen + aantallen |
| **Zoeken** | Vrij tekstveld — filtert direct op titel (250ms vertraging). Bij geen resultaten: "Zoek in TMDB →" link. Bij actieve filters zonder resultaten: "Filters resetten" knop |

**Shortcut:** klik op de statistiek-pills in de header ("65 films", "19 series", "5 gezien") om direct te filteren op die categorie.

**Reset filters:** bij actieve filters verschijnt een "reset" knop in het filterpaneel + een gouden indicator-dot op de "Filters" knop (mobiel).

De genre- en taaldropdowns tonen dynamisch hoeveel resultaten er per optie zijn, rekening houdend met de actieve filters.

### Sorteren

| Optie | Beschrijving |
|-------|-------------|
| **Titel A-Z** | Alfabetisch op titel |
| **Titel Z-A** | Omgekeerd alfabetisch |
| **Jaar (nieuw → oud)** | Nieuwste eerst |
| **Jaar (oud → nieuw)** | Oudste eerst |
| **Mijn volgorde** | Handmatige volgorde via drag-and-drop |
| **Rating (hoog → laag)** | Hoogst gewaardeerde eerst (persoonlijke sterren) |
| **IMDb (hoog → laag)** | Hoogste IMDb-score eerst |
| **IMDb (laag → hoog)** | Laagste IMDb-score eerst |
| **Rotten Tomatoes (hoog → laag)** | Hoogste RT-score eerst |
| **Rotten Tomatoes (laag → hoog)** | Laagste RT-score eerst |

### Weergave

Schakel tussen twee weergaven met de knoppen rechts in de controls-balk:

- **▦ Grid** — compacte kaarten in een 6-koloms raster met staande posters (2:3), titel en scores. Klik op een card voor alle details
- **☰ Lijst** — rijen met kleine poster, titel, beschrijving en acties op één lijn

De voorkeur wordt onthouden tussen sessies.

### Persoonlijke rating

Na het markeren van een titel als "gezien" verschijnen er interactieve sterren:

- **Klik op een ster** om een rating te geven (1-5)
- **Klik op de linkerhelft** van een ster voor een halve ster (bijv. 3.5)
- **Rating wijzigen:** klik gewoon op een andere ster
- **Review:** na het geven van een rating verschijnt een tekstveld voor een korte one-liner (max 120 tekens)

Bij een **5-sterren rating** verschijnt een gouden sparkle-animatie over de card.

### Random picker

Weet je niet wat je wilt kijken? Klik op **🎲 Random** in de controls-balk.

1. Een slot-machine-animatie draait door willekeurige posters van onbekeken titels
2. De animatie vertraagt en stopt bij een willekeurige titel
3. Je ziet de volledige info: poster, titel, jaar, type, taal, genres en beschrijving
4. Je ziet links naar **IMDb** en **Waar te kijken** (JustWatch) om direct te checken waar het beschikbaar is
5. Keuze uit:
   - **🎲 Nog een** — draait opnieuw
   - **Sluiten** — terug naar de lijst (of druk op Escape)
   - *Al gezien? Markeer als gezien* — subtiele link onderaan om direct als gezien te markeren (met undo-toast)

Als alles al gezien is, toont de picker: "Alles al gezien! 🎉"

### Drag-and-drop volgorde

Maak je eigen volgorde aan:

1. Kies **"Mijn volgorde"** in het sorteer-dropdown
2. **Desktop:** sleep kaarten naar een nieuwe positie
3. **Mobiel:** houd een kaart 0.5 seconde ingedrukt, sleep dan naar de gewenste positie
4. De volgorde wordt automatisch opgeslagen

Drag-and-drop is alleen actief als "Mijn volgorde" geselecteerd is.

### TMDB auto-complete

Met een (gratis) TMDB API key kun je bij het toevoegen van titels automatisch zoeken in de TMDB-database:

- Typ minimaal 2 tekens → na 0.4 seconde verschijnen resultaten
- Elk resultaat toont: poster-thumbnail, titel, jaar en type (Film/Serie)
- Klik op een resultaat → alle velden worden automatisch ingevuld:
  - Titel, jaar, type, taal, genres, beschrijving en poster-afbeelding
- Je kunt de ingevulde gegevens nog aanpassen voordat je op "Toevoegen" klikt
- Na toevoegen wordt de zoekbalk automatisch gevuld met de titel, zodat je direct je nieuwe toevoeging ziet

**Zonder API key** werkt handmatig toevoegen gewoon — je typt dan zelf de titel en kiest het type.

### Bulk import

Heb je een lijst met titels (bijv. uit een spreadsheet of kladblok)? Importeer ze in één keer:

1. Klik op **+** → klik onderaan op **"📋 Lijst importeren"**
2. Plak je titels (één per regel) in het tekstveld
3. Klik **"Importeren"** — elke titel wordt opgezocht in TMDB (voortgangsbalk zichtbaar)
4. **Review:** bekijk de resultaten — per titel zie je:
   - **Gevonden:** poster, titel, jaar, type — standaard aangevinkt
   - **Al in je lijst:** gedempt weergegeven, niet aangevinkt
   - **Niet gevonden:** rood label, niet aangevinkt
5. Pas je selectie aan en klik **"Toevoegen"**

Je kunt het importproces halverwege annuleren — de tot-dan-toe opgehaalde resultaten worden dan getoond in het review-scherm.

> **Tip:** de bulk import is ook bereikbaar via een knop in de lege state (als je nog geen titels hebt).

### Detail overlay

Klik op een willekeurige card (grid of lijst) om de detail overlay te openen met alle info:

- Grote poster met type-badge
- Titel, jaar en taal
- IMDb rating en Rotten Tomatoes score (als OMDB key ingesteld)
- Genre-badges
- Volledige beschrijving
- Links naar **IMDb** en **Waar te kijken** (JustWatch)
- **Markeer als gezien** / **Verwijderen** knoppen
- Interactieve sterrenrating + review (bij gezien-status)

Sluiten: klik op **✕**, druk **Escape**, of klik buiten de modal.

### Aanbevelingen

Klik op **🎯 Tips** in de filterbalk voor gepersonaliseerde aanbevelingen:

1. De app selecteert je hoogst gewaardeerde titels als "seeds"
2. Per seed worden aanbevelingen opgehaald via TMDB
3. Je ziet een lijst van 20 aanbevelingen met poster, titel, TMDB-score, genre-tags en de seed ("Vanwege X")
4. Klik op een poster of titel om de TMDB-pagina te bekijken
5. Klik **+** om een aanbeveling direct toe te voegen aan je lijst
6. Klik de **shuffle-knop** voor een andere selectie uit dezelfde pool

Na het sluiten van de overlay worden alleen de net-toegevoegde titels getoond.

> **Vereist:** een TMDB API key en minstens een paar titels met 3+ sterren.

---

## TMDB API key instellen

De TMDB (The Movie Database) API is gratis voor persoonlijk gebruik. Zo stel je het in:

### Stap 1: Account aanmaken

1. Ga naar [themoviedb.org](https://www.themoviedb.org/)
2. Klik op "Join TMDB" (rechtsboven) en maak een gratis account aan
3. Bevestig je e-mailadres

### Stap 2: API key aanvragen

1. Log in en ga naar [API-instellingen](https://www.themoviedb.org/settings/api)
2. Klik op "Create" → kies **"Developer"**
3. Accepteer de voorwaarden
4. Vul het formulier in:
   - **Applicatienaam:** `Kijklijst` (of wat je wilt)
   - **Applicatie-URL:** `https://localhost` (dit wordt geaccepteerd)
   - **Soort gebruik:** `Personal`
   - **Applicatiesamenvatting:** bijv. "Persoonlijke kijklijst-app"
   - De overige velden: vul je eigen gegevens in
5. Klik op "Submit"
6. Je krijgt direct een **API Key** te zien — kopieer deze

### Stap 3: Key invoeren in de app

1. Open de kijklijst-app
2. Klik op het **⚙** tandwiel-icoon in de header
3. Plak je API key in het TMDB-veld en klik "Opslaan"

De key wordt opgeslagen in je browser (`localStorage`) én gesynchroniseerd naar de server via `state.json`, zodat alle apparaten dezelfde key delen.

> **Let op:** TMDB vereist dat je hun logo toont bij gebruik van hun data. Meer info op [themoviedb.org/about/logos-attribution](https://www.themoviedb.org/about/logos-attribution).

---

## OMDB API key instellen

Met een (gratis) OMDB API key toont de app **IMDb ratings** en **Rotten Tomatoes scores** (🍅) op je cards.

### Stap 1: Key aanvragen

1. Ga naar [omdbapi.com/apikey.aspx](https://www.omdbapi.com/apikey.aspx)
2. Kies het **Free** plan (1.000 requests per dag)
3. Vul je e-mailadres in en klik "Submit"
4. Bevestig je e-mailadres — je ontvangt je API key per mail

### Stap 2: Key invoeren in de app

1. Open de kijklijst-app
2. Klik op het **⚙** tandwiel-icoon in de header
3. Plak je OMDB API key in het tweede veld en klik "Opslaan"

Na het opslaan worden IMDb ratings en RT scores automatisch opgehaald voor alle titels met een IMDb ID. Scores worden ook automatisch opgehaald bij het opstarten van de app (5 seconden na init). Scores worden gecached in je browser.

De IMDb rating wordt getoond als een gele "IMDb" badge op de card, de RT score als 🍅 percentage. Je kunt ook sorteren op IMDb-score of RT-score via het sorteer-dropdown.

**Zonder OMDB key** werkt alles gewoon — er worden dan alleen geen IMDb/RT scores getoond.

---

## Dataopslag

De app slaat data op drie plekken op:

**`js/data.js` — je titels (single source of truth)**

Alle films en series staan in het `DATA` array in `data.js`. Wanneer je een titel toevoegt of verwijdert via de app, wordt dit bestand automatisch bijgewerkt door `server.py`. Dit betekent dat je titels bewaard blijven, zelfs als je browserdata wist.

**`state.json` — persoonlijke voorkeuren (gedeeld tussen apparaten)**

Gezien-status, ratings, sorteervolgorde, TMDB API key en OMDB API key worden via de server opgeslagen in `state.json`. Dit bestand wordt automatisch aangemaakt en bijgewerkt. Doordat alle apparaten dezelfde server gebruiken, delen ze dezelfde state.

**`localStorage` — fallback en device-specifieke voorkeuren**

| Sleutel | Wat het opslaat |
|---------|----------------|
| `kijklijst_view` | Weergavevoorkeur grid/list (bewust device-specifiek) |
| `kijklijst_watched` | Fallback gezien-status (als server niet bereikbaar) |
| `kijklijst_ratings` | Fallback ratings (als server niet bereikbaar) |
| `kijklijst_order` | Fallback sorteervolgorde (als server niet bereikbaar) |
| `kijklijst_tmdb_key` | TMDB key (ook gesynced naar server via `state.json`) |
| `kijklijst_omdb_key` | OMDB key (ook gesynced naar server via `state.json`) |
| `kijklijst_rt_scores` | Gecachte IMDb ratings + Rotten Tomatoes scores per IMDb ID |

Bij opstart haalt de app state op van de server. Als de server leeg is (eerste keer), wordt de huidige localStorage geseeded naar de server.

### Backup maken

Je titels staan in `data.js` en je voorkeuren in `state.json` — kopieer beide bestanden voor een volledige backup.

---

## Projectstructuur

```
├── index.html            # Hoofd-HTML (alle overlays en modals)
├── css/
│   └── style.css         # Alle styling (responsive, animaties, dark theme)
├── js/
│   ├── data.js           # Jouw persoonlijke titels (NIET in git)
│   ├── data.example.js   # Template met voorbeeldtitels (WEL in git)
│   └── app.js            # Applicatielogica (alle features)
├── icons/
│   ├── icon-192.png      # PWA-icoon (192×192)
│   └── icon-512.png      # PWA-icoon (512×512)
├── favicon.ico           # Browser-tabblad icoon
├── manifest.json         # PWA-configuratie
├── server.py             # Lokale Python server (titels + state sync)
├── state.json            # Persoonlijke state: watched, ratings, order, tmdb_key, omdb_key (NIET in git)
├── sw.js                 # Service Worker (offline caching)
├── start.sh              # Start-script Linux/macOS (port 8420)
├── start.command         # macOS dubbelklik-script (port 8420)
├── start.bat             # Windows start-script (port 8420)
├── .gitignore            # Houdt data.js, state.json en .DS_Store uit git
├── CLAUDE.md             # Development guide (voor AI-assistenten)
└── README.md             # Dit bestand
```

---

## Technische details

### Stack

| Laag | Technologie |
|------|-------------|
| Markup | HTML5 + PWA meta-tags |
| Styling | Vanilla CSS (custom properties, grid, flexbox, keyframe-animaties) |
| Logica | Vanilla JavaScript (geen frameworks of libraries) |
| Fonts | Google Fonts (Inter, Monoton) |
| API | TMDB API v3 (optioneel, auto-complete) + OMDB API (optioneel, IMDb ratings + Rotten Tomatoes scores) |
| Server | Python 3 custom server (`server.py`) met sync naar `data.js` en `state.json` |

**Nul dependencies.** Geen npm, geen build-stap, geen node_modules.

### Service Worker caching

| Bron | Strategie |
|------|-----------|
| Statische bestanden (HTML, CSS, JS) | Cache-first, fallback naar netwerk (`data.js` uitgezonderd — altijd via netwerk) |
| Google Fonts | Cache-first (veranderen zelden) |
| Poster-afbeeldingen (Amazon/TMDB) | Network-first, fallback naar cache |
| `/api/*` endpoints | Altijd netwerk (nooit gecached) |
| TMDB API-calls | Altijd netwerk (nooit gecached) |
| OMDB API-calls | Altijd netwerk (nooit gecached) |

Na de eerste keer laden werkt de app volledig offline (behalve TMDB-zoeken en nieuwe poster-afbeeldingen).

### Responsive breakpoints

| Breedte | Aanpassing |
|---------|-----------|
| > 900px | Desktop: 6-koloms grid, zijdelingse controls |
| ≤ 900px | Tablet: 4-koloms grid |
| ≤ 600px | Mobiel: 2-koloms grid, inklapbare filters, standaard list view, grotere touch-targets (44-48px) |
| ≤ 380px | Kleine telefoons: 2-koloms grid |

### Data-formaat

Elk item in de database:

```javascript
{
  t: "Titel",               // Titel (verplicht)
  type: "film" | "serie",   // Type (verplicht)
  y: "2024",                // Jaar (optioneel)
  g: "Drama, Komedie",      // Genres, komma-gescheiden (optioneel)
  d: "Beschrijving...",     // Korte beschrijving (optioneel)
  lang: "Engels",           // Originele taal (optioneel)
  img: "https://..."        // Poster-URL (optioneel)
}
```

---

## Veelgestelde vragen

**Kan ik de app gebruiken zonder TMDB API key?**
Ja. Alle features werken behalve de auto-complete bij het toevoegen. Je vult dan handmatig de titel en type in.

**Waar staat mijn data?**
Je titels staan in `js/data.js` en je voorkeuren (gezien-status, ratings, volgorde) in `state.json` — beide worden automatisch bijgewerkt door de server. localStorage dient als fallback wanneer de server niet bereikbaar is. Je kunt je browserdata wissen zonder dataverlies, zolang de server draait.

**Kan ik de app op mijn telefoon gebruiken?**
Ja. Dubbelklik op `start.command` (macOS) — LAN-modus is standaard ingeschakeld. In de terminal verschijnt het adres voor je telefoon, bijv.:

```
📱 Op je telefoon of tablet:
   Open http://192.168.1.42:8420
   (zelfde wifi-netwerk)
```

Open dat adres op je telefoon en je kunt de app ook installeren als PWA via "Zet op beginscherm" in Safari.

> **Handmatig starten?** Gebruik `python3 server.py --lan` of `./start.sh --lan` om LAN-modus in te schakelen. Zonder `--lan` luistert de server alleen op localhost.

**Hoe voeg ik meer films toe aan de standaard-database?**
Bewerk `js/data.js` en voeg items toe aan het `DATA`-array. Volg het bestaande formaat. IMDb IDs worden automatisch opgehaald via TMDB bij de eerstvolgende paginalading (backfill).

**De service worker cachet een oude versie. Hoe forceer ik een update?**
Verhoog `CACHE_VERSION` in `sw.js` (bijv. van `kijklijst-v13` naar `kijklijst-v14`). Bij de volgende paginalading wordt de oude cache verwijderd.

**Kan ik de app delen met anderen?**
Ja, clone de repository en volg de instructies bij [Starten](#starten). De ander kopieert `data.example.js` naar `data.js` en begint met een lege lijst. Alle titels die ze toevoegen via de app worden automatisch opgeslagen in hun eigen `data.js`.
