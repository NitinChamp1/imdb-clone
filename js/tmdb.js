/* ============================================================
   tmdb.js — TMDb API Integration (Pure JS + jQuery AJAX)
   All API calls go through this file.
   ============================================================ */

// ============================================================
// CORE FETCH WRAPPER
// ============================================================

/**
 * Call any TMDb endpoint.
 * @param {string} endpoint  e.g. '/movie/popular'
 * @param {object} params    extra query params
 * @returns {Promise}        resolves to JSON data
 */
async function tmdbFetch(endpoint, params = {}) {
  if (!TMDB_CONFIG.API_KEY || TMDB_CONFIG.API_KEY === 'your_tmdb_api_key_here') {
    console.warn('⚠️ TMDb API key not set in js/config.js — using static data.');
    return null;
  }

  const url = new URL(`${TMDB_CONFIG.BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', TMDB_CONFIG.API_KEY);
  url.searchParams.set('language', 'en-US');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  try {
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`TMDb ${res.status}: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.error('TMDb fetch error:', err);
    return null;
  }
}

// ============================================================
// MOVIE ENDPOINTS
// ============================================================
const TMDB = {

  // Home page sections
  async getTrending(mediaType = 'all', timeWindow = 'week') {
    return tmdbFetch(`/trending/${mediaType}/${timeWindow}`);
  },

  async getPopularMovies(page = 1) {
    return tmdbFetch('/movie/popular', { page });
  },

  async getTopRatedMovies(page = 1) {
    return tmdbFetch('/movie/top_rated', { page });
  },

  async getNowPlaying(page = 1) {
    return tmdbFetch('/movie/now_playing', { page });
  },

  async getUpcoming(page = 1) {
    return tmdbFetch('/movie/upcoming', { page });
  },

  // TV shows
  async getPopularTV(page = 1) {
    return tmdbFetch('/tv/popular', { page });
  },

  async getTopRatedTV(page = 1) {
    return tmdbFetch('/tv/top_rated', { page });
  },

  async getAiringToday() {
    return tmdbFetch('/tv/airing_today');
  },

  // Detail
  async getMovieDetail(id) {
    return tmdbFetch(`/movie/${id}`, { append_to_response: 'credits,videos,similar,images' });
  },

  async getTVDetail(id) {
    return tmdbFetch(`/tv/${id}`, { append_to_response: 'credits,videos,similar' });
  },

  async getMovieCredits(id) {
    return tmdbFetch(`/movie/${id}/credits`);
  },

  async getMovieVideos(id) {
    return tmdbFetch(`/movie/${id}/videos`);
  },

  async getSimilarMovies(id) {
    return tmdbFetch(`/movie/${id}/similar`);
  },

  // Search
  async searchMulti(query, page = 1) {
    return tmdbFetch('/search/multi', { query, page, include_adult: false });
  },

  async searchMovies(query, page = 1) {
    return tmdbFetch('/search/movie', { query, page });
  },

  async searchTV(query, page = 1) {
    return tmdbFetch('/search/tv', { query, page });
  },

  // Discover (with filters)
  async discoverMovies({ genre = '', year = '', sortBy = 'popularity.desc', page = 1, minRating = 0 } = {}) {
    const params = { sort_by: sortBy, page, 'vote_average.gte': minRating };
    if (genre) params.with_genres = genre;
    if (year)  params.primary_release_year = year;
    return tmdbFetch('/discover/movie', params);
  },

  async discoverTV({ genre = '', sortBy = 'popularity.desc', page = 1 } = {}) {
    const params = { sort_by: sortBy, page };
    if (genre) params.with_genres = genre;
    return tmdbFetch('/discover/tv', params);
  },

  // Genres
  async getMovieGenres() {
    return tmdbFetch('/genre/movie/list');
  },

  async getTVGenres() {
    return tmdbFetch('/genre/tv/list');
  },
};

// ============================================================
// DATA NORMALISER
// Converts TMDb response shape → our internal card format
// ============================================================
function normalizeTMDb(item, mediaType = null) {
  const type = mediaType || item.media_type || (item.title ? 'movie' : 'tv');
  const title = item.title || item.name || 'Unknown';
  const year  = (item.release_date || item.first_air_date || '').slice(0, 4);
  const rating = item.vote_average ? parseFloat(item.vote_average.toFixed(1)) : 0;
  const votes  = item.vote_count >= 1000
    ? (item.vote_count / 1000).toFixed(0) + 'K'
    : String(item.vote_count || 0);

  return {
    id:          item.id,
    title,
    year:        parseInt(year) || year,
    rating,
    votes,
    description: item.overview || '',
    poster:      item.poster_path
                   ? `${TMDB_CONFIG.IMG.POSTER_MD}${item.poster_path}`
                   : TMDB_CONFIG.FALLBACK_POSTER,
    backdrop:    item.backdrop_path
                   ? `${TMDB_CONFIG.IMG.BACKDROP_LG}${item.backdrop_path}`
                   : TMDB_CONFIG.FALLBACK_BACKDROP,
    genre:       (item.genre_ids || []).map(id => GENRE_MAP[id] || 'other'),
    type,
    tmdbId:      item.id,
    trending:    false,
    featured:    false,
    ranked:      null,
  };
}

// TMDb Genre ID → name map (movies)
const GENRE_MAP = {
  28: 'action', 12: 'adventure', 16: 'animation', 35: 'comedy',
  80: 'crime', 99: 'documentary', 18: 'drama', 10751: 'family',
  14: 'fantasy', 36: 'history', 27: 'horror', 10402: 'music',
  9648: 'mystery', 10749: 'romance', 878: 'sci-fi', 10770: 'tv-movie',
  53: 'thriller', 10752: 'war', 37: 'western',
  // TV genres
  10759: 'action', 10762: 'kids', 10763: 'news', 10764: 'reality',
  10765: 'sci-fi', 10766: 'soap', 10767: 'talk', 10768: 'war',
};

// ============================================================
// LIVE SEARCH (jQuery-powered with debounce)
// ============================================================
let searchDebounce = null;

function initLiveSearch() {
  const $input = $('#globalSearch');
  const $box   = $('#searchSuggestions');
  if (!$input.length) return;

  $input.on('input', function () {
    clearTimeout(searchDebounce);
    const q = $(this).val().trim();
    if (q.length < 2) { $box.hide().html(''); return; }

    searchDebounce = setTimeout(async () => {
      const data = await TMDB.searchMulti(q);
      if (!data) return showStaticSuggestions(q);

      const results = data.results
        .filter(r => r.media_type !== 'person' || r.profile_path)
        .slice(0, 7);

      if (!results.length) { $box.hide(); return; }

      $box.html(results.map(r => {
        const n = normalizeTMDb(r);
        return `
          <div class="suggestion-item" onclick="goToDetail(${n.id}, '${n.type}')">
            <img class="suggestion-thumb" src="${n.poster}" alt="${n.title}"
                 onerror="this.src='${TMDB_CONFIG.FALLBACK_POSTER}'"/>
            <div class="suggestion-info">
              <div class="suggestion-title">${highlightMatch(n.title, q)}</div>
              <div class="suggestion-meta">${n.type === 'tv' ? 'TV Show' : 'Movie'} • ${n.year}</div>
              <div class="suggestion-rating"><i class="bi bi-star-fill me-1"></i>${n.rating || '?'}</div>
            </div>
          </div>`;
      }).join('')).show();
    }, 280);
  });

  $input.on('keydown', function (e) {
    if (e.key === 'Enter') performSearch();
    if (e.key === 'Escape') $box.hide();
  });

  $(document).on('click', e => {
    if (!$(e.target).closest('.search-bar-group').length) $box.hide();
  });
}

// ============================================================
// HOMEPAGE LOADERS (called from home.js)
// ============================================================

async function loadHeroFromTMDb() {
  const data = await TMDB.getTrending('movie', 'week');
  if (!data) return;                 // falls back to static HERO_MOVIES

  window.LIVE_HERO = data.results.slice(0, 4).map(m => normalizeTMDb(m, 'movie'));
  return window.LIVE_HERO;
}

async function loadFeaturedFromTMDb(genreId = '') {
  const data = genreId
    ? await TMDB.discoverMovies({ genre: genreId })
    : await TMDB.getPopularMovies();
  if (!data) return null;
  return data.results.slice(0, 8).map(m => normalizeTMDb(m, 'movie'));
}

async function loadTopRatedFromTMDb() {
  const data = await TMDB.getTopRatedMovies();
  if (!data) return null;
  return data.results.slice(0, 15).map(m => normalizeTMDb(m, 'movie'));
}

async function loadTrendingFromTMDb(type = 'movie') {
  const data = await TMDB.getTrending(type, 'week');
  if (!data) return null;
  return data.results.slice(0, 12).map(m => normalizeTMDb(m, type));
}

async function loadTopTVFromTMDb() {
  const data = await TMDB.getTopRatedTV();
  if (!data) return null;
  return data.results.slice(0, 12).map(m => normalizeTMDb(m, 'tv'));
}

// ============================================================
// DETAIL PAGE — load full movie/TV info from TMDb
// ============================================================
async function loadDetailFromTMDb(id, type) {
  if (type === 'tv') {
    const data = await TMDB.getTVDetail(id);
    if (!data) return null;
    return {
      id: data.id,
      title: data.name,
      year: data.first_air_date?.slice(0, 4) + (data.last_air_date ? '–' + data.last_air_date.slice(0,4) : '–'),
      rating: parseFloat(data.vote_average?.toFixed(1)) || 0,
      votes: data.vote_count >= 1000 ? (data.vote_count/1000).toFixed(0)+'K' : String(data.vote_count),
      description: data.overview,
      poster:   data.poster_path   ? TMDB_CONFIG.IMG.POSTER_LG  + data.poster_path   : TMDB_CONFIG.FALLBACK_POSTER,
      backdrop: data.backdrop_path ? TMDB_CONFIG.IMG.BACKDROP_LG + data.backdrop_path : TMDB_CONFIG.FALLBACK_BACKDROP,
      genre: (data.genres || []).map(g => g.name.toLowerCase()),
      cast:  (data.credits?.cast  || []).slice(0, 8).map(c => c.name),
      castFull: (data.credits?.cast || []).slice(0, 8),
      director: (data.created_by || []).map(c => c.name).join(', '),
      seasons: data.number_of_seasons,
      episodes: data.number_of_episodes,
      status: data.status,
      type: 'tv',
      trailer: getTrailerKey(data.videos?.results),
      similar: (data.similar?.results || []).slice(0, 8).map(m => normalizeTMDb(m, 'tv')),
    };
  } else {
    const data = await TMDB.getMovieDetail(id);
    if (!data) return null;
    return {
      id: data.id,
      title: data.title,
      year: parseInt(data.release_date?.slice(0, 4)) || '?',
      rating: parseFloat(data.vote_average?.toFixed(1)) || 0,
      votes: data.vote_count >= 1000 ? (data.vote_count/1000).toFixed(0)+'K' : String(data.vote_count),
      description: data.overview,
      poster:   data.poster_path   ? TMDB_CONFIG.IMG.POSTER_LG  + data.poster_path   : TMDB_CONFIG.FALLBACK_POSTER,
      backdrop: data.backdrop_path ? TMDB_CONFIG.IMG.BACKDROP_LG + data.backdrop_path : TMDB_CONFIG.FALLBACK_BACKDROP,
      genre: (data.genres || []).map(g => g.name.toLowerCase()),
      runtime: data.runtime ? `${Math.floor(data.runtime/60)}h ${data.runtime%60}m` : null,
      pg: data.release_dates?.results?.find(r => r.iso_3166_1 === 'US')?.release_dates?.[0]?.certification || null,
      cast: (data.credits?.cast || []).slice(0, 8).map(c => c.name),
      castFull: (data.credits?.cast || []).slice(0, 8),
      director: (data.credits?.crew || []).find(c => c.job === 'Director')?.name || 'Unknown',
      type: 'movie',
      ranked: null,
      trailer: getTrailerKey(data.videos?.results),
      similar: (data.similar?.results || []).slice(0, 8).map(m => normalizeTMDb(m, 'movie')),
    };
  }
}

function getTrailerKey(videos = []) {
  const trailer = videos?.find(v => v.type === 'Trailer' && v.site === 'YouTube')
    || videos?.find(v => v.site === 'YouTube');
  return trailer ? trailer.key : null;
}

// ============================================================
// TRAILER MODAL
// ============================================================
function openTrailerModal(trailerKey, title) {
  // Remove any existing modal
  $('#trailerModal').remove();

  const modalHtml = `
    <div class="modal fade" id="trailerModal" tabindex="-1" aria-label="Trailer">
      <div class="modal-dialog modal-xl modal-dialog-centered">
        <div class="modal-content bg-black border-0">
          <div class="modal-header border-0 pb-0">
            <h5 class="modal-title text-white fw-700">
              <i class="bi bi-play-circle-fill text-warning me-2"></i>${title} — Trailer
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-0 pt-2">
            <div class="ratio ratio-16x9">
              <iframe src="https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0"
                      allow="autoplay; encrypted-media" allowfullscreen></iframe>
            </div>
          </div>
        </div>
      </div>
    </div>`;

  $('body').append(modalHtml);
  const modal = new bootstrap.Modal(document.getElementById('trailerModal'));
  modal.show();

  // Stop video when modal closes
  $('#trailerModal').on('hidden.bs.modal', function () {
    $(this).find('iframe').attr('src', '');
    $(this).remove();
  });
}

// ============================================================
// GENRE CACHE (load once, use everywhere)
// ============================================================
let _genreCache = null;
async function getGenreMap() {
  if (_genreCache) return _genreCache;
  const [movies, tv] = await Promise.all([TMDB.getMovieGenres(), TMDB.getTVGenres()]);
  _genreCache = {};
  [...(movies?.genres || []), ...(tv?.genres || [])].forEach(g => {
    _genreCache[g.id] = g.name;
    GENRE_MAP[g.id] = g.name.toLowerCase().replace(/ /g, '-');
  });
  return _genreCache;
}

// ============================================================
// INIT — called on DOMContentLoaded from each page
// ============================================================
async function initTMDb() {
  await getGenreMap();  // Warm up genre cache
  initLiveSearch();
  console.log('✅ TMDb integration ready');
}
