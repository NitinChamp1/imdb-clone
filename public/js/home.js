/* ============================================================
   home.js — Homepage-specific JS for IMDb Clone
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  // Boot TMDb (warms genre cache + starts live search)
  await initTMDb();

  // Show skeletons immediately while data loads
  showSkeletons();

  // Load all sections in parallel from TMDb (falls back to static if no key)
  const [heroData, featuredData, topRatedData, trendingData, topTVData] = await Promise.all([
    loadHeroFromTMDb(),
    loadFeaturedFromTMDb(),
    loadTopRatedFromTMDb(),
    loadTrendingFromTMDb('movie'),
    loadTopTVFromTMDb(),
  ]);

  initHeroCarousel(heroData);
  initFeaturedSection('all', featuredData);
  initTopRated(topRatedData);
  initTrending('movies', trendingData);
  initFanFavorites(featuredData);
  initOriginalsGrid();
  initTopTV(topTVData);
  initTopTV(topTVData);
  initScrollButtonsAll();
  
  // Custom Sections Initialization
  const popularBtn = document.querySelector('#whatsPopularToggle .toggle-btn.active');
  if (popularBtn) {
    loadWhatsPopular(popularBtn, 'streaming');
    setTimeout(() => initPillBg(popularBtn), 100);
  }
  const freeBtn = document.querySelector('#freeToWatchToggle .toggle-btn.active');
  if (freeBtn) {
    loadFreeToWatch(freeBtn, 'movies');
    setTimeout(() => initPillBg(freeBtn), 100);
  }
  
  animateSections();
});

function initPillBg(btn) {
  const bg = btn.parentElement.querySelector('.toggle-bg');
  bg.style.width = btn.offsetWidth + 'px';
  bg.style.left = btn.offsetLeft + 'px';
}

function formatDateFull(dateStr) {
  if (!dateStr) return 'N/A';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  try {
    return new Date(dateStr).toLocaleDateString('en-US', options);
  } catch {
    return dateStr;
  }
}

function makeCleanCard(m) {
  return `
    <div class="tmdb-clean-card animate-in" onclick="goToDetail(${m.id}, '${m.type}')" style="opacity:1; animation-delay: 0s;">
      <div class="poster-wrapper">
        <img src="${m.poster}" alt="${m.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/150x225/1e1e1e/888?text=?'"/>
        <button class="card-options ${isInWatchlist(m.id) ? 'text-warning' : ''}" data-watchlist-id="${m.id}" 
          onclick="event.stopPropagation(); toggleWatchlist(${m.id}, '${m.title.replace(/'/g, "\\'")}', '${m.poster}', '${m.year}', ${m.rating})">
          <i class="bi ${isInWatchlist(m.id) ? 'bi-check-circle-fill' : 'bi-three-dots'}"></i>
        </button>
      </div>
      <h6 title="${m.title}">${m.title}</h6>
      <p>${formatDateFull(m.fullDate || m.year)}</p>
    </div>`;
}

async function loadWhatsPopular(btn, type) {
  if (btn) {
    const parent = btn.parentElement;
    parent.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const bg = parent.querySelector('.toggle-bg');
    bg.style.width = btn.offsetWidth + 'px';
    bg.style.left = btn.offsetLeft + 'px';
  }
  
  const container = document.getElementById('whatsPopularContainer');
  if (!container) return;
  container.innerHTML = `<div class="p-3 text-muted w-100 text-center"><div class="spinner-border text-secondary" role="status"></div></div>`;
  
  let data;
  if(type === 'streaming') data = await TMDB.getTrending('all', 'week');
  else if(type === 'on_tv') data = await TMDB.getPopularTV(1);
  else if(type === 'for_rent') data = await TMDB.discoverMovies({ sortBy: 'revenue.desc' });
  else if(type === 'in_theaters') data = await TMDB.getNowPlaying(1);
  
  if(!data) { container.innerHTML = ''; return; }
  container.innerHTML = data.results.map(item => makeCleanCard(normalizeTMDb(item))).join('');
}

async function loadFreeToWatch(btn, type) {
  if (btn) {
    const parent = btn.parentElement;
    parent.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const bg = parent.querySelector('.toggle-bg');
    bg.style.width = btn.offsetWidth + 'px';
    bg.style.left = btn.offsetLeft + 'px';
  }
  
  const container = document.getElementById('freeToWatchContainer');
  if (!container) return;
  container.innerHTML = `<div class="p-3 text-muted w-100 text-center"><div class="spinner-border text-secondary" role="status"></div></div>`;
  
  let data;
  if(type === 'movies') data = await TMDB.discoverMovies({ sortBy: 'popularity.desc', minRating: 6 });
  else data = await TMDB.discoverTV({ sortBy: 'popularity.desc' });
  
  if(!data) { container.innerHTML = ''; return; }
  container.innerHTML = data.results.map(item => makeCleanCard(normalizeTMDb(item, type === 'tv' ? 'tv' : 'movie'))).join('');
}

function showSkeletons() {
  const skeletonCard = `<div class="col-6 col-md-4 col-lg-3"><div class="skeleton" style="aspect-ratio:2/3;border-radius:12px;"></div><div class="skeleton mt-2" style="height:14px;border-radius:6px;width:80%;"></div><div class="skeleton mt-1" style="height:12px;border-radius:6px;width:50%;"></div></div>`;
  const grid = document.getElementById('featuredMoviesGrid');
  if (grid) grid.innerHTML = skeletonCard.repeat(8);
}

// ---- HERO CAROUSEL ----
function initHeroCarousel(liveData) {
  const inner = document.getElementById('heroCarouselInner');
  if (!inner) return;

  const movies = (liveData && liveData.length) ? liveData : HERO_MOVIES;
  movies.forEach((m, i) => {
    const div = document.createElement('div');
    div.className = `carousel-item${i === 0 ? ' active' : ''}`;
    div.innerHTML = `
      <div class="hero-item position-relative" style="background-image:url('${m.backdrop}'); background-size:cover; background-position:center; min-height:70vh;">
        <div style="position:absolute;inset:0;background:linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.0) 40%, rgba(18,18,18,0.97) 100%);"></div>
        <div class="container-fluid px-4 position-relative" style="z-index:2; padding-top:120px; padding-bottom:60px;">
          <div class="row">
            <div class="col-md-8 col-lg-6">
              <div class="hero-badge">
                <i class="bi bi-star-fill"></i> IMDb Top ${m.ranked}
              </div>
              <h1 class="hero-title">${m.title}</h1>
              <div class="hero-meta">
                <div class="hero-rating"><i class="bi bi-star-fill me-1"></i>${m.rating}</div>
                <span class="hero-year">${m.year}</span>
                <span class="hero-genre">${Array.isArray(m.genre) ? m.genre.map(g => g.charAt(0).toUpperCase() + g.slice(1)).join(', ') : m.genre}</span>
                ${m.runtime ? `<span class="hero-year">${m.runtime}</span>` : ''}
              </div>
              <p class="hero-desc">${m.description}</p>
              <div class="hero-actions">
                <button class="btn-hero-primary" onclick="goToDetail(${m.id}, '${m.type}')">
                  <i class="bi bi-play-fill me-2"></i>More Info
                </button>
                <button class="btn-hero-secondary" onclick="toggleWatchlist(${m.id}, '${m.title.replace(/'/g, "\\'")}', '${m.poster}', ${m.year}, ${m.rating})" data-watchlist-id="${m.id}" id="heroWL${m.id}">
                  <i class="bi ${isInWatchlist(m.id) ? 'bi-bookmark-fill text-warning' : 'bi-bookmark-plus'}"></i>
                  ${isInWatchlist(m.id) ? 'In Watchlist' : 'Add to Watchlist'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>`;
    inner.appendChild(div);
  });
  
  // Re-initialize Bootstrap Carousel after appending dynamic content so arrows work
  const carouselEl = document.getElementById('heroCarousel');
  if (!carouselEl) return;
  
  const bsCarousel = new bootstrap.Carousel(carouselEl, {
    interval: 5000,
    ride: 'carousel'
  });

  // Manually re-bind control buttons to fix dynamic DOM interruption
  const prevBtn = carouselEl.querySelector('.carousel-control-prev');
  const nextBtn = carouselEl.querySelector('.carousel-control-next');
  if (prevBtn) {
    // Remove existing bootstrap listeners to avoid double firing if it did work
    const newPrev = prevBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrev, prevBtn);
    newPrev.addEventListener('click', (e) => { e.preventDefault(); bsCarousel.prev(); });
  }
  if (nextBtn) {
    const newNext = nextBtn.cloneNode(true);
    nextBtn.parentNode.replaceChild(newNext, nextBtn);
    newNext.addEventListener('click', (e) => { e.preventDefault(); bsCarousel.next(); });
  }
}

// ---- FEATURED TODAY (Grid with genre filter) ----
let _featuredLiveData = null;   // cache live data for genre tab re-filters
function initFeaturedSection(filter, liveData) {
  const grid = document.getElementById('featuredMoviesGrid');
  if (!grid) return;

  if (liveData) _featuredLiveData = liveData;  // cache on first call

  // Use live TMDb data when available, else fall back to static
  let movies = _featuredLiveData
    ? (filter === 'all' ? _featuredLiveData : _featuredLiveData.filter(m => m.genre?.includes(filter)))
    : (filter === 'all' ? MOVIES.filter(m => m.featured) : MOVIES.filter(m => m.featured && m.genre.includes(filter)));

  if (!movies.length) {
    grid.innerHTML = `<div class="col-12 text-center text-muted py-5"><i class="bi bi-emoji-frown fs-2 mb-2 d-block"></i>No movies found for this genre.</div>`;
    return;
  }

  grid.style.opacity = '0';
  setTimeout(() => {
    grid.innerHTML = movies.slice(0, 8).map((m, i) => `
      <div class="col-6 col-md-4 col-lg-3 animate-in" style="animation-delay:${i * 0.05}s;">
        <div class="movie-card" onclick="goToDetail(${m.id}, '${m.type}')">
          <div class="movie-poster-wrap">
            <img class="movie-poster" src="${m.poster}" alt="${m.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/200x300/1e1e1e/888?text=${encodeURIComponent(m.title)}'"/>
            <div class="movie-rank">#${m.ranked}</div>
            <button class="movie-watchlist-btn ${isInWatchlist(m.id) ? 'in-watchlist' : ''}" 
              data-watchlist-id="${m.id}"
              onclick="event.stopPropagation(); toggleWatchlist(${m.id}, '${m.title.replace(/'/g, "\\'")}', '${m.poster}', ${m.year}, ${m.rating})">
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
    grid.style.transition = 'opacity 0.3s';
    grid.style.opacity = '1';
  }, 100);

  // Genre tab listeners
  document.querySelectorAll('.genre-tab').forEach(tab => {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.genre-tab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      initFeaturedSection(this.dataset.filter);
    });
  });
}

// ---- TOP RATED (Horizontal scroll) ----
function initTopRated(liveData) {
  const container = document.getElementById('topRatedContainer');
  if (!container) return;
  const source = (liveData && liveData.length) ? liveData : [...MOVIES].sort((a, b) => b.rating - a.rating).slice(0, 15);
  container.innerHTML = source.map((m, i) => makeScrollCard({ ...m, ranked: m.ranked || i + 1 })).join('');
}

// ---- TRENDING ----
let currentTrendingType = 'movies';
let _trendingLiveMovies = null;
let _trendingLiveTV = null;

function initTrending(type, liveData) {
  currentTrendingType = type;
  if (liveData && type === 'movies') _trendingLiveMovies = liveData;
  if (liveData && type === 'tv')   _trendingLiveTV = liveData;
  const container = document.getElementById('trendingContainer');
  if (!container) return;

  const staticData = type === 'movies' ? MOVIES.filter(m => m.trending) : TV_SHOWS.filter(m => m.trending);
  const liveSource = type === 'movies' ? _trendingLiveMovies : _trendingLiveTV;
  const data = (liveSource && liveSource.length) ? liveSource : staticData;

  container.innerHTML = data.map(m => makeScrollCard(m)).join('');

  document.getElementById('trendingMovies')?.classList.toggle('btn-warning', type === 'movies');
  document.getElementById('trendingMovies')?.classList.toggle('text-dark', type === 'movies');
  document.getElementById('trendingTV')?.classList.toggle('btn-warning', type === 'tv');
  document.getElementById('trendingTV')?.classList.toggle('text-dark', type === 'tv');
}

async function switchTrending(type) {
  if ((type === 'tv' && !_trendingLiveTV) || (type === 'movies' && !_trendingLiveMovies)) {
    const live = await loadTrendingFromTMDb(type === 'tv' ? 'tv' : 'movie');
    initTrending(type, live);
  } else {
    initTrending(type);
  }
}

// ---- FAN FAVORITES ----
function initFanFavorites(liveData) {
  const grid = document.getElementById('fanFavoritesGrid');
  if (!grid) return;
  // Live: use top 8 from popular; Static: filter fanFav flag
  const favs = (liveData && liveData.length)
    ? liveData.slice(0, 8)
    : MOVIES.filter(m => m.fanFav).slice(0, 8);

  grid.innerHTML = favs.map((m, i) => `
    <div class="col-12 col-md-6 col-xl-3 animate-in" style="animation-delay:${i * 0.06}s;">
      <div class="fan-fav-card" onclick="goToDetail(${m.id}, '${m.type}')">
        <img class="fan-fav-poster" src="${m.poster}" alt="${m.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/70x100/1e1e1e/888?text=?'"/>
        <div class="fan-fav-info">
          <div class="fan-fav-rank">Rank #${m.ranked}</div>
          <div class="fan-fav-title">${m.title}</div>
          <div class="fan-fav-rating"><i class="bi bi-star-fill me-1"></i>${m.rating} <span class="text-muted fw-normal small">(${m.votes})</span></div>
          <div class="fan-fav-year">${m.year} • ${m.runtime}</div>
          <div class="fan-fav-genre">${m.genre.map(g => g.charAt(0).toUpperCase() + g.slice(1)).join(', ')}</div>
          <button class="watchlist-btn-sm ${isInWatchlist(m.id) ? 'in-watchlist' : ''}" data-watchlist-id="${m.id}"
            onclick="event.stopPropagation(); toggleWatchlist(${m.id}, '${m.title.replace(/'/g, "\\'")}', '${m.poster}', ${m.year}, ${m.rating})">
            <i class="bi ${isInWatchlist(m.id) ? 'bi-bookmark-fill' : 'bi-bookmark-plus'}"></i>
            ${isInWatchlist(m.id) ? 'In Watchlist' : 'Add'}
          </button>
        </div>
      </div>
    </div>`).join('');
}

// ---- ORIGINALS MINI GRID ----
function initOriginalsGrid() {
  const grid = document.getElementById('originals-mini-grid');
  if (!grid) return;
  const picks = [MOVIES[11], MOVIES[7], MOVIES[3], MOVIES[6]]; // Parasite, Matrix, Pulp Fiction, Interstellar
  grid.innerHTML = picks.map(m => `
    <div class="col-6">
      <div class="originals-mini-card" onclick="goToDetail(${m.id}, '${m.type}')">
        <img src="${m.poster}" alt="${m.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/120x100/1e1e1e/888?text=?'" style="width:100%;height:110px;object-fit:cover;"/>
        <div class="originals-mini-title">${m.title}</div>
      </div>
    </div>`).join('');
}

// ---- TOP TV ----
function initTopTV(liveData) {
  const container = document.getElementById('topTVContainer');
  if (!container) return;
  const source = (liveData && liveData.length) ? liveData : TV_SHOWS.filter(t => t.topTV || t.trending);
  container.innerHTML = source.map(m => makeScrollCard(m)).join('');
}

// ---- SCROLL CARD MAKER ----
function makeScrollCard(m) {
  const year = typeof m.year === 'string' ? m.year.split('–')[0] : m.year;
  return `
    <div class="scroll-card" onclick="goToDetail(${m.id}, '${m.type}')">
      <div style="position:relative;overflow:hidden;">
        <img class="scroll-card-img" src="${m.poster}" alt="${m.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/160x240/1e1e1e/888?text=?'"/>
        <button class="scroll-card-watchlist ${isInWatchlist(m.id) ? 'in-watchlist' : ''}" data-watchlist-id="${m.id}"
          onclick="event.stopPropagation(); toggleWatchlist(${m.id}, '${m.title.replace(/'/g, "\\'")}', '${m.poster}', ${year}, ${m.rating})">
          <i class="bi ${isInWatchlist(m.id) ? 'bi-bookmark-fill' : 'bi-bookmark-plus'}"></i>
        </button>
        ${m.trending ? '<span class="live-badge position-absolute top-0 start-0 m-1"><span class="live-dot"></span>Trending</span>' : ''}
      </div>
      <div class="scroll-card-info">
        <div class="scroll-card-title">${m.title}</div>
        <div class="scroll-card-rating"><i class="bi bi-star-fill me-1"></i>${m.rating}</div>
        <div class="scroll-card-year">${year} ${m.type === 'tv' ? '• TV' : ''}</div>
      </div>
    </div>`;
}

// ---- SCROLL BUTTONS ----
function initScrollButtonsAll() {
  initScrollButtons('topRatedPrev', 'topRatedNext', 'topRatedContainer');
}

// ---- INTERSECTION OBSERVER for animations ----
function animateSections() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.animate-in').forEach((el, i) => {
          el.style.animationDelay = `${i * 0.07}s`;
          el.style.opacity = '1';
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('section').forEach(sec => observer.observe(sec));
}
