/* ============================================================
   tvshows.js — TV Shows page JS
   ============================================================ */

let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  initFeaturedTV();
  renderAllTV('all');
  renderTop5TV();
  initFilterBtns();
});

function initFilterBtns() {
  document.querySelectorAll('.tv-filter-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.tv-filter-btn').forEach(b => {
        b.classList.remove('btn-warning', 'text-dark', 'fw-600', 'active');
        b.classList.add('btn-outline-secondary');
      });
      this.classList.add('btn-warning', 'text-dark', 'fw-600', 'active');
      this.classList.remove('btn-outline-secondary');
      renderAllTV(this.dataset.filter);
    });
  });
}

function initFeaturedTV() {
  const row = document.getElementById('featuredTVRow');
  if (!row) return;
  const trending = TV_SHOWS.filter(t => t.trending).slice(0, 3);
  row.innerHTML = trending.map((show, i) => `
    <div class="col-12 col-md-4 animate-in" style="animation-delay:${i * 0.1}s;">
      <div class="position-relative rounded-3 overflow-hidden" style="height:250px; cursor:pointer;" onclick="goToDetail(${show.id}, 'tv')">
        <img src="${show.poster}" style="width:100%;height:100%;object-fit:cover;" alt="${show.title}" loading="lazy"/>
        <div style="position:absolute;inset:0;background:linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 60%, transparent 100%);"></div>
        <div style="position:absolute;bottom:0;left:0;right:0;padding:16px;">
          <div class="d-flex align-items-center gap-2 mb-1">
            ${show.trending ? '<span class="live-badge"><span class="live-dot"></span>Trending</span>' : ''}
            <span class="badge bg-secondary">${show.status}</span>
          </div>
          <h5 class="text-white fw-bold mb-1 lh-sm">${show.title}</h5>
          <div class="d-flex align-items-center gap-2">
            <span class="text-warning fw-bold small"><i class="bi bi-star-fill me-1"></i>${show.rating}</span>
            <span class="text-muted small">${show.seasons} Seasons</span>
          </div>
        </div>
        <button class="position-absolute top-0 end-0 m-2 scroll-card-watchlist ${isInWatchlist(show.id) ? 'in-watchlist' : ''}" 
          data-watchlist-id="${show.id}" style="opacity:1;"
          onclick="event.stopPropagation(); toggleWatchlist(${show.id}, '${show.title.replace(/'/g, "\\'")}', '${show.poster}', '${show.year}', ${show.rating})">
          <i class="bi ${isInWatchlist(show.id) ? 'bi-bookmark-fill' : 'bi-bookmark-plus'}"></i>
        </button>
      </div>
    </div>`).join('');
}

function renderAllTV(filter) {
  currentFilter = filter;
  const grid = document.getElementById('allTVGrid');
  const countEl = document.getElementById('tvCount');
  if (!grid) return;

  let shows = TV_SHOWS;
  if (filter !== 'all') shows = TV_SHOWS.filter(t => t.genre.includes(filter));

  if (countEl) countEl.textContent = `${shows.length} show${shows.length !== 1 ? 's' : ''}`;

  if (!shows.length) {
    grid.innerHTML = `<div class="col-12 text-center py-5 text-muted"><i class="bi bi-tv fs-1 d-block mb-2"></i>No shows match this filter.</div>`;
    return;
  }

  grid.style.opacity = '0';
  setTimeout(() => {
    grid.innerHTML = shows.map((show, i) => `
      <div class="col-12 col-sm-6 col-md-4 col-lg-3 animate-in" style="animation-delay:${i * 0.06}s;">
        <div class="tv-card h-100" onclick="goToDetail(${show.id}, 'tv')">
          <div style="position:relative;overflow:hidden;aspect-ratio:2/3;">
            <img src="${show.poster}" style="width:100%;height:100%;object-fit:cover;transition:transform 0.5s ease;" class="tv-poster" alt="${show.title}" loading="lazy"
              onerror="this.src='https://via.placeholder.com/200x300/1e1e1e/888?text=${encodeURIComponent(show.title)}'"/>
            <div style="position:absolute;top:8px;left:8px;display:flex;gap:4px;flex-wrap:wrap;">
              <span class="badge bg-dark bg-opacity-75 text-warning fw-bold"><i class="bi bi-star-fill me-1"></i>${show.rating}</span>
            </div>
            <button class="scroll-card-watchlist ${isInWatchlist(show.id) ? 'in-watchlist' : ''}" data-watchlist-id="${show.id}"
              style="position:absolute;top:8px;right:8px;opacity:0;transition:opacity 0.2s;"
              onclick="event.stopPropagation(); toggleWatchlist(${show.id}, '${show.title.replace(/'/g, "\\'")}', '${show.poster}', '${show.year}', ${show.rating})">
              <i class="bi ${isInWatchlist(show.id) ? 'bi-bookmark-fill' : 'bi-bookmark-plus'}"></i>
            </button>
            <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(to top, rgba(0,0,0,0.85),transparent);padding:20px 10px 10px;">
              <span class="badge ${show.status === 'Ongoing' ? 'bg-success' : 'bg-secondary'} mb-1">${show.status}</span>
            </div>
          </div>
          <div class="p-3">
            <h6 class="text-white mb-1 fw-600" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${show.title}</h6>
            <p class="text-muted mb-2" style="font-size:0.75rem;">${show.year} • ${show.seasons} Seasons • ${show.episodes} Episodes</p>
            <div class="d-flex flex-wrap gap-1">
              ${show.genre.map(g => `<span class="badge bg-secondary bg-opacity-50" style="font-size:0.65rem;">${g.charAt(0).toUpperCase() + g.slice(1)}</span>`).join('')}
            </div>
          </div>
        </div>
      </div>`).join('');
    // Show watchlist buttons on hover
    grid.querySelectorAll('.tv-card').forEach(card => {
      card.addEventListener('mouseenter', () => { card.querySelector('.scroll-card-watchlist').style.opacity = '1'; });
      card.addEventListener('mouseleave', () => { 
        const btn = card.querySelector('.scroll-card-watchlist');
        if (!btn.classList.contains('in-watchlist')) btn.style.opacity = '0';
      });
    });
    grid.style.transition = 'opacity 0.3s';
    grid.style.opacity = '1';
  }, 80);
}

function renderTop5TV() {
  const container = document.getElementById('top5TV');
  if (!container) return;
  const top5 = [...TV_SHOWS].sort((a, b) => b.rating - a.rating).slice(0, 5);

  container.innerHTML = top5.map((show, i) => `
    <div class="col-12 animate-in" style="animation-delay:${i * 0.08}s;">
      <div class="d-flex gap-3 align-items-center p-3 rounded-3 mb-0" 
        style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);cursor:pointer;transition:all 0.2s ease;"
        onclick="goToDetail(${show.id}, 'tv')" 
        onmouseenter="this.style.borderColor='rgba(245,197,24,0.3)';this.style.background='rgba(255,255,255,0.05)'"
        onmouseleave="this.style.borderColor='rgba(255,255,255,0.06)';this.style.background='rgba(255,255,255,0.03)'">
        <div style="font-size:2.5rem;font-weight:900;color:${i === 0 ? 'var(--imdb-yellow)' : '#444'};width:50px;text-align:center;flex-shrink:0;">0${i + 1}</div>
        <img src="${show.poster}" style="width:60px;height:85px;object-fit:cover;border-radius:8px;flex-shrink:0;" alt="${show.title}" loading="lazy"/>
        <div class="flex-grow-1">
          <h6 class="text-white fw-bold mb-1">${show.title}</h6>
          <p class="text-muted small mb-1">${show.year} • ${show.seasons} Seasons • ${show.status}</p>
          <div class="d-flex align-items-center gap-2 flex-wrap">
            <span class="text-warning fw-bold small"><i class="bi bi-star-fill me-1"></i>${show.rating}</span>
            ${show.genre.map(g => `<span class="badge bg-secondary bg-opacity-50" style="font-size:0.65rem;">${g.charAt(0).toUpperCase() + g.slice(1)}</span>`).join('')}
          </div>
        </div>
        <button class="btn btn-sm ${isInWatchlist(show.id) ? 'btn-warning text-dark' : 'btn-outline-warning'} rounded-pill px-3 flex-shrink-0" data-watchlist-id="${show.id}"
          onclick="event.stopPropagation(); toggleWatchlist(${show.id}, '${show.title.replace(/'/g, "\\'")}', '${show.poster}', '${show.year}', ${show.rating})">
          <i class="bi ${isInWatchlist(show.id) ? 'bi-bookmark-fill' : 'bi-bookmark-plus'} me-1"></i>
          ${isInWatchlist(show.id) ? 'Saved' : 'Add'}
        </button>
      </div>
    </div>`).join('');
}
