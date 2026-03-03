// ── SYNC DATA NAAR data.js VIA LOKALE SERVER ──
async function syncToFile() {
    try {
        const resp = await fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: DATA, imdb: IMDB })
        });
        if (!resp.ok) throw new Error('Server response ' + resp.status);
    } catch(e) {
        // Server niet bereikbaar (file:// of offline) — stille fallback
        console.info('Sync niet beschikbaar:', e.message);
    }
}

// ── STATE (server-synced) ──
let watched = {};
try { watched = JSON.parse(localStorage.getItem('kijklijst_watched') || '{}'); } catch(e) { console.error('Parse watched:', e); }

let ratings = {};
try { ratings = JSON.parse(localStorage.getItem('kijklijst_ratings') || '{}'); } catch(e) { console.error('Parse ratings:', e); }

let customOrder = [];
try { customOrder = JSON.parse(localStorage.getItem('kijklijst_order') || '[]'); } catch(e) { console.error('Parse order:', e); }

let tmdbKey = '';
try { tmdbKey = localStorage.getItem('kijklijst_tmdb_key') || ''; } catch(e) { console.error('Read tmdb_key:', e); }

function saveWatched() {
    try { localStorage.setItem('kijklijst_watched', JSON.stringify(watched)); } catch(e) { console.error('Save watched:', e); }
    debouncedSyncState();
}

function saveRatings() {
    try { localStorage.setItem('kijklijst_ratings', JSON.stringify(ratings)); } catch(e) { console.error('Save ratings:', e); }
    debouncedSyncState();
}

function saveCustomOrder() {
    try { localStorage.setItem('kijklijst_order', JSON.stringify(customOrder)); } catch(e) { console.error('Save order:', e); }
    debouncedSyncState();
}

let _syncTimer = null;
function debouncedSyncState() {
    clearTimeout(_syncTimer);
    _syncTimer = setTimeout(syncState, 300);
}

async function syncState() {
    try {
        await fetch('/api/state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                watched, ratings, order: customOrder, tmdb_key: tmdbKey
            })
        });
    } catch(e) { console.info('State sync niet beschikbaar:', e.message); }
}

async function loadState() {
    try {
        const resp = await fetch('/api/state');
        if (!resp.ok) return;
        const s = await resp.json();
        const hasServerState = s.watched || s.ratings || s.order || s.tmdb_key;
        if (hasServerState) {
            // Server is source of truth
            if (s.watched) watched = s.watched;
            if (s.ratings) ratings = s.ratings;
            if (s.order) customOrder = s.order;
            if (s.tmdb_key) tmdbKey = s.tmdb_key;
            localStorage.setItem('kijklijst_watched', JSON.stringify(watched));
            localStorage.setItem('kijklijst_ratings', JSON.stringify(ratings));
            localStorage.setItem('kijklijst_order', JSON.stringify(customOrder));
            if (tmdbKey) localStorage.setItem('kijklijst_tmdb_key', tmdbKey);
        } else {
            // Server is leeg — seed met huidige localStorage data
            await syncState();
        }
    } catch(e) { console.info('State laden niet beschikbaar:', e.message); }
    render();
}

// ── HELPERS ──
function hashColor(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
    const hue = Math.abs(h) % 360;
    return `linear-gradient(135deg, hsl(${hue},35%,22%), hsl(${(hue+40)%360},30%,16%))`;
}

function initials(title) {
    return title.split(/[\s:]+/).filter(w => w.length > 0).slice(0, 3).map(w => w[0]).join('').toUpperCase();
}

function getKey(item) { return item.t.toLowerCase().replace(/[^a-z0-9]/g,''); }

const STAR_SVG = '<svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';

const GENRE_ICONS = {
    'Actie':'⚡','Animatie':'✏️','Avontuur':'🧭','Documentaire':'🎥',
    'Drama':'🎭','Familie':'👨‍👩‍👧','Fantasy':'🔮','Historisch':'📜',
    'Horror':'💀','Komedie':'😂','Misdaad':'🔫','Muziek':'🎵',
    'Oorlog':'⚔️','Reality':'📺','Romantiek':'❤️','Sci-Fi':'🚀','Thriller':'🔪'
};

function genreBadges(g) {
    if (!g) return '';
    return '<div class="genre-badges">' +
        g.split(', ').map(genre =>
            `<span class="genre-badge">${GENRE_ICONS[genre] || '🎬'} ${escapeHtml(genre)}</span>`
        ).join('') + '</div>';
}

function imdbUrl(title) {
    const id = IMDB[title];
    return id ? `https://www.imdb.com/title/${id}/` : `https://www.imdb.com/find/?q=${encodeURIComponent(title)}`;
}

function jwUrl(title) {
    return `https://www.justwatch.com/nl/search?q=${encodeURIComponent(title)}`;
}

function subtitle(item) {
    const parts = [];
    if (item.y) parts.push(escapeHtml(item.y));
    if (item.type) parts.push(item.type === 'serie' ? 'Serie' : 'Film');
    if (item.g) parts.push(escapeHtml(item.g));
    return parts.join(' · ');
}

function escapeAttr(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── STAR RATING HTML ──
function starDisplayHtml(stars) {
    if (!stars) return '';
    let html = '<div class="star-display">';
    for (let i = 1; i <= 5; i++) {
        if (stars >= i) {
            html += `<span class="star-icon">${STAR_SVG}</span>`;
        } else if (stars >= i - 0.5) {
            html += `<span class="star-icon half-star">${STAR_SVG}</span>`;
        } else {
            html += `<span class="star-icon empty">${STAR_SVG}</span>`;
        }
    }
    html += `<span class="rating-num">${stars}</span></div>`;
    return html;
}

function starRatingHtml(key, currentStars) {
    let html = '<div class="star-rating" data-key="' + key + '">';
    for (let i = 1; i <= 5; i++) {
        const fullClass = currentStars >= i ? 'full' : (currentStars >= i - 0.5 ? 'half' : '');
        html += `<span class="star ${fullClass}" data-star="${i}">`;
        html += STAR_SVG;
        if (fullClass === 'half') {
            html += `<svg class="half-fill" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
        }
        html += `<span class="star-hit left" data-val="${i - 0.5}"></span>`;
        html += `<span class="star-hit right" data-val="${i}"></span>`;
        html += '</span>';
    }
    html += '</div>';
    return html;
}

function ratingBlockHtml(key, isWatched) {
    if (!isWatched) return '';
    const r = ratings[key] || {};
    const stars = r.stars || 0;
    const review = r.review || '';

    let html = '<div class="rating-wrap">';
    html += starRatingHtml(key, stars);
    if (stars > 0) {
        html += `<input type="text" class="review-input" data-key="${key}" placeholder="One-liner review..." maxlength="120" value="${escapeAttr(review)}">`;
        if (review) html += `<div class="review-text">"${escapeHtml(review)}"</div>`;
    }
    html += '</div>';
    return html;
}

// ── VIEW MODE ──
const defaultView = window.innerWidth <= 600 ? 'list' : 'grid';
let viewMode = defaultView;
try { viewMode = localStorage.getItem('kijklijst_view') || defaultView; } catch(e) {}

function saveViewMode() {
    try { localStorage.setItem('kijklijst_view', viewMode); } catch(e) {}
}

// ── DOM REFS ──
const grid = document.getElementById('grid');
const searchBox = document.getElementById('searchBox');
const typeFilter = document.getElementById('typeFilter');
const statusFilter = document.getElementById('statusFilter');
const genreFilter = document.getElementById('genreFilter');
const langFilter = document.getElementById('langFilter');
const sortSelect = document.getElementById('sortSelect');
const viewToggle = document.getElementById('viewToggle');

// ── DROPDOWNS ──
(function populateDropdowns() {
    const genreCounts = {};
    const langCounts = {};
    DATA.forEach(i => {
        if (i.g) i.g.split(', ').forEach(g => { genreCounts[g] = (genreCounts[g] || 0) + 1; });
        if (i.lang) langCounts[i.lang] = (langCounts[i.lang] || 0) + 1;
    });

    Object.keys(genreCounts).sort((a, b) => a.localeCompare(b, 'nl')).forEach(genre => {
        const opt = document.createElement('option');
        opt.value = genre;
        opt.textContent = `${genre} (${genreCounts[genre]})`;
        genreFilter.appendChild(opt);
    });

    Object.keys(langCounts).sort((a, b) => a.localeCompare(b, 'nl')).forEach(lang => {
        const opt = document.createElement('option');
        opt.value = lang;
        opt.textContent = `${lang} (${langCounts[lang]})`;
        langFilter.appendChild(opt);
    });
})();

// ── DYNAMIC DROPDOWN COUNTS ──
function updateDropdownCounts(query, typeVal, statusVal, genreVal, langVal) {
    function baseFilter(item, excludeFilter) {
        if (query && !item.t.toLowerCase().includes(query)) return false;
        if (typeVal !== 'all' && item.type !== typeVal) return false;
        if (excludeFilter !== 'genre' && genreVal !== 'all' && (!item.g || !item.g.split(', ').includes(genreVal))) return false;
        if (excludeFilter !== 'lang' && langVal !== 'all' && item.lang !== langVal) return false;
        const key = getKey(item);
        const isWatched = !!watched[key];
        if (statusVal === 'watched' && !isWatched) return false;
        if (statusVal === 'unwatched' && isWatched) return false;
        return true;
    }

    const genrePool = DATA.filter(i => baseFilter(i, 'genre'));
    const genreCountMap = {};
    genrePool.forEach(i => {
        if (i.g) i.g.split(', ').forEach(g => { genreCountMap[g] = (genreCountMap[g] || 0) + 1; });
    });
    [...genreFilter.options].forEach(opt => {
        if (opt.value === 'all') {
            opt.textContent = `Alle genres (${genrePool.length})`;
        } else {
            const c = genreCountMap[opt.value] || 0;
            opt.textContent = `${opt.value} (${c})`;
            opt.disabled = c === 0;
        }
    });

    const langPool = DATA.filter(i => baseFilter(i, 'lang'));
    const langCountMap = {};
    langPool.forEach(i => { if (i.lang) langCountMap[i.lang] = (langCountMap[i.lang] || 0) + 1; });
    [...langFilter.options].forEach(opt => {
        if (opt.value === 'all') {
            opt.textContent = `Alle talen (${langPool.length})`;
        } else {
            const c = langCountMap[opt.value] || 0;
            opt.textContent = `${opt.value} (${c})`;
            opt.disabled = c === 0;
        }
    });
}

// ── TOAST NOTIFICATIONS ──
const toastContainer = document.getElementById('toastContainer');

function showToast(message, undoFn) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = escapeHtml(message);
    if (undoFn) {
        const btn = document.createElement('button');
        btn.className = 'undo-btn';
        btn.textContent = 'Ongedaan maken';
        btn.addEventListener('click', () => {
            undoFn();
            el.remove();
        });
        el.appendChild(btn);
    }
    toastContainer.appendChild(el);
    setTimeout(() => {
        el.classList.add('out');
        el.addEventListener('animationend', () => el.remove());
    }, undoFn ? 5000 : 2500);
}

// ── RENDER ──
function render() {
    const query = searchBox.value.toLowerCase().trim();
    const typeBtn = typeFilter.querySelector('.active');
    const typeVal = typeBtn ? typeBtn.dataset.type : 'all';
    const statusBtn = statusFilter.querySelector('.active');
    const statusVal = statusBtn ? statusBtn.dataset.status : 'all';
    const genreVal = genreFilter.value;
    const langVal = langFilter.value;
    const sortVal = sortSelect.value;

    let items = DATA.filter(item => {
        if (query && !item.t.toLowerCase().includes(query)) return false;
        if (typeVal !== 'all' && item.type !== typeVal) return false;
        if (genreVal !== 'all' && (!item.g || !item.g.split(', ').includes(genreVal))) return false;
        if (langVal !== 'all' && item.lang !== langVal) return false;
        const key = getKey(item);
        const isWatched = !!watched[key];
        if (statusVal === 'watched' && !isWatched) return false;
        if (statusVal === 'unwatched' && isWatched) return false;
        return true;
    });

    items.sort((a, b) => {
        switch(sortVal) {
            case 'az': return a.t.localeCompare(b.t, 'nl');
            case 'za': return b.t.localeCompare(a.t, 'nl');
            case 'year-desc': return (parseInt(b.y)||0) - (parseInt(a.y)||0);
            case 'year-asc': return (parseInt(a.y)||9999) - (parseInt(b.y)||9999);
            case 'rating-desc': {
                const ra = (ratings[getKey(a)] || {}).stars || 0;
                const rb = (ratings[getKey(b)] || {}).stars || 0;
                return rb - ra || a.t.localeCompare(b.t, 'nl');
            }
            case 'custom': {
                const ia = customOrder.indexOf(getKey(a));
                const ib = customOrder.indexOf(getKey(b));
                if (ia === -1 && ib === -1) return a.t.localeCompare(b.t, 'nl');
                if (ia === -1) return 1;
                if (ib === -1) return -1;
                return ia - ib;
            }
            default: return 0;
        }
    });

    updateStats();
    updateDropdownCounts(query, typeVal, statusVal, genreVal, langVal);

    grid.classList.toggle('list-view', viewMode === 'list');

    const scrollY = window.scrollY;
    const isDragMode = sortVal === 'custom';

    if (items.length === 0) {
        const hasFilters = typeVal !== 'all' || statusVal !== 'all' || genreVal !== 'all' || langVal !== 'all';
        let emptyHtml = '<div class="empty-state">';
        if (hasFilters && query) {
            emptyHtml += 'Geen resultaten met actieve filters';
            emptyHtml += '<br><button class="empty-add-btn" onclick="resetFilters()">Filters resetten</button>';
        } else if (hasFilters) {
            emptyHtml += 'Geen resultaten met actieve filters';
            emptyHtml += '<br><button class="empty-add-btn" onclick="resetFilters()">Filters resetten</button>';
        } else if (query) {
            emptyHtml += 'Geen resultaten gevonden';
            const safe = query.replace(/'/g, "\\'").replace(/"/g, '&quot;');
            emptyHtml += `<br><button class="empty-add-btn" onclick="openAdd('${safe}')">` +
                         `Niet gevonden? Zoek in TMDB →</button>`;
        } else {
            emptyHtml += 'Geen resultaten gevonden';
        }
        emptyHtml += '</div>';
        grid.innerHTML = emptyHtml;
        return;
    }

    grid.innerHTML = items.map(item => {
        const key = getKey(item);
        const isWatched = !!watched[key];
        const hasImg = !!item.img;
        const isList = viewMode === 'list';
        const r = ratings[key] || {};
        const dragAttr = isDragMode ? ' draggable="true"' : '';

        const linksHtml = `<div class="card-links">
            <a href="${imdbUrl(item.t)}" target="_blank" rel="noopener" class="link-btn imdb">IMDb</a>
            <a href="${jwUrl(item.t)}" target="_blank" rel="noopener" class="link-btn jw">${isList ? 'JW' : 'Waar te kijken'}</a>
            <button class="remove-btn" onclick="removeItem('${escapeAttr(key)}','${escapeAttr(item.t)}')" title="Verwijderen">✕</button>
        </div>`;
        const watchHtml = `<button class="watch-btn ${isWatched ? 'watched' : ''}" onclick="toggleWatch('${escapeAttr(key)}')">
            ${isWatched ? '✓ Gezien' : '○ Markeer als gezien'}
        </button>`;

        const ratingHtml = isList
            ? (r.stars ? starDisplayHtml(r.stars) : '')
            : ratingBlockHtml(key, isWatched);

        if (isList) {
            return `
            <div class="card ${isWatched ? 'is-watched' : ''}" data-key="${key}"${dragAttr}>
                <div class="poster-wrap">
                    <div class="poster-gradient" style="background:${hashColor(item.t)}">${initials(item.t)}</div>
                    ${hasImg ? `<img class="poster-img" src="${item.img}" alt="${escapeHtml(item.t)}" style="display:block" onerror="this.style.display='none'">` : ''}
                    <span class="type-badge ${item.type}">${item.type === 'serie' ? 'Serie' : 'Film'}</span>
                    ${isWatched ? '<span class="watched-check">✓</span>' : ''}
                </div>
                <div class="card-body">
                    <div class="list-info">
                        <div class="list-title-row">
                            <div class="card-title">${escapeHtml(item.t)}</div>
                            ${genreBadges(item.g)}
                        </div>
                        <div class="card-subtitle">${subtitle(item)}</div>
                        ${item.d ? `<div class="list-desc">${escapeHtml(item.d)}</div>` : ''}
                        ${ratingHtml}
                    </div>
                    <div class="list-actions">
                        ${linksHtml}
                        ${watchHtml}
                    </div>
                </div>
            </div>`;
        }

        return `
        <div class="card ${isWatched ? 'is-watched' : ''}" data-key="${key}"${dragAttr}>
            <div class="poster-wrap">
                <div class="poster-gradient" style="background:${hashColor(item.t)}">${initials(item.t)}</div>
                ${hasImg ? `<img class="poster-img" src="${item.img}" alt="${escapeHtml(item.t)}" style="display:block" onerror="this.style.display='none'">` : ''}
                <span class="type-badge ${item.type}">${item.type === 'serie' ? 'Serie' : 'Film'}</span>
                ${isWatched ? '<span class="watched-check">✓</span>' : ''}
            </div>
            <div class="card-body">
                <div class="card-title">${escapeHtml(item.t)}</div>
                ${item.y ? `<div class="card-year">${escapeHtml(item.y)}</div>` : ''}
                ${genreBadges(item.g)}
                ${item.d ? `<div class="card-desc">${escapeHtml(item.d)}</div>` : ''}
                ${linksHtml}
                ${watchHtml}
                ${ratingHtml}
            </div>
        </div>`;
    }).join('');

    // Re-attach drag events if in custom sort mode
    if (isDragMode) initDragAndDrop();

    // Restore scroll position after re-render
    window.scrollTo(0, scrollY);

    // Update filter badge
    updateFilterBadge();
}

function toggleWatch(key) {
    const wasWatched = !!watched[key];
    const oldRating = ratings[key] ? { ...ratings[key] } : null;

    if (wasWatched) {
        delete watched[key];
        delete ratings[key];
        saveRatings();
    } else {
        watched[key] = true;
    }
    saveWatched();
    render();

    const item = DATA.find(i => getKey(i) === key);
    const title = item ? item.t : key;
    showToast(wasWatched ? `"${title}" als niet-gezien gemarkeerd` : `"${title}" als gezien gemarkeerd`, () => {
        if (wasWatched) {
            watched[key] = true;
            if (oldRating) ratings[key] = oldRating;
            saveRatings();
        } else {
            delete watched[key];
        }
        saveWatched();
        render();
    });
}

function removeItem(key, title) {
    const idx = DATA.findIndex(i => getKey(i) === key);
    if (idx === -1) return;
    const removedItem = { ...DATA[idx] };
    const removedImdb = IMDB[title] || null;
    const removedWatched = watched[key] || false;
    const removedRating = ratings[key] ? { ...ratings[key] } : null;
    const removedOrderIdx = customOrder.indexOf(key);

    DATA.splice(idx, 1);
    if (IMDB[title]) delete IMDB[title];
    delete watched[key];
    saveWatched();
    delete ratings[key];
    saveRatings();
    if (removedOrderIdx > -1) customOrder.splice(removedOrderIdx, 1);
    saveCustomOrder();
    syncToFile();
    render();

    showToast(`"${title}" verwijderd`, () => {
        DATA.splice(idx, 0, removedItem);
        if (removedImdb) IMDB[title] = removedImdb;
        if (removedWatched) watched[key] = true;
        if (removedRating) ratings[key] = removedRating;
        if (removedOrderIdx > -1) customOrder.splice(removedOrderIdx, 0, key);
        saveWatched();
        saveRatings();
        saveCustomOrder();
        syncToFile();
        render();
    });
}

function updateStats() {
    const films = DATA.filter(i => i.type === 'film').length;
    const series = DATA.filter(i => i.type === 'serie').length;
    const w = Object.keys(watched).length;
    document.getElementById('filmCount').textContent = films;
    document.getElementById('serieCount').textContent = series;
    document.getElementById('watchedCount').textContent = w;
}

// ── STAR RATING INTERACTION ──
grid.addEventListener('click', e => {
    const hit = e.target.closest('.star-hit');
    if (!hit) return;
    const ratingWrap = hit.closest('.star-rating');
    if (!ratingWrap) return;
    const key = ratingWrap.dataset.key;
    const val = parseFloat(hit.dataset.val);
    if (!key || isNaN(val)) return;

    if (!ratings[key]) ratings[key] = {};
    ratings[key].stars = val;
    saveRatings();

    // 5-star sparkle effect
    if (val === 5) {
        const card = ratingWrap.closest('.card');
        if (card) spawnSparkles(card);
    }

    render();
});

// Review input handler (delegated)
grid.addEventListener('change', e => {
    if (!e.target.classList.contains('review-input')) return;
    const key = e.target.dataset.key;
    if (!key) return;
    if (!ratings[key]) ratings[key] = {};
    ratings[key].review = e.target.value.trim();
    saveRatings();
});
grid.addEventListener('keydown', e => {
    if (!e.target.classList.contains('review-input')) return;
    if (e.key === 'Enter') {
        e.target.blur();
    }
});

// ── SPARKLE EFFECT ──
function spawnSparkles(card) {
    const rect = card.getBoundingClientRect();
    for (let i = 0; i < 12; i++) {
        const particle = document.createElement('span');
        particle.className = 'sparkle-particle';
        const sx = Math.random() * rect.width;
        const sy = Math.random() * rect.height * 0.5 + rect.height * 0.3;
        const ex = sx + (Math.random() - 0.5) * 60;
        const ey = sy - Math.random() * 40 - 20;
        particle.style.cssText = `left:${rect.left + sx}px;top:${rect.top + sy}px;--sx:0px;--sy:0px;--ex:${ex-sx}px;--ey:${ey-sy}px;animation-delay:${i*0.05}s;`;
        const colors = ['#e5a00d', '#f7d56e', '#fff5cc', '#ffd700'];
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        particle.style.boxShadow = `0 0 6px ${particle.style.background}`;
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 900);
    }
}

// ── FILTERS ──
typeFilter.addEventListener('click', e => {
    if (e.target.tagName !== 'BUTTON') return;
    typeFilter.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    render();
});
statusFilter.addEventListener('click', e => {
    if (e.target.tagName !== 'BUTTON') return;
    statusFilter.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    render();
});
viewToggle.addEventListener('click', e => {
    if (e.target.tagName !== 'BUTTON') return;
    viewToggle.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    viewMode = e.target.dataset.view;
    saveViewMode();
    render();
});
genreFilter.addEventListener('change', render);
langFilter.addEventListener('change', render);
sortSelect.addEventListener('change', render);

// Mobile filter toggle
const filterToggle = document.getElementById('filterToggle');
const controlsFilters = document.getElementById('controlsFilters');
filterToggle.addEventListener('click', () => {
    controlsFilters.classList.toggle('open');
    filterToggle.classList.toggle('active');
});

// Stat pills as filter shortcuts
document.getElementById('statFilm').addEventListener('click', () => {
    typeFilter.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    const filmBtn = typeFilter.querySelector('[data-type="film"]');
    if (filmBtn) { filmBtn.classList.add('active'); render(); }
});
document.getElementById('statSerie').addEventListener('click', () => {
    typeFilter.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    const serieBtn = typeFilter.querySelector('[data-type="serie"]');
    if (serieBtn) { serieBtn.classList.add('active'); render(); }
});
document.getElementById('statWatched').addEventListener('click', () => {
    statusFilter.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    const watchedBtn = statusFilter.querySelector('[data-status="watched"]');
    if (watchedBtn) { watchedBtn.classList.add('active'); render(); }
});

function resetFilters() {
    typeFilter.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    const allTypeBtn = typeFilter.querySelector('[data-type="all"]');
    if (allTypeBtn) allTypeBtn.classList.add('active');
    statusFilter.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    const allStatusBtn = statusFilter.querySelector('[data-status="all"]');
    if (allStatusBtn) allStatusBtn.classList.add('active');
    genreFilter.value = 'all';
    langFilter.value = 'all';
    render();
}

let searchTimeout;
const searchWrap = searchBox.parentElement;
const searchClear = document.getElementById('searchClear');
function updateSearchClear() {
    searchWrap.classList.toggle('has-value', searchBox.value.length > 0);
}
searchBox.addEventListener('input', () => {
    updateSearchClear();
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(render, 250);
});
searchClear.addEventListener('click', () => {
    searchBox.value = '';
    updateSearchClear();
    searchBox.focus();
    render();
});

// ── HERO POSTER MOSAIC ──
(function buildHeroPosters() {
    const container = document.getElementById('heroPosters');
    const posters = DATA.filter(d => d.img).map(d => d.img);
    for (let i = posters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [posters[i], posters[j]] = [posters[j], posters[i]];
    }
    const colCount = 14;
    const perCol = 6;
    for (let c = 0; c < colCount; c++) {
        const col = document.createElement('div');
        col.className = 'hero-poster-col';
        for (let pass = 0; pass < 2; pass++) {
            for (let r = 0; r < perCol; r++) {
                const idx = (c * perCol + r) % posters.length;
                const img = document.createElement('img');
                img.src = posters[idx];
                img.alt = '';
                img.loading = 'lazy';
                col.appendChild(img);
            }
        }
        container.appendChild(col);
    }
})();

// ── ADD TITLE ──
const fabBtn = document.getElementById('fabBtn');
const addOverlay = document.getElementById('addOverlay');
const addTitleInput = document.getElementById('addTitle');
const addSubmit = document.getElementById('addSubmit');
const addExtraFields = document.getElementById('addExtraFields');

function openAdd(prefill = '') {
    addOverlay.classList.add('visible');
    fabBtn.classList.add('open');
    addExtraFields.classList.remove('visible');
    tmdbResultsEl.classList.remove('visible');
    if (prefill) {
        addTitleInput.value = prefill;
        if (tmdbKey && prefill.length >= 2) {
            tmdbResultsEl.innerHTML = '<div class="tmdb-loading">Zoeken...</div>';
            tmdbResultsEl.classList.add('visible');
            setTimeout(() => {
                addTitleInput.focus();
                searchTmdb(prefill);
            }, 200);
        } else {
            setTimeout(() => addTitleInput.focus(), 200);
        }
    } else {
        setTimeout(() => addTitleInput.focus(), 200);
    }
}
function closeAdd() {
    addOverlay.classList.remove('visible');
    fabBtn.classList.remove('open');
    addTitleInput.value = '';
    document.getElementById('addYear').value = '';
    document.getElementById('addLang').value = '';
    document.getElementById('addGenre').value = '';
    document.getElementById('addDesc').value = '';
    document.getElementById('addImg').value = '';
    addExtraFields.classList.remove('visible');
    tmdbResultsEl.classList.remove('visible');
    selectedTmdbItem = null;
}

fabBtn.addEventListener('click', () => {
    if (addOverlay.classList.contains('visible')) closeAdd();
    else openAdd();
});

addOverlay.addEventListener('click', e => {
    if (e.target === addOverlay) closeAdd();
});

addSubmit.addEventListener('click', () => {
    const title = addTitleInput.value.trim();
    if (!title) { addTitleInput.focus(); return; }
    const type = document.querySelector('input[name="addType"]:checked').value;
    const newItem = {
        t: title,
        y: document.getElementById('addYear').value.trim(),
        type: type,
        lang: document.getElementById('addLang').value.trim(),
        d: document.getElementById('addDesc').value.trim(),
        img: document.getElementById('addImg').value.trim(),
        g: document.getElementById('addGenre').value.trim()
    };
    DATA.push(newItem);
    syncToFile();
    closeAdd();
    render();
    showToast(`"${title}" toegevoegd`);
});

addTitleInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !tmdbResultsEl.classList.contains('visible')) addSubmit.click();
});

// ══════════════════════════════════════════════
// ── FEATURE 2: RANDOM PICKER ──
// ══════════════════════════════════════════════
const pickerBtn = document.getElementById('pickerBtn');
const pickerOverlay = document.getElementById('pickerOverlay');
const pickerSlot = document.getElementById('pickerSlot');
const pickerInfo = document.getElementById('pickerInfo');
const pickerTitle = document.getElementById('pickerTitle');
const pickerMeta = document.getElementById('pickerMeta');
const pickerBadges = document.getElementById('pickerBadges');
const pickerDesc = document.getElementById('pickerDesc');
const pickWatch = document.getElementById('pickWatch');
const pickAgain = document.getElementById('pickAgain');
const pickClose = document.getElementById('pickClose');
const pickImdb = document.getElementById('pickImdb');
const pickJw = document.getElementById('pickJw');
const pickerLinks = document.getElementById('pickerLinks');

let pickerCurrent = null;

function getUnwatchedItems() {
    return DATA.filter(item => !watched[getKey(item)]);
}

function openPicker() {
    pickerOverlay.classList.add('visible');
    spinPicker();
}

function closePicker() {
    pickerOverlay.classList.remove('visible');
    pickerCurrent = null;
}

function spinPicker() {
    const unwatched = getUnwatchedItems();
    if (unwatched.length === 0) {
        pickerSlot.innerHTML = '';
        pickerInfo.classList.remove('visible');
        pickerSlot.innerHTML = '<div class="picker-empty">Alles al gezien! 🎉</div>';
        pickWatch.style.display = 'none';
        pickAgain.style.display = 'none';
        pickerLinks.style.display = 'none';
        return;
    }

    pickWatch.style.display = '';
    pickAgain.style.display = '';
    pickerLinks.style.display = '';
    pickerInfo.classList.remove('visible');

    // Build slot images from random subset
    const shuffled = [...unwatched].sort(() => Math.random() - 0.5);
    const slotItems = shuffled.slice(0, Math.min(15, shuffled.length));
    const winner = slotItems[slotItems.length - 1];
    pickerCurrent = winner;

    // Populate slot
    pickerSlot.innerHTML = slotItems.map((item, i) => {
        if (item.img) {
            return `<img src="${item.img}" alt="${item.t}" class="${i === 0 ? 'active' : ''}">`;
        }
        return `<div class="picker-gradient ${i === 0 ? 'active' : ''}" style="background:${hashColor(item.t)}">${initials(item.t)}</div>`;
    }).join('');

    // Animate through items
    const elements = pickerSlot.children;
    let idx = 0;
    let speed = 80;
    const totalSteps = slotItems.length;

    function nextSlide() {
        for (let e of elements) e.classList.remove('active');
        idx++;
        if (idx >= totalSteps) {
            // Show winner
            elements[totalSteps - 1].classList.add('active');
            showPickerResult(winner);
            return;
        }
        elements[idx].classList.add('active');
        // Slow down near end
        if (idx > totalSteps - 5) speed += 60;
        else if (idx > totalSteps - 8) speed += 25;
        setTimeout(nextSlide, speed);
    }

    setTimeout(nextSlide, speed);
}

function showPickerResult(item) {
    pickerTitle.textContent = item.t;
    const parts = [];
    if (item.y) parts.push(item.y);
    if (item.type) parts.push(item.type === 'serie' ? 'Serie' : 'Film');
    if (item.lang) parts.push(item.lang);
    if (item.g) parts.push(item.g);
    pickerMeta.textContent = parts.join(' · ');
    pickerBadges.innerHTML = '';
    pickerDesc.textContent = item.d || '';
    pickImdb.href = imdbUrl(item.t);
    pickJw.href = jwUrl(item.t);
    setTimeout(() => pickerInfo.classList.add('visible'), 200);
}

pickerBtn.addEventListener('click', openPicker);
pickClose.addEventListener('click', closePicker);
pickerOverlay.addEventListener('click', e => {
    if (e.target === pickerOverlay) closePicker();
});
pickAgain.addEventListener('click', spinPicker);
pickWatch.addEventListener('click', () => {
    if (!pickerCurrent) return;
    const key = getKey(pickerCurrent);
    const title = pickerCurrent.t;
    watched[key] = true;
    saveWatched();
    render();
    closePicker();
    showToast(`"${title}" als gezien gemarkeerd`, () => {
        delete watched[key];
        saveWatched();
        render();
    });
});

// ══════════════════════════════════════════════
// ── FEATURE 3: DRAG AND DROP ──
// ══════════════════════════════════════════════
let dragItem = null;
let dragOverCard = null;

function reorderCustomOrder(fromKey, toKey) {
    const allKeys = [...grid.querySelectorAll('.card')].map(c => c.dataset.key);
    if (customOrder.length === 0) {
        customOrder = [...allKeys];
    } else {
        allKeys.forEach(k => { if (!customOrder.includes(k)) customOrder.push(k); });
    }
    const fromIdx = customOrder.indexOf(fromKey);
    if (fromIdx > -1) customOrder.splice(fromIdx, 1);
    const newToIdx = customOrder.indexOf(toKey);
    customOrder.splice(newToIdx, 0, fromKey);
    saveCustomOrder();
}

function initDragAndDrop() {
    const cards = grid.querySelectorAll('.card[draggable="true"]');
    cards.forEach(card => {
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
        card.addEventListener('dragover', handleDragOver);
        card.addEventListener('dragenter', handleDragEnter);
        card.addEventListener('dragleave', handleDragLeave);
        card.addEventListener('drop', handleDrop);

        // Touch events for mobile
        card.addEventListener('touchstart', handleTouchStart, { passive: false });
        card.addEventListener('touchmove', handleTouchMove, { passive: false });
        card.addEventListener('touchend', handleTouchEnd);
    });
}

function handleDragStart(e) {
    dragItem = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.key);
}

function handleDragEnd() {
    this.classList.remove('dragging');
    grid.querySelectorAll('.drag-over').forEach(c => c.classList.remove('drag-over'));
    dragItem = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    e.preventDefault();
    if (this !== dragItem) {
        this.classList.add('drag-over');
    }
}

function handleDragLeave() {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    if (!dragItem || this === dragItem) return;
    reorderCustomOrder(dragItem.dataset.key, this.dataset.key);
    render();
}

// ── Touch-based drag for mobile ──
let touchDragEl = null;
let touchStartY = 0;
let touchStartX = 0;
let longPressTimer = null;
let isDraggingTouch = false;

function handleTouchStart(e) {
    if (sortSelect.value !== 'custom') return;
    const card = e.currentTarget;
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;

    longPressTimer = setTimeout(() => {
        isDraggingTouch = true;
        touchDragEl = card;
        card.classList.add('dragging');
        card.style.zIndex = '50';
        // Prevent scroll while dragging
        document.body.style.overflow = 'hidden';
    }, 400);
}

function handleTouchMove(e) {
    if (!isDraggingTouch) {
        // If moved too much, cancel the long press
        const dx = Math.abs(e.touches[0].clientX - touchStartX);
        const dy = Math.abs(e.touches[0].clientY - touchStartY);
        if (dx > 10 || dy > 10) {
            clearTimeout(longPressTimer);
        }
        return;
    }
    e.preventDefault();

    // Find card under touch
    const touchY = e.touches[0].clientY;
    const cards = [...grid.querySelectorAll('.card')];
    cards.forEach(c => c.classList.remove('drag-over'));
    for (const card of cards) {
        if (card === touchDragEl) continue;
        const rect = card.getBoundingClientRect();
        if (touchY >= rect.top && touchY <= rect.bottom) {
            card.classList.add('drag-over');
            break;
        }
    }
}

function handleTouchEnd() {
    clearTimeout(longPressTimer);
    if (!isDraggingTouch || !touchDragEl) {
        isDraggingTouch = false;
        return;
    }

    const overCard = grid.querySelector('.card.drag-over');
    if (overCard) {
        reorderCustomOrder(touchDragEl.dataset.key, overCard.dataset.key);
    }

    touchDragEl.classList.remove('dragging');
    touchDragEl.style.zIndex = '';
    grid.querySelectorAll('.drag-over').forEach(c => c.classList.remove('drag-over'));
    document.body.style.overflow = '';
    isDraggingTouch = false;
    touchDragEl = null;
    render();
}

// ══════════════════════════════════════════════
// ── FEATURE 4: TMDB AUTO-COMPLETE ──
// ══════════════════════════════════════════════
const tmdbResultsEl = document.getElementById('tmdbResults');
const tmdbSettingsBtn = document.getElementById('tmdbSettingsBtn');
const tmdbOverlay = document.getElementById('tmdbOverlay');
const tmdbKeyInput = document.getElementById('tmdbKeyInput');
const tmdbKeySave = document.getElementById('tmdbKeySave');

let selectedTmdbItem = null;
let tmdbSearchTimeout = null;
let tmdbResults = [];

// TMDB genre ID → Dutch name mapping
const TMDB_GENRES = {
    28:'Actie', 12:'Avontuur', 16:'Animatie', 35:'Komedie', 80:'Misdaad',
    99:'Documentaire', 18:'Drama', 10751:'Familie', 14:'Fantasy', 36:'Historisch',
    27:'Horror', 10402:'Muziek', 9648:'Thriller', 10749:'Romantiek',
    878:'Sci-Fi', 10752:'Oorlog', 10770:'Reality',
    // TV genres
    10759:'Actie', 10762:'Familie', 10763:'Documentaire', 10764:'Reality',
    10765:'Sci-Fi', 10766:'Drama', 10767:'Reality', 10768:'Oorlog'
};

function tmdbGenreNames(genreIds) {
    if (!genreIds || genreIds.length === 0) return '';
    const names = [...new Set(genreIds.map(id => TMDB_GENRES[id]).filter(Boolean))];
    return names.join(', ');
}

// TMDB settings
const keyToggle = document.getElementById('keyToggle');
keyToggle.addEventListener('click', () => {
    const isVisible = keyToggle.classList.toggle('visible');
    tmdbKeyInput.type = isVisible ? 'text' : 'password';
});
tmdbSettingsBtn.addEventListener('click', () => {
    tmdbOverlay.classList.add('visible');
    tmdbKeyInput.value = tmdbKey;
    tmdbKeyInput.type = 'password';
    keyToggle.classList.remove('visible');
    setTimeout(() => tmdbKeyInput.focus(), 200);
});
tmdbOverlay.addEventListener('click', e => {
    if (e.target === tmdbOverlay) tmdbOverlay.classList.remove('visible');
});
tmdbKeySave.addEventListener('click', () => {
    tmdbKey = tmdbKeyInput.value.trim();
    try { localStorage.setItem('kijklijst_tmdb_key', tmdbKey); } catch(e) {}
    syncState();
    tmdbOverlay.classList.remove('visible');
});
tmdbKeyInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') tmdbKeySave.click();
});

// Auto-complete search
addTitleInput.addEventListener('input', () => {
    clearTimeout(tmdbSearchTimeout);
    const q = addTitleInput.value.trim();
    if (!tmdbKey || q.length < 2) {
        tmdbResultsEl.classList.remove('visible');
        return;
    }
    tmdbResultsEl.innerHTML = '<div class="tmdb-loading">Zoeken...</div>';
    tmdbResultsEl.classList.add('visible');

    tmdbSearchTimeout = setTimeout(() => searchTmdb(q), 400);
});

async function searchTmdb(query) {
    try {
        const url = `https://api.themoviedb.org/3/search/multi?api_key=${encodeURIComponent(tmdbKey)}&query=${encodeURIComponent(query)}&language=nl-NL&include_adult=false`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error('API error');
        const data = await resp.json();
        const results = (data.results || []).filter(r => r.media_type === 'movie' || r.media_type === 'tv').slice(0, 8);

        if (results.length === 0) {
            tmdbResultsEl.innerHTML = '<div class="tmdb-loading">Geen resultaten</div>';
            return;
        }

        tmdbResultsEl.innerHTML = results.map((r, i) => {
            const title = r.title || r.name || '';
            const year = (r.release_date || r.first_air_date || '').slice(0, 4);
            const type = r.media_type === 'movie' ? 'Film' : 'Serie';
            const poster = r.poster_path ? `https://image.tmdb.org/t/p/w92${r.poster_path}` : '';
            return `<div class="tmdb-item" data-idx="${i}">
                ${poster ? `<img src="${poster}" alt="">` : '<img src="" alt="" style="background:rgba(255,255,255,.05)">'}
                <div class="tmdb-item-info">
                    <div class="tmdb-item-title">${escapeHtml(title)}</div>
                    <div class="tmdb-item-meta">${escapeHtml(year)} · ${type}</div>
                </div>
            </div>`;
        }).join('');

        tmdbResults = results;
    } catch(err) {
        tmdbResultsEl.innerHTML = '<div class="tmdb-loading">Fout bij zoeken. Check je API key.</div>';
    }
}

tmdbResultsEl.addEventListener('click', e => {
    const item = e.target.closest('.tmdb-item');
    if (!item) return;
    const idx = parseInt(item.dataset.idx);
    if (!tmdbResults[idx]) return;

    const r = tmdbResults[idx];
    const title = r.title || r.name || '';
    const year = (r.release_date || r.first_air_date || '').slice(0, 4);
    const type = r.media_type === 'movie' ? 'film' : 'serie';
    const desc = r.overview || '';
    const poster = r.poster_path ? `https://image.tmdb.org/t/p/w400${r.poster_path}` : '';
    const genres = tmdbGenreNames(r.genre_ids);
    const lang = mapTmdbLang(r.original_language);

    // Fill in the fields
    addTitleInput.value = title;
    document.getElementById('addYear').value = year;
    document.getElementById('addLang').value = lang;
    document.getElementById('addGenre').value = genres;
    document.getElementById('addDesc').value = desc;
    document.getElementById('addImg').value = poster;

    // Set type radio
    if (type === 'serie') document.getElementById('addSerie').checked = true;
    else document.getElementById('addFilm').checked = true;

    // Show extra fields
    addExtraFields.classList.add('visible');
    tmdbResultsEl.classList.remove('visible');
    selectedTmdbItem = r;
});

function mapTmdbLang(code) {
    const map = {
        'en': 'Engels', 'nl': 'Nederlands', 'fr': 'Frans', 'de': 'Duits',
        'es': 'Spaans', 'it': 'Italiaans', 'pt': 'Portugees', 'ja': 'Japans',
        'ko': 'Koreaans', 'zh': 'Chinees', 'ru': 'Russisch', 'sv': 'Zweeds',
        'da': 'Deens', 'no': 'Noors', 'fi': 'Fins', 'pl': 'Pools',
        'tr': 'Turks', 'ar': 'Arabisch', 'hi': 'Hindi', 'th': 'Thais',
        'he': 'Hebreeuws', 'is': 'IJslands', 'lv': 'Lets', 'cs': 'Tsjechisch',
        'hu': 'Hongaars', 'ro': 'Roemeens', 'el': 'Grieks', 'uk': 'Oekraïens'
    };
    return map[code] || code || '';
}

// ── FILTER BADGE ──
const resetFiltersBtn = document.getElementById('resetFiltersBtn');
function updateFilterBadge() {
    const typeBtn = typeFilter.querySelector('.active');
    const statusBtn = statusFilter.querySelector('.active');
    const hasActiveFilter =
        (typeBtn && typeBtn.dataset.type !== 'all') ||
        (statusBtn && statusBtn.dataset.status !== 'all') ||
        genreFilter.value !== 'all' ||
        langFilter.value !== 'all';
    filterToggle.classList.toggle('has-filters', hasActiveFilter);
    resetFiltersBtn.style.display = hasActiveFilter ? '' : 'none';
}

// ── CENTRALIZED ESCAPE KEY ──
document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (addOverlay.classList.contains('visible')) { closeAdd(); return; }
    if (pickerOverlay.classList.contains('visible')) { closePicker(); return; }
    if (tmdbOverlay.classList.contains('visible')) { tmdbOverlay.classList.remove('visible'); return; }
});

// ── SERVICE WORKER ──
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
}

// ── INIT ──
if (viewMode !== 'grid') {
    viewToggle.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    const savedBtn = viewToggle.querySelector(`[data-view="${viewMode}"]`);
    if (savedBtn) savedBtn.classList.add('active');
}
// loadState() roept render() aan na laden van server state
// Eerste render toont localStorage data; loadState overschrijft met server data
render();
loadState();
