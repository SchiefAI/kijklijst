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
                watched, ratings, order: customOrder
            })
        });
    } catch(e) { console.info('State sync niet beschikbaar:', e.message); }
}

async function loadState() {
    try {
        const resp = await fetch('/api/state');
        if (!resp.ok) return;
        const s = await resp.json();
        const hasServerState = s.watched || s.ratings || s.order;
        if (hasServerState) {
            // Server is source of truth
            if (s.watched) watched = s.watched;
            if (s.ratings) ratings = s.ratings;
            if (s.order) customOrder = s.order;
            localStorage.setItem('kijklijst_watched', JSON.stringify(watched));
            localStorage.setItem('kijklijst_ratings', JSON.stringify(ratings));
            localStorage.setItem('kijklijst_order', JSON.stringify(customOrder));
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

function safeImageUrl(raw) {
    if (!raw || typeof raw !== 'string') return '';
    const value = raw.trim();
    if (!value) return '';
    try {
        const parsed = new URL(value, window.location.origin);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
        return escapeAttr(parsed.href);
    } catch {
        return '';
    }
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
        html += `<input type="text" class="review-input" data-key="${key}" placeholder="One-liner review..." maxlength="120" value="${escapeAttr(review)}" style="${review ? 'display:none' : ''}">`;
        if (review) html += `<div class="review-text" data-key="${key}">"${escapeHtml(review)}"</div>`;
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
function populateDropdowns() {
    // Clear existing options (keep "all" option)
    while (genreFilter.options.length > 1) genreFilter.remove(1);
    while (langFilter.options.length > 1) langFilter.remove(1);

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
}
populateDropdowns();

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
        } else if (DATA.length === 0) {
            emptyHtml += 'Je kijklijst is nog leeg';
            emptyHtml += '<br><button class="empty-add-btn" onclick="openAdd()">+ Titel toevoegen</button>';
            emptyHtml += '<br><button class="empty-add-btn" onclick="openImport()">📋 Lijst importeren</button>';
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
        const imgSrc = safeImageUrl(item.img);
        const hasImg = !!imgSrc;
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
                    ${hasImg ? `<img class="poster-img" src="${imgSrc}" alt="${escapeHtml(item.t)}" style="display:block" onerror="this.style.display='none'">` : ''}
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
                ${hasImg ? `<img class="poster-img" src="${imgSrc}" alt="${escapeHtml(item.t)}" style="display:block" onerror="this.style.display='none'">` : ''}
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

// Toggle card description expand/collapse
grid.addEventListener('click', e => {
    // Don't toggle if clicking a button, link, input, or star
    if (e.target.closest('a, button, input, textarea, .star-hit, .review-text')) return;
    const desc = e.target.closest('.card-desc, .list-desc');
    if (desc) { desc.classList.toggle('expanded'); return; }
    // Click on poster or list-info to toggle description
    const card = e.target.closest('.card');
    if (!card) return;
    const clickedPoster = e.target.closest('.poster-wrap');
    const clickedInfo = e.target.closest('.list-info');
    if (clickedPoster || clickedInfo) {
        const listDesc = card.querySelector('.list-desc');
        const cardDesc = card.querySelector('.card-desc');
        const target = listDesc || cardDesc;
        if (target) target.classList.toggle('expanded');
    }
});

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
    if (!confirm(`"${title}" verwijderen van je kijklijst?`)) return;
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

// Review: click text to edit
grid.addEventListener('click', e => {
    const reviewText = e.target.closest('.review-text');
    if (!reviewText) return;
    const key = reviewText.dataset.key;
    const input = reviewText.parentElement.querySelector('.review-input');
    if (!input) return;
    reviewText.style.display = 'none';
    input.style.display = '';
    input.focus();
});
// Review: save on blur, show text again
grid.addEventListener('focusout', e => {
    if (!e.target.classList.contains('review-input')) return;
    const key = e.target.dataset.key;
    if (!key) return;
    const val = e.target.value.trim();
    if (!ratings[key]) ratings[key] = {};
    ratings[key].review = val;
    saveRatings();
    render();
});
grid.addEventListener('keydown', e => {
    if (!e.target.classList.contains('review-input')) return;
    if (e.key === 'Enter') e.target.blur();
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
    searchBox.value = '';
    updateSearchClear();
    render();
}

document.querySelector('.hero-content h1').addEventListener('click', resetFilters);

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
        img: safeImageUrl(document.getElementById('addImg').value.trim()),
        g: document.getElementById('addGenre').value.trim()
    };
    DATA.push(newItem);

    // Fetch IMDb ID in background if added via TMDB
    if (selectedTmdbItem) {
        fetchImdbId(selectedTmdbItem.id, selectedTmdbItem.media_type).then(imdbId => {
            if (imdbId) {
                IMDB[title] = imdbId;
                syncToFile();
            }
        });
    }

    syncToFile();
    closeAdd();
    searchBox.value = title;
    updateSearchClear();
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
        const imgSrc = safeImageUrl(item.img);
        if (imgSrc) {
            return `<img src="${imgSrc}" alt="${escapeHtml(item.t)}" class="${i === 0 ? 'active' : ''}">`;
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

// ══════════════════════════════════════════════
// ── FEATURE 5: BULK IMPORT ──
// ══════════════════════════════════════════════
const importOverlay = document.getElementById('importOverlay');
const importTextarea = document.getElementById('importTextarea');
const importCount = document.getElementById('importCount');
const importStart = document.getElementById('importStart');
const importCancel = document.getElementById('importCancel');
const importConfirm = document.getElementById('importConfirm');
const importReviewList = document.getElementById('importReviewList');
const importSummary = document.getElementById('importSummary');
const importProgressFill = document.getElementById('importProgressFill');
const importProgressText = document.getElementById('importProgressText');
const importProgressCurrent = document.getElementById('importProgressCurrent');

let importResults = [];
let importCancelled = false;

function showImportStep(step) {
    document.getElementById('importStepInput').style.display = step === 'input' ? '' : 'none';
    document.getElementById('importStepProgress').style.display = step === 'progress' ? '' : 'none';
    document.getElementById('importStepReview').style.display = step === 'review' ? '' : 'none';
}

function openImport() {
    if (!tmdbKey) {
        tmdbOverlay.classList.add('visible');
        tmdbKeyInput.value = tmdbKey;
        tmdbKeyInput.type = 'password';
        keyToggle.classList.remove('visible');
        setTimeout(() => tmdbKeyInput.focus(), 200);
        showToast('Stel eerst een TMDB API key in');
        return;
    }
    closeAdd();
    importTextarea.value = '';
    importCount.textContent = '0 titels';
    importResults = [];
    importCancelled = false;
    showImportStep('input');
    importOverlay.classList.add('visible');
    setTimeout(() => importTextarea.focus(), 200);
}

function closeImport() {
    importOverlay.classList.remove('visible');
    importCancelled = true;
}

function parseImportLines(text) {
    const seen = new Set();
    return text.split(/\n/)
        .map(l => l.trim())
        .filter(l => l.length > 0)
        .filter(l => {
            const key = l.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
}

async function searchTmdbSingle(query) {
    const url = `https://api.themoviedb.org/3/search/multi?api_key=${encodeURIComponent(tmdbKey)}&query=${encodeURIComponent(query)}&language=nl-NL&include_adult=false`;
    const resp = await fetch(url);
    if (resp.status === 429) {
        await new Promise(r => setTimeout(r, 2000));
        const retry = await fetch(url);
        if (!retry.ok) return null;
        const data = await retry.json();
        return (data.results || []).filter(r => r.media_type === 'movie' || r.media_type === 'tv')[0] || null;
    }
    if (!resp.ok) return null;
    const data = await resp.json();
    return (data.results || []).filter(r => r.media_type === 'movie' || r.media_type === 'tv')[0] || null;
}

function buildItemFromTmdb(r) {
    return {
        t: r.title || r.name || '',
        y: (r.release_date || r.first_air_date || '').slice(0, 4),
        type: r.media_type === 'movie' ? 'film' : 'serie',
        lang: mapTmdbLang(r.original_language),
        d: r.overview || '',
        img: r.poster_path ? `https://image.tmdb.org/t/p/w400${r.poster_path}` : '',
        g: tmdbGenreNames(r.genre_ids)
    };
}

async function fetchImdbId(tmdbId, mediaType) {
    if (!tmdbKey || !tmdbId) return null;
    const type = mediaType === 'movie' ? 'movie' : 'tv';
    try {
        const url = `https://api.themoviedb.org/3/${type}/${tmdbId}/external_ids?api_key=${encodeURIComponent(tmdbKey)}`;
        const resp = await fetch(url);
        if (resp.status === 429) {
            await new Promise(r => setTimeout(r, 2000));
            const retry = await fetch(url);
            if (!retry.ok) return null;
            const data = await retry.json();
            return data.imdb_id || null;
        }
        if (!resp.ok) return null;
        const data = await resp.json();
        return data.imdb_id || null;
    } catch {
        return null;
    }
}

async function startImportLookup(titles) {
    showImportStep('progress');
    importCancelled = false;
    importResults = [];
    const total = titles.length;

    for (let i = 0; i < total; i++) {
        if (importCancelled) break;
        const title = titles[i];
        importProgressFill.style.width = ((i + 1) / total * 100) + '%';
        importProgressText.textContent = `${i + 1} / ${total}`;
        importProgressCurrent.textContent = title;

        // Check duplicate
        const existingKey = title.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (DATA.some(d => getKey(d) === existingKey)) {
            importResults.push({ query: title, status: 'duplicate', item: null });
        } else {
            try {
                const r = await searchTmdbSingle(title);
                if (r) {
                    const imdbId = await fetchImdbId(r.id, r.media_type);
                    importResults.push({ query: title, status: 'found', item: buildItemFromTmdb(r), tmdbResult: r, imdbId });
                } else {
                    importResults.push({ query: title, status: 'not_found', item: null });
                }
            } catch {
                importResults.push({ query: title, status: 'not_found', item: null });
            }
        }
        if (i < total - 1 && !importCancelled) await new Promise(r => setTimeout(r, 250));
    }

    showImportStep('review');
    renderImportReview();
}

function renderImportReview() {
    importReviewList.innerHTML = importResults.map((r, i) => {
        const isFound = r.status === 'found';
        const isDup = r.status === 'duplicate';
        const rowClass = isDup ? 'import-row is-duplicate' : (isFound ? 'import-row' : 'import-row no-match');
        const checked = isFound ? 'checked' : '';
        const title = isFound ? escapeHtml(r.item.t) : escapeHtml(r.query);
        const meta = isFound ? `${r.item.y} · ${r.item.type === 'serie' ? 'Serie' : 'Film'}` : '';
        const reviewImgSrc = isFound ? safeImageUrl(r.item.img) : '';
        const poster = reviewImgSrc
            ? `<img class="import-row-poster" src="${reviewImgSrc.replace('/w400', '/w92')}" alt="">`
            : `<div class="import-row-poster" style="background:rgba(255,255,255,.05)"></div>`;
        const status = isDup
            ? '<span class="import-row-status duplicate">Al in je lijst</span>'
            : (!isFound ? '<span class="import-row-status not-found">Niet gevonden</span>' : '');

        return `<div class="${rowClass}">
            <input type="checkbox" data-idx="${i}" ${checked}>
            ${poster}
            <div class="import-row-info">
                <div class="import-row-title">${title}</div>
                <div class="import-row-meta">${meta}</div>
            </div>
            ${status}
        </div>`;
    }).join('');

    updateImportSummary();
    importReviewList.addEventListener('change', updateImportSummary);
}

function updateImportSummary() {
    const checks = importReviewList.querySelectorAll('input[type="checkbox"]');
    const checked = [...checks].filter(c => c.checked).length;
    importSummary.textContent = `${checked} van ${importResults.length} titels geselecteerd`;
    importConfirm.disabled = checked === 0;
    importConfirm.textContent = checked > 0 ? `${checked} titels toevoegen` : 'Toevoegen';
}

function confirmImport() {
    const checks = importReviewList.querySelectorAll('input[type="checkbox"]');
    let added = 0;
    checks.forEach(cb => {
        if (!cb.checked) return;
        const idx = parseInt(cb.dataset.idx);
        const r = importResults[idx];
        if (r && r.item) {
            DATA.push(r.item);
            if (r.imdbId) IMDB[r.item.t] = r.imdbId;
            added++;
        }
    });
    if (added > 0) {
        syncToFile();
        populateDropdowns();
        render();
        showToast(`${added} titel${added === 1 ? '' : 's'} toegevoegd`);
    }
    closeImport();
}

// Import event listeners
importTextarea.addEventListener('input', () => {
    const lines = parseImportLines(importTextarea.value);
    importCount.textContent = `${lines.length} titel${lines.length === 1 ? '' : 's'}`;
});

importStart.addEventListener('click', () => {
    if (!tmdbKey) { openImport(); return; }
    const titles = parseImportLines(importTextarea.value);
    if (titles.length === 0) { importTextarea.focus(); return; }
    startImportLookup(titles);
});

importCancel.addEventListener('click', () => { importCancelled = true; });
importConfirm.addEventListener('click', confirmImport);
document.getElementById('importBack').addEventListener('click', () => showImportStep('input'));
document.getElementById('importSelectAll').addEventListener('click', () => {
    importReviewList.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = true; });
    updateImportSummary();
});
document.getElementById('importSelectNone').addEventListener('click', () => {
    importReviewList.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = false; });
    updateImportSummary();
});
importOverlay.addEventListener('click', e => { if (e.target === importOverlay) closeImport(); });
document.getElementById('importFromAddBtn').addEventListener('click', () => { closeAdd(); openImport(); });
document.getElementById('importTmdbBtn').addEventListener('click', () => {
    tmdbOverlay.classList.add('visible');
    tmdbKeyInput.value = tmdbKey;
    tmdbKeyInput.type = 'password';
    keyToggle.classList.remove('visible');
    setTimeout(() => tmdbKeyInput.focus(), 200);
});

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
    if (importOverlay.classList.contains('visible')) { closeImport(); return; }
    if (addOverlay.classList.contains('visible')) { closeAdd(); return; }
    if (pickerOverlay.classList.contains('visible')) { closePicker(); return; }
    if (tmdbOverlay.classList.contains('visible')) { tmdbOverlay.classList.remove('visible'); return; }
});

// ── SERVICE WORKER ──
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
}

// ── BACKFILL MISSING IMDB IDS ──
async function searchTmdbTyped(query, type) {
    if (!tmdbKey) return null;
    const endpoint = type === 'serie' ? 'search/tv' : 'search/movie';
    const url = `https://api.themoviedb.org/3/${endpoint}?api_key=${encodeURIComponent(tmdbKey)}&query=${encodeURIComponent(query)}&language=nl-NL&include_adult=false`;
    try {
        const resp = await fetch(url);
        if (resp.status === 429) {
            await new Promise(r => setTimeout(r, 2000));
            const retry = await fetch(url);
            if (!retry.ok) return null;
            return (await retry.json()).results || [];
        }
        if (!resp.ok) return null;
        return (await resp.json()).results || [];
    } catch {
        return null;
    }
}

function bestTmdbMatch(results, item) {
    if (!results || results.length === 0) return null;
    const itemYear = parseInt(item.y);
    // Prefer exact year match
    if (itemYear) {
        const yearMatch = results.find(r => {
            const rYear = parseInt((r.release_date || r.first_air_date || '').slice(0, 4));
            return rYear === itemYear;
        });
        if (yearMatch) return yearMatch;
        // Accept ±1 year (release date differences between regions)
        const closeMatch = results.find(r => {
            const rYear = parseInt((r.release_date || r.first_air_date || '').slice(0, 4));
            return Math.abs(rYear - itemYear) <= 1;
        });
        if (closeMatch) return closeMatch;
    }
    // Fallback: first result only if title matches closely
    const norm = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const itemNorm = norm(item.t);
    const titleMatch = results.find(r => norm(r.title || r.name) === itemNorm);
    return titleMatch || null;
}

async function backfillImdbIds() {
    if (!tmdbKey) return;
    const missing = DATA.filter(item => item.t && !IMDB[item.t]);
    if (missing.length === 0) return;
    let updated = 0;
    for (const item of missing) {
        const results = await searchTmdbTyped(item.t, item.type);
        const match = bestTmdbMatch(results, item);
        if (!match) continue;
        const mediaType = item.type === 'serie' ? 'tv' : 'movie';
        const imdbId = await fetchImdbId(match.id, mediaType);
        if (imdbId) {
            IMDB[item.t] = imdbId;
            updated++;
        }
        await new Promise(resolve => setTimeout(resolve, 250));
    }
    if (updated > 0) {
        syncToFile();
        console.info(`Backfill: ${updated} IMDb IDs toegevoegd`);
    }
}

// ── ONE-TIME: REFRESH ALL DESCRIPTIONS FROM TMDB ──
async function refreshAllFromTmdb() {
    if (!tmdbKey) { console.warn('Geen TMDB key'); return; }
    let updated = 0;
    const total = DATA.length;
    for (let i = 0; i < total; i++) {
        const item = DATA[i];
        if (!item.t) continue;
        const results = await searchTmdbTyped(item.t, item.type);
        const match = bestTmdbMatch(results, item);
        if (!match) { console.info(`  ✗ ${item.t} — geen match`); continue; }
        const overview = match.overview || '';
        if (overview && overview !== item.d) {
            item.d = overview;
            updated++;
        }
        // Also fill missing IMDb ID while we're at it
        if (!IMDB[item.t]) {
            const mediaType = item.type === 'serie' ? 'tv' : 'movie';
            const imdbId = await fetchImdbId(match.id, mediaType);
            if (imdbId) IMDB[item.t] = imdbId;
        }
        if ((i + 1) % 10 === 0) console.info(`  ${i + 1} / ${total}...`);
        await new Promise(r => setTimeout(r, 250));
    }
    if (updated > 0) {
        syncToFile();
        render();
    }
    console.info(`Refresh klaar: ${updated} beschrijvingen bijgewerkt`);
}

// ── SCROLL TO TOP ──
const scrollTopBtn = document.getElementById('scrollTop');
window.addEventListener('scroll', () => {
    scrollTopBtn.classList.toggle('visible', window.scrollY > 400);
});
scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

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
// Backfill missing IMDb IDs silently in background
setTimeout(backfillImdbIds, 3000);
