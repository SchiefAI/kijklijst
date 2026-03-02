// ─────────────────────────────────────────────
// Mijn Kijklijst — Voorbeelddata
// ─────────────────────────────────────────────
// Kopieer dit bestand naar data.js en pas het aan:
//   cp js/data.example.js js/data.js
//
// Voeg je eigen films en series toe aan het DATA-array.
// Gebruik de + knop in de app om titels toe te voegen met
// TMDB auto-complete, of bewerk dit bestand handmatig.
// ─────────────────────────────────────────────

const DATA = [
  // ── FILMS ──
  {
    t: "Parasite",
    y: "2019",
    type: "film",
    lang: "Koreaans",
    d: "Bong Joon-ho's meesterwerk over een arm gezin dat infiltreert in het leven van een steenrijke familie. Oscarwinnaar Beste Film.",
    img: "https://m.media-amazon.com/images/M/MV5BYjk1Y2U4MjQtY2ZiNS00OWQyLWI3MmYtZWUwNmRjYWRiNWNhXkEyXkFqcGc@._V1_FMjpg_UX400_.jpg",
    g: "Thriller, Drama"
  },
  {
    t: "La Vita è Bella",
    y: "1997",
    type: "film",
    lang: "Italiaans",
    d: "Roberto Benigni's ontroerende tragikomdie over een vader die zijn zoon beschermt in een concentratiekamp met humor en verbeelding.",
    img: "https://m.media-amazon.com/images/M/MV5BMTdkNzJhOTItMzEwOS00M2QyLWFmN2MtNzZhY2VkNDk1MDIwXkEyXkFqcGc@._V1_FMjpg_UX400_.jpg",
    g: "Drama, Komedie, Oorlog"
  },
  {
    t: "Druk",
    y: "2020",
    type: "film",
    lang: "Deens",
    d: "Thomas Vinterbergs Oscar-winnende film over vier leraren die experimenteren met dagelijks alcohol drinken. Met Mads Mikkelsen.",
    img: "https://m.media-amazon.com/images/M/MV5BY2U3ZmYzNWQtNGY1MS00ZDNiLThiMGQtNGZlYzMyZjI4YjhlXkEyXkFqcGc@._V1_FMjpg_UX400_.jpg",
    g: "Drama, Komedie"
  },
  {
    t: "Flow",
    y: "2024",
    type: "film",
    lang: "Lets",
    d: "Betoverende Letse animatiefilm over een kat die door een overstroomde wereld reist met andere dieren. Vrijwel zonder dialoog.",
    img: "https://m.media-amazon.com/images/M/MV5BMDg0Y2M2OGMtMTMyYy00MDA1LTg3NTctN2YxNTNmZWUxZGI1XkEyXkFqcGc@._V1_FMjpg_UX400_.jpg",
    g: "Animatie"
  },

  // ── SERIES ──
  {
    t: "The Expanse",
    y: "2015",
    type: "serie",
    lang: "Engels",
    d: "Epische sciencefictionserie over politieke spanningen in een toekomst waarin de mensheid het zonnestelsel heeft gekoloniseerd.",
    img: "https://m.media-amazon.com/images/M/MV5BYzUyYmI3MjctY2Q2MC00NmFjLTgwZGUtNWQzZWNlYmVjNzE2XkEyXkFqcGc@._V1_FMjpg_UX400_.jpg",
    g: "Sci-Fi"
  },
  {
    t: "Bron / Broen",
    y: "2011",
    type: "serie",
    lang: "Scandinavisch",
    d: "Scandinavische misdaadserie over een lijk dat precies op de grens van Zweden en Denemarken wordt gevonden. Cult-klassieker.",
    img: "https://m.media-amazon.com/images/M/MV5BMjQ3MDAzNDU4NV5BMl5BanBnXkFtZTgwNjE2NDQ0NzE@._V1_FMjpg_UX400_.jpg",
    g: "Misdaad, Thriller"
  }
];

// IMDb IDs — voeg toe voor directe links naar IMDb-pagina's.
// Zonder ID zoekt de app automatisch op titel.
const IMDB = {
  "Parasite": "tt6751668",
  "La Vita è Bella": "tt0118799",
  "Druk": "tt10288566",
  "Flow": "tt4772188",
  "The Expanse": "tt3230854",
  "Bron / Broen": "tt1733785"
};
