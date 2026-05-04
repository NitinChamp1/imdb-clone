/* ============================================================
   movies.js — Movies browse page JS
   ============================================================ */

let currentView = 'grid';
let filteredMovies = [...MOVIES];
let currentPage = 1;
const ITEMS_PER_PAGE = 12;

document.addEventListener('DOMContentLoaded', async () => {
  await initTMDb();

  // Check if there's a search param or category
  const params = new URLSearchParams(window.location.search);
  const searchQ = params.get('search');
  const category = params.get('category');

  if (category) {
    let data;
    let titleText = 'Browse Movies';
    if (category === 'now_playing') {
      titleText = 'Now Playing in Theaters';
      data = await TMDB.getNowPlaying(1);
    } else if (category === 'upcoming') {
      titleText = 'Upcoming Movies';
      data = await TMDB.getUpcoming(1);
    } else if (category === 'top_rated') {
      titleText = 'Top Rated Movies';
      data = await TMDB.getTopRatedMovies(1);
    } else {
      titleText = 'Popular Movies';
      data = await TMDB.getPopularMovies(1);
    }
    
    const pageTitle = document.querySelector('.section-title');
    if (pageTitle) pageTitle.textContent = titleText;
    
    // Also update breadcrumb and document title
    document.title = `${titleText} – RNDb Clone`;
    const breadcrumb = document.querySelector('.breadcrumb .active');
    if (breadcrumb) breadcrumb.textContent = titleText;

    if (data && data.results) {
      filteredMovies = data.results.map(m => normalizeTMDb(m, 'movie'));
      // Remove local static movies
      MOVIES.length = 0;
      MOVIES.push(...filteredMovies);
    } else {
      filteredMovies = [...MOVIES];
    }
  } else if (searchQ) {
    document.getElementById('globalSearch').value = searchQ;
    filteredMovies = MOVIES.filter(m => m.title.toLowerCase().includes(searchQ.toLowerCase()));
  } else {
    // Default load some popular for generic browse
    const data = await TMDB.getPopularMovies(1);
    if (data && data.results) {
      filteredMovies = data.results.map(m => normalizeTMDb(m, 'movie'));
      MOVIES.length = 0;
      MOVIES.push(...filteredMovies);
    } else {
      filteredMovies = [...MOVIES];
    }
  }
  renderMovies();
  setView('grid');
});

function applyFilters() {
  const genre = document.getElementById('filterGenre').value;
  const yearRange = document.getElementById('filterYear').value;
  const minRating = parseFloat(document.getElementById('filterRating').value);
  const sort = document.getElementById('sortBy').value;
  const search = document.getElementById('globalSearch').value.trim().toLowerCase();

  filteredMovies = MOVIES.filter(m => {
    const matchGenre = genre === 'all' || m.genre.includes(genre);
    const matchRating = m.rating >= minRating;
    const matchSearch = !search || m.title.toLowerCase().includes(search);
    let matchYear = true;
    if (yearRange === '2020s') matchYear = m.year >= 2020;
    else if (yearRange === '2010s') matchYear = m.year >= 2010 && m.year < 2020;
    else if (yearRange === '2000s') matchYear = m.year >= 2000 && m.year < 2010;
    else if (yearRange === '1990s') matchYear = m.year >= 1990 && m.year < 2000;
    else if (yearRange === 'older') matchYear = m.year < 1990;
    return matchGenre && matchRating && matchSearch && matchYear;
  });

  // Sort
  if (sort === 'rating') filteredMovies.sort((a, b) => b.rating - a.rating);
  else if (sort === 'newest') filteredMovies.sort((a, b) => b.year - a.year);
  else if (sort === 'oldest') filteredMovies.sort((a, b) => a.year - b.year);
  else if (sort === 'title') filteredMovies.sort((a, b) => a.title.localeCompare(b.title));
  else if (sort === 'votes') filteredMovies.sort((a, b) => parseFloat(b.votes) - parseFloat(a.votes));

  currentPage = 1;
  renderMovies();
}

function resetFilters() {
  document.getElementById('filterGenre').value = 'all';
  document.getElementById('filterYear').value = 'all';
  document.getElementById('filterRating').value = '0';
  document.getElementById('sortBy').value = 'rating';
  document.getElementById('globalSearch').value = '';
  filteredMovies = [...MOVIES];
  currentPage = 1;
  renderMovies();
}

function renderMovies() {
  const container = document.getElementById('moviesContainer');
  const noResults = document.getElementById('noResults');
  const count = document.getElementById('resultsCount');

  if (!filteredMovies.length) {
    container.innerHTML = '';
    noResults.classList.remove('d-none');
    count.textContent = 'No results found';
    document.getElementById('paginationContainer').innerHTML = '';
    return;
  }

  noResults.classList.add('d-none');
  count.textContent = `Showing ${filteredMovies.length} movie${filteredMovies.length !== 1 ? 's' : ''}`;

  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = filteredMovies.slice(start, start + ITEMS_PER_PAGE);

  if (currentView === 'grid') {
    container.innerHTML = paginated.map((m, i) => `
      <div class="col-6 col-md-4 col-lg-3 col-xl-2 animate-in" style="animation-delay:${i * 0.04}s;">
        <div class="movie-card h-100" onclick="goToDetail(${m.id}, '${m.type}')">
          <div class="movie-poster-wrap">
            <img class="movie-poster" src="${m.poster}" alt="${m.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/200x300/1e1e1e/888?text=${encodeURIComponent(m.title)}'"/>
            <div class="movie-rank">#${m.ranked}</div>
            <button class="movie-watchlist-btn ${isInWatchlist(m.id) ? 'in-watchlist' : ''}" data-watchlist-id="${m.id}"
              onclick="event.stopPropagation(); toggleWatchlist(${m.id}, '${m.title.replace(/'/g, "\\'").replace(/"/g, "&quot;")}', '${m.poster}', ${m.year}, ${m.rating}, 'movie')">
              <i class="bi ${isInWatchlist(m.id) ? 'bi-bookmark-fill' : 'bi-bookmark-plus'}"></i>
            </button>
            <div class="movie-overlay">
              <div class="movie-overlay-actions">
                <button class="movie-play-btn" onclick="event.stopPropagation(); goToDetail(${m.id}, '${m.type}')">
                  <i class="bi bi-play-fill"></i>
                </button>
              </div>
            </div>
          </div>
          <div class="movie-info">
            <div class="movie-title">${m.title}</div>
            <div class="movie-meta">
              <span class="movie-year">${m.year}</span>
              <span class="movie-genre-badge">${m.genre[0].charAt(0).toUpperCase() + m.genre[0].slice(1)}</span>
            </div>
            <div class="movie-rating">
              <i class="bi bi-star-fill rating-star"></i>${m.rating}
              <span class="text-muted fw-400 small ms-1">(${m.votes})</span>
            </div>
          </div>
        </div>
      </div>`).join('');
  } else {
    // List view
    container.innerHTML = `<div class="col-12"><div class="d-flex flex-column gap-3">` +
      paginated.map((m, i) => `
        <div class="watchlist-item animate-in" style="animation-delay:${i * 0.04}s; cursor:pointer;" onclick="goToDetail(${m.id}, '${m.type}')">
          <img class="watchlist-poster" src="${m.poster}" alt="${m.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/90x130/1e1e1e/888?text=?'" style="height:130px;"/>
          <div class="watchlist-info flex-grow-1">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <span class="badge bg-secondary me-2 mb-1">#${m.ranked}</span>
                <h5 class="watchlist-title d-inline">${m.title}</h5>
              </div>
              <button class="btn btn-sm ${isInWatchlist(m.id) ? 'btn-warning' : 'btn-outline-warning'} rounded-pill px-3 ms-2 flex-shrink-0" data-watchlist-id="${m.id}"
                onclick="event.stopPropagation(); toggleWatchlist(${m.id}, '${m.title.replace(/'/g, "\\'").replace(/"/g, "&quot;")}', '${m.poster}', ${m.year}, ${m.rating}, 'movie')">
                <i class="bi ${isInWatchlist(m.id) ? 'bi-bookmark-fill' : 'bi-bookmark-plus'} me-1"></i>
                ${isInWatchlist(m.id) ? 'Saved' : 'Watchlist'}
              </button>
            </div>
            <p class="watchlist-meta">${m.year} • ${m.runtime} • ${m.pg} • ${m.genre.map(g => g.charAt(0).toUpperCase() + g.slice(1)).join(', ')}</p>
            <p class="text-muted small mb-2" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${m.description}</p>
            <div class="watchlist-rating"><i class="bi bi-star-fill me-1"></i>${m.rating} <span class="text-muted small">(${m.votes})</span></div>
          </div>
        </div>`).join('') + `</div></div>`;
  }

  renderPagination();
  container.style.opacity = '0';
  setTimeout(() => { container.style.transition = 'opacity 0.3s'; container.style.opacity = '1'; }, 50);
}

function renderPagination() {
  const totalPages = Math.ceil(filteredMovies.length / ITEMS_PER_PAGE);
  const container = document.getElementById('paginationContainer');
  if (totalPages <= 1) { container.innerHTML = ''; return; }

  let html = `<nav><ul class="pagination gap-1">`;
  html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
    <button class="page-link bg-transparent border-secondary text-white rounded" onclick="changePage(${currentPage - 1})"><i class="bi bi-chevron-left"></i></button></li>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<li class="page-item">
      <button class="page-link rounded ${i === currentPage ? 'bg-warning text-dark border-warning fw-bold' : 'bg-transparent border-secondary text-white'}" onclick="changePage(${i})">${i}</button></li>`;
  }
  html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
    <button class="page-link bg-transparent border-secondary text-white rounded" onclick="changePage(${currentPage + 1})"><i class="bi bi-chevron-right"></i></button></li>`;
  html += `</ul></nav>`;
  container.innerHTML = html;
}

function changePage(page) {
  currentPage = page;
  renderMovies();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setView(view) {
  currentView = view;
  document.getElementById('viewGrid')?.classList.toggle('btn-warning', view === 'grid');
  document.getElementById('viewGrid')?.classList.toggle('text-dark', view === 'grid');
  document.getElementById('viewList')?.classList.toggle('btn-warning', view === 'list');
  document.getElementById('viewList')?.classList.toggle('text-dark', view === 'list');
  const label = document.getElementById('currentViewLabel');
  if (label) label.textContent = view === 'grid' ? 'Grid' : 'List';
  renderMovies();
}
