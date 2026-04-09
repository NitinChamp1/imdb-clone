/* ============================================================
   watchlist.js — Watchlist page JS
   ============================================================ */

let currentSort = 'newest';

document.addEventListener('DOMContentLoaded', () => {
  renderWatchlistPage();
});

function renderWatchlistPage() {
  const list = getWatchlist();
  const countEl = document.getElementById('watchlistCountText');
  const statsBar = document.getElementById('watchlistStatsBar');
  const controls = document.getElementById('watchlistControls');
  const actions = document.getElementById('watchlistHeaderActions');
  const container = document.getElementById('watchlistItems');

  if (countEl) countEl.textContent = `${list.length} item${list.length !== 1 ? 's' : ''}`;

  if (!list.length) {
    if (statsBar) statsBar.classList.add('d-none');
    if (controls) controls.style.setProperty('display', 'none', 'important');
    if (actions) actions.innerHTML = '';
    container.innerHTML = `
      <div class="empty-watchlist">
        <i class="bi bi-bookmark text-warning"></i>
        <h4>Your Watchlist is Empty</h4>
        <p class="mb-5">Save movies and TV shows you want to watch later.<br class="d-none d-sm-block"/> Your watchlist will appear here.</p>
        <div class="d-flex gap-4 justify-content-center flex-wrap">
          <a href="movies.html" class="empty-cta-card empty-cta-movies">
            <div class="empty-cta-icon"><i class="bi bi-film"></i></div>
            <div class="empty-cta-label">Browse Movies</div>
            <div class="empty-cta-sub">20+ top-rated films</div>
          </a>
          <a href="tvshows.html" class="empty-cta-card empty-cta-tv">
            <div class="empty-cta-icon"><i class="bi bi-tv"></i></div>
            <div class="empty-cta-label">Browse TV Shows</div>
            <div class="empty-cta-sub">Top series & dramas</div>
          </a>
        </div>
      </div>`;
    return;
  }

  // Stats
  const avgRating = (list.reduce((sum, i) => sum + parseFloat(i.rating), 0) / list.length).toFixed(1);
  if (statsBar) {
    statsBar.classList.remove('d-none');
    document.getElementById('statsCards').innerHTML = `
      <div class="col-6 col-md-3">
        <div class="rating-box text-center w-100">
          <div class="rating-value">${list.length}</div>
          <div class="rating-count">Total Items</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="rating-box text-center w-100">
          <div class="rating-value text-warning"><i class="bi bi-star-fill me-1" style="font-size:1.4rem;"></i>${avgRating}</div>
          <div class="rating-count">Avg Rating</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="rating-box text-center w-100">
          <div class="rating-value text-info">${list.filter(i => {
            const m = [...MOVIES, ...TV_SHOWS].find(x => x.id === i.id);
            return m && m.type === 'movie';
          }).length}</div>
          <div class="rating-count">Movies</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="rating-box text-center w-100">
          <div class="rating-value text-success">${list.filter(i => {
            const m = [...MOVIES, ...TV_SHOWS].find(x => x.id === i.id);
            return m && m.type === 'tv';
          }).length}</div>
          <div class="rating-count">TV Shows</div>
        </div>
      </div>`;
  }

  if (controls) controls.style.removeProperty('display');
  if (actions) actions.innerHTML = `
    <button class="btn btn-sm btn-outline-danger rounded-pill px-3" onclick="clearAllWatchlist()">
      <i class="bi bi-trash me-1"></i>Clear All
    </button>`;

  renderSortedList(list, currentSort);
}

function renderSortedList(list, sort) {
  let sorted = [...list];
  if (sort === 'newest') sorted.sort((a, b) => b.addedAt - a.addedAt);
  else if (sort === 'oldest') sorted.sort((a, b) => a.addedAt - b.addedAt);
  else if (sort === 'rating') sorted.sort((a, b) => b.rating - a.rating);
  else if (sort === 'title') sorted.sort((a, b) => a.title.localeCompare(b.title));

  const container = document.getElementById('watchlistItems');
  container.innerHTML = sorted.map((item, i) => {
    const fullItem = [...MOVIES, ...TV_SHOWS].find(m => m.id === item.id);
    const addedDate = new Date(item.addedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `
      <div class="watchlist-item mb-3 animate-in" style="animation-delay:${i * 0.05}s;" id="wl-item-${item.id}">
        <img class="watchlist-poster" src="${item.poster}" alt="${item.title}" style="height:130px;cursor:pointer;" 
          onclick="goToDetail(${item.id}, '${fullItem?.type || 'movie'}')"
          onerror="this.src='https://via.placeholder.com/90x130/1e1e1e/888?text=?'"/>
        <div class="watchlist-info flex-grow-1">
          <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
            <div style="cursor:pointer;" onclick="goToDetail(${item.id}, '${fullItem?.type || 'movie'}')">
              <div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
                <h5 class="watchlist-title mb-0">${item.title}</h5>
                ${fullItem?.type === 'tv' ? '<span class="badge bg-info text-dark" style="font-size:0.65rem;">TV</span>' : '<span class="badge bg-secondary" style="font-size:0.65rem;">Movie</span>'}
              </div>
              <p class="watchlist-meta mb-1">
                ${item.year} 
                ${fullItem?.runtime ? `• ${fullItem.runtime}` : ''}
                ${fullItem?.pg ? `• ${fullItem.pg}` : ''}
                ${fullItem?.genre ? `• ${fullItem.genre.map(g => g.charAt(0).toUpperCase() + g.slice(1)).join(', ')}` : ''}
              </p>
              ${fullItem?.description ? `<p class="text-muted small mb-2" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${fullItem.description}</p>` : ''}
            </div>
            <div class="text-end flex-shrink-0">
              <div class="watchlist-rating mb-2"><i class="bi bi-star-fill me-1"></i>${item.rating}</div>
              <div class="text-muted" style="font-size:0.7rem;">Added ${addedDate}</div>
            </div>
          </div>
          <div class="watchlist-actions">
            <button class="btn btn-sm btn-warning rounded-pill px-3 fw-600" onclick="goToDetail(${item.id}, '${fullItem?.type || 'movie'}')">
              <i class="bi bi-info-circle me-1"></i>Details
            </button>
            <button class="btn btn-sm btn-outline-danger rounded-pill px-3" onclick="removeFromWatchlist(${item.id}, '${item.title.replace(/'/g, "\\'")}')">
              <i class="bi bi-bookmark-x me-1"></i>Remove
            </button>
            <button class="btn btn-sm btn-outline-secondary rounded-pill px-3">
              <i class="bi bi-share me-1"></i>Share
            </button>
          </div>
        </div>
      </div>`;
  }).join('');
}

function sortWatchlist(sort, btn) {
  currentSort = sort;
  document.querySelectorAll('[data-sort]').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderSortedList(getWatchlist(), sort);
}

function removeFromWatchlist(id, title) {
  const list = getWatchlist();
  const idx = list.findIndex(w => w.id === id);
  if (idx !== -1) {
    list.splice(idx, 1);
    saveWatchlist(list);
    // Animate out
    const el = document.getElementById(`wl-item-${id}`);
    if (el) {
      el.style.transition = 'all 0.3s ease';
      el.style.opacity = '0';
      el.style.transform = 'translateX(-30px)';
      setTimeout(() => { el.remove(); renderWatchlistPage(); }, 350);
    }
    updateWatchlistButtons(id, false);
    updateWatchlistCount();
    showToast(`<i class="bi bi-bookmark-x me-2 text-danger"></i><strong>${title}</strong> removed.`, 'danger');
  }
}

function clearAllWatchlist() {
  if (!confirm('Are you sure you want to clear your entire watchlist?')) return;
  saveWatchlist([]);
  updateWatchlistCount();
  renderWatchlistPage();
  showToast('<i class="bi bi-trash me-2 text-warning"></i>Watchlist cleared.');
}
