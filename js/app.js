/* ============================================================
   app.js — Shared utilities for IMDb Clone
   ============================================================ */

// ---- Watchlist Management (localStorage) ----
const WATCHLIST_KEY = 'imdb_clone_watchlist';

function getWatchlist() {
  try { return JSON.parse(localStorage.getItem(WATCHLIST_KEY)) || []; }
  catch { return []; }
}

function saveWatchlist(list) {
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
}

function toggleWatchlist(id, title, poster, year, rating) {
  const list = getWatchlist();
  const idx = list.findIndex(w => w.id === id);
  let added = false;
  if (idx === -1) {
    list.push({ id, title, poster, year, rating, addedAt: Date.now() });
    added = true;
  } else {
    list.splice(idx, 1);
  }
  saveWatchlist(list);
  updateWatchlistButtons(id, added);
  updateWatchlistCount();
  showToast(added ? `<i class="bi bi-bookmark-fill me-2 text-warning"></i><strong>${title}</strong> added to Watchlist!` : `<i class="bi bi-bookmark-x me-2 text-danger"></i><strong>${title}</strong> removed from Watchlist.`, added ? 'success' : 'danger');
  return added;
}

function isInWatchlist(id) {
  return getWatchlist().some(w => w.id === id);
}

function updateWatchlistButtons(id, added) {
  document.querySelectorAll(`[data-watchlist-id="${id}"]`).forEach(btn => {
    if (added) {
      btn.classList.add('in-watchlist');
      btn.querySelector('i') && (btn.querySelector('i').className = 'bi bi-bookmark-fill');
    } else {
      btn.classList.remove('in-watchlist');
      btn.querySelector('i') && (btn.querySelector('i').className = 'bi bi-bookmark-plus');
    }
  });
}

function updateWatchlistCount() {
  const count = getWatchlist().length;
  const badge = document.getElementById('navWatchlistCount');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline' : 'none';
  }
}

// ---- Toast Notification ----
function showToast(msg, type = 'success') {
  const toast = document.getElementById('mainToast');
  const body = document.getElementById('toastBody');
  if (!toast || !body) return;
  body.innerHTML = msg;
  toast.className = 'toast align-items-center border-0 text-white';
  toast.classList.add(type === 'success' ? 'bg-success' : type === 'danger' ? 'bg-dark' : 'bg-dark');
  const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
  bsToast.show();
}

// ---- Star Rating Display ----
function renderStars(rating) {
  const full = Math.floor(rating / 2);
  const half = (rating / 2) - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return `${'<i class="bi bi-star-fill star-icon"></i>'.repeat(full)}${half ? '<i class="bi bi-star-half star-icon"></i>' : ''}${'<i class="bi bi-star star-icon" style="color:#555;"></i>'.repeat(empty)}`;
}

// ---- Navigate to Movie Detail ----
function goToDetail(id, type = 'movie') {
  window.location.href = `detail.html?id=${id}&type=${type}`;
}

// ---- Scroll Button Handler ----
function initScrollButtons(prevId, nextId, containerId, amount = 600) {
  const prev = document.getElementById(prevId);
  const next = document.getElementById(nextId);
  const container = document.getElementById(containerId);
  if (!prev || !next || !container) return;
  prev.addEventListener('click', () => container.scrollBy({ left: -amount, behavior: 'smooth' }));
  next.addEventListener('click', () => container.scrollBy({ left: amount, behavior: 'smooth' }));
}

// ---- Back to Top ----
const backToTop = document.getElementById('backToTop');
window.addEventListener('scroll', () => {
  if (backToTop) backToTop.classList.toggle('visible', window.scrollY > 400);
});
function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

// ---- Navbar scroll effect ----
const navbar = document.getElementById('mainNavbar');
window.addEventListener('scroll', () => {
  if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// ---- Live Search ----
const globalSearch = document.getElementById('globalSearch');
const searchSuggestions = document.getElementById('searchSuggestions');

if (globalSearch) {
  let debounceTimer;
  globalSearch.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const query = e.target.value.trim();
    if (query.length < 2) { searchSuggestions.style.display = 'none'; return; }
    debounceTimer = setTimeout(() => showSuggestions(query), 200);
  });

  globalSearch.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') performSearch();
    if (e.key === 'Escape') searchSuggestions.style.display = 'none';
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-bar-group')) searchSuggestions.style.display = 'none';
  });
}

function showSuggestions(query) {
  const cat = document.getElementById('searchCategory')?.value || 'all';
  let data = ALL_CONTENT;
  if (cat === 'movies') data = MOVIES;
  if (cat === 'tv') data = TV_SHOWS;
  if (cat === 'people') { searchSuggestions.style.display = 'none'; return; }

  const results = data.filter(m => m.title.toLowerCase().includes(query.toLowerCase())).slice(0, 6);
  if (!results.length) { searchSuggestions.style.display = 'none'; return; }

  searchSuggestions.innerHTML = results.map(m => `
    <div class="suggestion-item" onclick="goToDetail(${m.id}, '${m.type}')">
      <img class="suggestion-thumb" src="${m.poster}" alt="${m.title}" onerror="this.src='https://via.placeholder.com/42x60/222/888?text=?'"/>
      <div class="suggestion-info">
        <div class="suggestion-title">${highlightMatch(m.title, query)}</div>
        <div class="suggestion-meta">${m.type === 'tv' ? 'TV Show' : 'Movie'} • ${m.year}</div>
        <div class="suggestion-rating"><i class="bi bi-star-fill me-1"></i>${m.rating}</div>
      </div>
    </div>`).join('');
  searchSuggestions.style.display = 'block';
}

function highlightMatch(text, query) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return text.slice(0, idx) + `<span class="text-warning fw-bold">${text.slice(idx, idx + query.length)}</span>` + text.slice(idx + query.length);
}

function performSearch() {
  const query = document.getElementById('globalSearch')?.value.trim();
  if (!query) return;
  window.location.href = `movies.html?search=${encodeURIComponent(query)}`;
}

// ---- Newsletter ----
function subscribeNewsletter(e) {
  e.preventDefault();
  const msg = document.getElementById('subscribeMsg');
  if (msg) { msg.style.display = 'block'; }
  document.getElementById('newsletterEmail').value = '';
}

// ---- Recently Viewed ----
const RECENT_KEY = 'imdb_clone_recent';
function addToRecentlyViewed(item) {
  let recent = getRecentlyViewed();
  recent = recent.filter(r => r.id !== item.id);
  recent.unshift(item);
  recent = recent.slice(0, 10);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
}
function getRecentlyViewed() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; }
  catch { return []; }
}
function clearRecentlyViewed() {
  localStorage.removeItem(RECENT_KEY);
  const sec = document.getElementById('recentlyViewedSection');
  if (sec) sec.style.display = 'none!important';
}

// ---- Initialize on load ----
document.addEventListener('DOMContentLoaded', () => {
  updateWatchlistCount();
});
