# Mijn Kijklijst

Een persoonlijke film- en serie-tracker als Progressive Web App (PWA). Volledig offline bruikbaar, geen account nodig, alle data wordt lokaal opgeslagen in je browser.

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
- [TMDB API key instellen](#tmdb-api-key-instellen)
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

Dubbelklik op `start.command` in Finder. Dit start de server op **port 8000** en opent Chrome.

### Optie 3: Handmatig

```bash
cd /pad/naar/films
python3 -m http.server 8000
```

Open daarna `http://localhost:8000` in je browser.

> **Tip:** Je kunt ook gewoon `index.html` openen als bestand, maar de service worker en TMDB-zoekfunctie werken dan niet.

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
- Klik "○ Markeer als gezien" op een card
- De card wordt gedempt weergegeven met een groen ✓ vinkje
- Klik nogmaals om de markering ongedaan te maken

**Verwijderen:**
- Klik op het kleine **✕** knopje rechts van de IMDb/JustWatch links
- Bevestig met "OK" in de popup
- Het item wordt volledig verwijderd (inclusief rating en watch-status)

**Links:**
- **IMDb** — opent de IMDb-pagina van de titel
- **Waar te kijken** — zoekt op JustWatch waar je de titel kunt streamen in Nederland

### Filters & zoeken

| Filter | Werking |
|--------|---------|
| **Type** | Alles / Films / Series — klik de knoppen in de controls-balk |
| **Status** | Alles / Niet gezien / Gezien |
| **Genre** | Dropdown met alle genres + aantallen |
| **Taal** | Dropdown met alle talen + aantallen |
| **Zoeken** | Vrij tekstveld — filtert direct op titel (250ms vertraging) |

**Shortcut:** klik op de statistiek-pills in de header ("65 films", "19 series", "5 gezien") om direct te filteren op die categorie.

De genre- en taaldropdowns tonen dynamisch hoeveel resultaten er per optie zijn, rekening houdend met de actieve filters.

### Sorteren

| Optie | Beschrijving |
|-------|-------------|
| **Titel A-Z** | Alfabetisch op titel |
| **Titel Z-A** | Omgekeerd alfabetisch |
| **Jaar (nieuw → oud)** | Nieuwste eerst |
| **Jaar (oud → nieuw)** | Oudste eerst |
| **Mijn volgorde** | Handmatige volgorde via drag-and-drop |
| **Rating (hoog → laag)** | Hoogst gewaardeerde eerst |

### Weergave

Schakel tussen twee weergaven met de knoppen rechts in de controls-balk:

- **▦ Grid** — kaarten in een responsive raster met poster, beschrijving, genres en links
- **☰ Lijst** — compacte rijen met kleine poster, titel en acties op één lijn

De voorkeur wordt onthouden tussen sessies.

### Persoonlijke rating

Na het markeren van een titel als "gezien" verschijnen er interactieve sterren:

- **Klik op een ster** om een rating te geven (1-5)
- **Klik op de linkerhelft** van een ster voor een halve ster (bijv. 3.5)
- **Rating wijzigen:** klik gewoon op een andere ster
- **Review:** typ een korte one-liner in het tekstveld onder de sterren (max 120 tekens)

Bij een **5-sterren rating** verschijnt een gouden sparkle-animatie over de card.

### Random picker

Weet je niet wat je wilt kijken? Klik op **🎲 Random** in de controls-balk.

1. Een slot-machine-animatie draait door willekeurige posters van onbekeken titels
2. De animatie vertraagt en stopt bij een willekeurige titel
3. Je ziet de volledige info: poster, titel, jaar, type, taal, genres en beschrijving
4. Keuze uit:
   - **✓ Vanavond kijken!** — markeert als gezien en sluit
   - **🎲 Nog een** — draait opnieuw
   - **Sluiten** — terug naar de lijst

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

**Zonder API key** werkt handmatig toevoegen gewoon — je typt dan zelf de titel en kiest het type.

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
2. Klik op de **+** knop in de header
3. Klik onderaan op **"⚙ TMDB API key instellen"**
4. Plak je API key en klik "Opslaan"

De key wordt opgeslagen in je browser en hoef je maar één keer in te voeren.

> **Let op:** TMDB vereist dat je hun logo toont bij gebruik van hun data. Meer info op [themoviedb.org/about/logos-attribution](https://www.themoviedb.org/about/logos-attribution).

---

## Dataopslag

Alle data wordt lokaal opgeslagen in je browser via `localStorage`. Er wordt niets naar een server gestuurd.

| Sleutel | Wat het opslaat |
|---------|----------------|
| `kijklijst_custom` | Zelf toegevoegde titels (JSON array) |
| `kijklijst_watched` | Gezien-status per titel |
| `kijklijst_ratings` | Sterren (0-5) en reviews per titel |
| `kijklijst_order` | Handmatige sorteervolgorde |
| `kijklijst_view` | Weergavevoorkeur (grid/list) |
| `kijklijst_tmdb_key` | Je TMDB API key |

### Backup maken

Je kunt een backup maken door de localStorage-data te exporteren via de browser-console:

```javascript
// In de browser-console (F12 → Console):
copy(JSON.stringify({
  custom: localStorage.getItem('kijklijst_custom'),
  watched: localStorage.getItem('kijklijst_watched'),
  ratings: localStorage.getItem('kijklijst_ratings'),
  order: localStorage.getItem('kijklijst_order')
}));
// De data staat nu op je klembord — plak het in een tekstbestand
```

### Backup terugzetten

```javascript
// Plak je backup-data in een variabele:
const backup = { /* plak hier je backup */ };
localStorage.setItem('kijklijst_custom', backup.custom);
localStorage.setItem('kijklijst_watched', backup.watched);
localStorage.setItem('kijklijst_ratings', backup.ratings);
localStorage.setItem('kijklijst_order', backup.order);
location.reload();
```

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
├── sw.js                 # Service Worker (offline caching)
├── start.sh              # Start-script (port 8420)
├── start.command          # macOS start-script (port 8000)
├── .gitignore            # Houdt data.js en .DS_Store uit git
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
| API | TMDB API v3 (optioneel, voor auto-complete) |
| Server | Python 3 `http.server` (alleen voor lokaal draaien) |

**Nul dependencies.** Geen npm, geen build-stap, geen node_modules.

### Service Worker caching

| Bron | Strategie |
|------|-----------|
| Statische bestanden (HTML, CSS, JS) | Cache-first, fallback naar netwerk |
| Google Fonts | Cache-first (veranderen zelden) |
| Poster-afbeeldingen (Amazon/TMDB) | Network-first, fallback naar cache |
| TMDB API-calls | Altijd netwerk (nooit gecached) |

Na de eerste keer laden werkt de app volledig offline (behalve TMDB-zoeken en nieuwe poster-afbeeldingen).

### Responsive breakpoints

| Breedte | Aanpassing |
|---------|-----------|
| > 600px | Desktop: auto-fill grid, zijdelingse controls |
| ≤ 600px | Mobiel: 2-koloms grid, gestapelde controls, grotere touch-targets (44-48px) |
| ≤ 380px | Kleine telefoons: 1-koloms grid |

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
Alles staat in de `localStorage` van je browser. Als je je browserdata wist, ben je je gegevens kwijt. Maak regelmatig een backup (zie [Dataopslag](#dataopslag)).

**Kan ik de app op mijn telefoon gebruiken?**
Ja. Start de server op je computer, en open `http://<je-ip-adres>:8420` op je telefoon (zorg dat beide op hetzelfde wifi-netwerk zitten). Je kunt de app ook installeren als PWA via je mobiele browser.

**Hoe voeg ik meer films toe aan de standaard-database?**
Bewerk `js/data.js` en voeg items toe aan het `DATA`-array. Volg het bestaande formaat. Voeg optioneel de IMDb-ID toe aan het `IMDB`-object voor directe links.

**De service worker cachet een oude versie. Hoe forceer ik een update?**
Verhoog `CACHE_VERSION` in `sw.js` (bijv. van `kijklijst-v2` naar `kijklijst-v3`). Bij de volgende paginalading wordt de oude cache verwijderd.

**Kan ik de app delen met anderen?**
Ja, kopieer de hele `films/`-map. De ander hoeft alleen Python 3 te hebben en `./start.sh` te draaien. Zelf toegevoegde titels zitten in localStorage en worden niet meegekopieerd — de standaard-database in `data.js` wel.
