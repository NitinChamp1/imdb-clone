/* ============================================================
   detail.js — Movie/TV detail page JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  await initTMDb();
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'));
  const type = params.get('type') || 'movie';

  let item = await loadDetailFromTMDb(id, type);
  if (!item) {
    item = [...MOVIES, ...TV_SHOWS].find(m => m.id === id);
  }
  if (!item) {
    document.getElementById('detailContent').innerHTML = `
      <div class="min-vh-100 d-flex align-items-center justify-content-center">
        <div class="text-center">
          <i class="bi bi-exclamation-triangle-fill text-warning fs-1 mb-3 d-block"></i>
          <h3 class="text-white">Content Not Found</h3>
          <p class="text-muted">The movie or show you're looking for doesn't exist.</p>
          <a href="index.html" class="btn btn-warning rounded-pill px-4">Go Home</a>
        </div>
      </div>`;
    return;
  }

  document.getElementById('pageTitle').textContent = `${item.title} (${item.year}) – IMDb Clone`;
  addToRecentlyViewed({ id: item.id, title: item.title, poster: item.poster, year: item.year, rating: item.rating, type: item.type });

  const inWL = isInWatchlist(item.id);
  const genrePills = item.genre.map(g => `<span class="genre-pill me-2 mb-2">${g.charAt(0).toUpperCase() + g.slice(1)}</span>`).join('');
  const castCards = (item.cast || []).map((name, i) => {
    const avatarUrls = [
      'https://i.pravatar.cc/100?img=' + (i + 10),
      'https://i.pravatar.cc/100?img=' + (i + 15),
      'https://i.pravatar.cc/100?img=' + (i + 20),
    ];
    return `
      <div class="cast-card flex-shrink-0">
        <img src="${avatarUrls[i % 3]}" class="cast-img" alt="${name}" onerror="this.src='https://via.placeholder.com/80x80/222/888?text=${encodeURIComponent(name[0])}'"/>
        <div class="cast-name">${name}</div>
        <div class="cast-role">Actor</div>
      </div>`;
  }).join('');

  const userRating = getUserRating(item.id);

  const similar = (item.similar || [])
    .slice(0, 8);
    
  if (similar.length === 0) {
    // fallback if TMDB similar fails
    const staticSimilar = (type === 'movie' ? MOVIES : TV_SHOWS)
      .filter(m => m.id !== item.id && m.genre.some(g => item.genre.includes(g)))
      .slice(0, 8);
    similar.push(...staticSimilar);
  }

  document.getElementById('detailContent').innerHTML = `
    <!-- HERO -->
    <div class="detail-hero">
      <div class="detail-hero-bg" style="background-image:url('${item.backdrop || item.poster}');"></div>
      <div class="detail-hero-overlay"></div>
      <div class="container-fluid px-4 position-relative" style="z-index:2; padding-top:80px; padding-bottom:40px;">
        <nav aria-label="breadcrumb" class="mb-3">
          <ol class="breadcrumb mb-0">
            <li class="breadcrumb-item"><a href="index.html" class="text-light text-decoration-none" style="opacity: 0.85;">Home</a></li>
            <li class="breadcrumb-item"><a href="${type === 'tv' ? 'tvshows.html' : 'movies.html'}" class="text-light text-decoration-none" style="opacity: 0.85;">${type === 'tv' ? 'TV Shows' : 'Movies'}</a></li>
            <li class="breadcrumb-item active text-warning">${item.title}</li>
          </ol>
        </nav>
        <div class="d-flex gap-4 flex-wrap">
          <img src="${item.poster}" class="detail-poster d-none d-md-block" alt="${item.title}" onerror="this.style.display='none'"/>
          <div class="flex-grow-1">
            <div class="d-flex align-items-center gap-2 mb-2 flex-wrap">
              <span class="badge bg-warning text-dark fs-6 px-3">IMDb</span>
              ${item.pg ? `<span class="badge bg-secondary px-3">${item.pg}</span>` : ''}
              ${type === 'tv' ? '<span class="badge bg-info text-dark px-3">TV Series</span>' : ''}
              ${item.ranked <= 10 ? `<span class="badge bg-danger px-3">Top 10 IMDb</span>` : ''}
            </div>
            <h1 class="hero-title mb-1">${item.title}</h1>
            <div class="hero-meta mb-3">
              <span class="hero-year">${item.year}</span>
              ${item.runtime ? `<span class="mx-1 text-muted">•</span><span class="hero-year">${item.runtime}</span>` : ''}
              ${item.seasons ? `<span class="mx-1 text-muted">•</span><span class="hero-year">${item.seasons} Seasons • ${item.episodes} Episodes</span>` : ''}
              ${item.status ? `<span class="mx-1 text-muted">•</span><span class="badge ${item.status === 'Ongoing' ? 'bg-success' : 'bg-secondary'}">${item.status}</span>` : ''}
            </div>
            <div class="d-flex flex-wrap gap-3 mb-3">
              ${genrePills}
            </div>
            <p style="color:#ddd; font-size:1rem; max-width:600px; line-height:1.7; margin-bottom:20px;">${item.description}</p>
            <div class="d-flex flex-wrap gap-3 mb-3">
              <!-- Rating Box -->
              <div class="rating-box">
                <div class="text-light small mb-1" style="opacity: 0.85;">IMDb Rating</div>
                <div class="rating-value"><i class="bi bi-star-fill text-warning me-1" style="font-size:1.4rem;"></i>${item.rating}</div>
                <div class="rating-count" style="color: #bbb;">${item.votes} votes</div>
              </div>
              <!-- User Rating Box -->
              <div class="rating-box">
                <div class="text-light small mb-2" style="opacity: 0.85;">Your Rating</div>
                <div class="user-rate-stars" id="rateStars">
                  ${[1,2,3,4,5,6,7,8,9,10].map(n => `
                    <i class="bi bi-star${userRating >= n ? '-fill' : ''} rate-star ${userRating >= n ? 'active' : ''}" 
                       data-val="${n}" onclick="selectRating(${item.id}, ${n})"></i>`).join('')}
                </div>
                <div class="rating-count mt-1" id="userRatingText" style="color: #bbb;">${userRating ? `You rated: ${userRating}/10` : 'Click to rate'}</div>
                <button id="submitRatingBtn" class="btn btn-warning btn-sm mt-2 w-100 rounded-pill fw-600" style="display:none;" onclick="submitRating(${item.id})">
                  <i class="bi bi-check-circle me-1"></i>Submit Rating
                </button>
              </div>
              ${item.ranked ? `
              <div class="rating-box">
                <div class="text-light small mb-1" style="opacity: 0.85;">IMDb Rank</div>
                <div class="rating-value text-warning">#${item.ranked}</div>
                <div class="rating-count" style="color: #bbb;">Top Movies</div>
              </div>` : ''}
            </div>
            <div class="d-flex gap-2 flex-wrap">
              <button class="btn btn-warning rounded-pill px-4 fw-700" ${item.trailer ? `onclick="openTrailerModal('${item.trailer}', '${item.title.replace(/'/g, "\\'")}')"` : 'disabled'}>
                <i class="bi bi-play-fill me-1"></i> ${item.trailer ? 'Watch Trailer' : 'No Trailer Avail'}
              </button>
              <button class="btn ${inWL ? 'btn-warning' : 'btn-outline-light'} rounded-pill px-4 fw-600" id="mainWLBtn" data-watchlist-id="${item.id}"
                onclick="handleWatchlistToggle(${item.id}, '${item.title.replace(/'/g, "\\'")}', '${item.poster}', '${item.year}', ${item.rating})">
                <i class="bi ${inWL ? 'bi-bookmark-fill' : 'bi-bookmark-plus'} me-1"></i> ${inWL ? 'In Watchlist' : 'Add to Watchlist'}
              </button>
              <button class="btn btn-outline-secondary rounded-pill px-3" onclick="shareMovie('${item.title}')">
                <i class="bi bi-share me-1"></i> Share
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- DETAILS SECTION -->
    <div class="bg-dark-custom py-5">
      <div class="container-fluid px-4">
        <div class="row g-4">
          <!-- Main Content -->
          <div class="col-lg-8">
            <!-- Cast -->
            <h3 class="section-title mb-4">Top Cast</h3>
            <div class="d-flex gap-4 overflow-auto pb-3 mb-5" id="castRow" style="scrollbar-width:thin;">
              ${castCards}
            </div>

            <!-- Director / Details -->
            <h3 class="section-title mb-4">Details</h3>
            <div class="row g-3 mb-5">
              ${item.director ? `
              <div class="col-sm-6">
                <div class="p-3 rounded-3" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);">
                  <div class="text-muted small mb-1"><i class="bi bi-camera-reels me-1"></i>Director</div>
                  <div class="fw-500">${item.director}</div>
                </div>
              </div>` : ''}
              <div class="col-sm-6">
                <div class="p-3 rounded-3" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);">
                  <div class="text-muted small mb-1"><i class="bi bi-calendar3 me-1"></i>Release Year</div>
                  <div class="fw-500">${item.year}</div>
                </div>
              </div>
              ${item.runtime ? `
              <div class="col-sm-6">
                <div class="p-3 rounded-3" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);">
                  <div class="text-muted small mb-1"><i class="bi bi-clock me-1"></i>Runtime</div>
                  <div class="fw-500">${item.runtime}</div>
                </div>
              </div>` : ''}
              <div class="col-sm-6">
                <div class="p-3 rounded-3" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);">
                  <div class="text-muted small mb-1"><i class="bi bi-people me-1"></i>Cast</div>
                  <div class="fw-500">${(item.cast || []).join(', ')}</div>
                </div>
              </div>
            </div>

            <!-- User Reviews Section -->
            <h3 class="section-title mb-4">Reviews</h3>

            <!-- Write Review (hidden until a star is clicked) -->
            <div class="review-card mb-4" id="writeReviewBox" style="display:none; overflow:hidden; transition: all 0.4s ease;">
              <h5 class="text-white mb-3"><i class="bi bi-pencil-square me-2 text-warning"></i>Write a Review</h5>
              <textarea class="form-control bg-transparent border-secondary text-white mb-3 custom-placeholder" id="reviewText" rows="3" placeholder="Share your thoughts about this movie..." style="resize:none;"></textarea>
              <div class="d-flex justify-content-between align-items-center">
                <div class="text-light small" style="opacity: 0.85;">Your rating: <span class="text-warning" id="reviewRatingDisplay">${userRating ? `${userRating}/10` : 'Rate above'}</span></div>
                <button class="btn btn-warning rounded-pill px-4 fw-600" onclick="submitReview()">
                  <i class="bi bi-send me-1"></i>Submit
                </button>
              </div>
            </div>

            <div id="reviewsContainer">
              ${generateMockReviews(item)}
            </div>
          </div>

          <!-- Sidebar -->
          <div class="col-lg-4">
            <div class="sticky-top" style="top:80px;">
              <!-- Stats -->
              <div class="p-4 rounded-3 mb-4" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);">
                <h5 class="text-warning mb-3">Popularity Stats</h5>
                <div class="mb-3">
                  <div class="d-flex justify-content-between mb-1">
                    <span class="text-muted small">Popularity Score</span>
                    <span class="text-white small fw-600">${Math.round(item.rating * 10)}%</span>
                  </div>
                  <div class="progress" style="height:6px;">
                    <div class="progress-bar" style="width:${item.rating * 10}%;"></div>
                  </div>
                </div>
                <div class="mb-3">
                  <div class="d-flex justify-content-between mb-1">
                    <span class="text-muted small">Audience Score</span>
                    <span class="text-white small fw-600">${Math.round(item.rating * 9.5)}%</span>
                  </div>
                  <div class="progress" style="height:6px;">
                    <div class="progress-bar bg-success" style="width:${item.rating * 9.5}%;"></div>
                  </div>
                </div>
                <div class="row g-2 mt-2">
                  <div class="col-6 text-center">
                    <div class="fw-700 text-warning fs-5">${item.votes}</div>
                    <div class="text-muted small">Votes</div>
                  </div>
                  <div class="col-6 text-center">
                    <div class="fw-700 text-warning fs-5">#${item.ranked || '—'}</div>
                    <div class="text-muted small">IMDb Rank</div>
                  </div>
                </div>
              </div>

              <!-- More Details -->
              <div class="p-4 rounded-3" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);">
                <h5 class="text-warning mb-3">More Info</h5>
                <ul class="list-unstyled text-muted small">
                  <li class="mb-2 d-flex justify-content-between"><span>Type</span><span class="text-white">${type === 'tv' ? 'TV Series' : 'Movie'}</span></li>
                  <li class="mb-2 d-flex justify-content-between"><span>Rating</span><span class="text-white">${item.pg || 'NR'}</span></li>
                  <li class="mb-2 d-flex justify-content-between"><span>Language</span><span class="text-white">English</span></li>
                  <li class="mb-2 d-flex justify-content-between"><span>Country</span><span class="text-white">USA</span></li>
                  ${item.seasons ? `<li class="mb-2 d-flex justify-content-between"><span>Seasons</span><span class="text-white">${item.seasons}</span></li>` : ''}
                  ${item.status ? `<li class="mb-2 d-flex justify-content-between"><span>Status</span><span class="text-white">${item.status}</span></li>` : ''}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SIMILAR MOVIES -->
    ${similar.length ? `
    <div class="bg-darker-custom py-5">
      <div class="container-fluid px-4">
        <h3 class="section-title mb-4">More Like This</h3>
        <div class="row g-3">
          ${similar.map((m, i) => `
            <div class="col-6 col-md-4 col-lg-3 col-xl-2">
              <div class="movie-card" onclick="goToDetail(${m.id}, '${m.type}')">
                <div class="movie-poster-wrap">
                  <img class="movie-poster" src="${m.poster}" alt="${m.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/200x300/1e1e1e/888?text=?'"/>
                  <button class="movie-watchlist-btn ${isInWatchlist(m.id) ? 'in-watchlist' : ''}" data-watchlist-id="${m.id}"
                    onclick="event.stopPropagation(); toggleWatchlist(${m.id}, '${m.title.replace(/'/g, "\\'")}', '${m.poster}', ${m.year}, ${m.rating})">
                    <i class="bi ${isInWatchlist(m.id) ? 'bi-bookmark-fill' : 'bi-bookmark-plus'}"></i>
                  </button>
                </div>
                <div class="movie-info">
                  <div class="movie-title">${m.title}</div>
                  <div class="movie-rating"><i class="bi bi-star-fill rating-star"></i>${m.rating}</div>
                </div>
              </div>
            </div>`).join('')}
        </div>
      </div>
    </div>` : ''}

    <!-- FOOTER -->
    <footer class="imdb-footer py-4">
      <div class="container-fluid px-4 text-center">
        <span class="imdb-logo mb-2 d-inline-block" style="font-size:1.2rem;">IMDb</span>
        <p class="text-muted small mb-0">© 2025 IMDb Clone — Demo purposes only.</p>
      </div>
    </footer>`;
  // Load real reviews from Firestore
  loadReviewsFromFirestore(id, type);

  // If user already has a saved rating, show the review box immediately
  if (userRating) {
    const box = document.getElementById('writeReviewBox');
    if (box) box.style.display = 'block';
  }

  // Attach flicker-free container-level star hover
  initStarHover(id);
});

async function loadReviewsFromFirestore(movieId, type) {
  if (typeof db === 'undefined') return;
  try {
    const snapshot = await db
      .collection('reviews')
      .doc(String(movieId))
      .collection('userReviews')
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    if (snapshot.empty) return;

    const container = document.getElementById('reviewsContainer');
    if (!container) return;

    snapshot.forEach(doc => {
      const r = doc.data();
      const date = r.createdAt ? new Date(r.createdAt.toDate()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recently';
      const initial = (r.displayName || 'U')[0].toUpperCase();
      const reviewHTML = `
        <div class="review-card mb-3">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <div class="d-flex align-items-center gap-2">
              <div style="width:36px;height:36px;background:linear-gradient(135deg,#f5c518,#c9a60c);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;color:#000;font-size:0.85rem;">${initial}</div>
              <div>
                <div class="fw-600 small text-white">${r.displayName || 'Anonymous'}</div>
                <div class="text-muted" style="font-size:0.7rem;">${date}</div>
              </div>
            </div>
            ${r.rating ? `<div class="d-flex align-items-center gap-1 text-warning fw-700 small"><i class="bi bi-star-fill"></i>${r.rating}/10</div>` : ''}
          </div>
          <p class="small mb-2 lh-base" style="color:#e8e8e8;">${r.text}</p>
        </div>`;
      container.insertAdjacentHTML('afterbegin', reviewHTML);
    });
  } catch (err) {
    console.error('Error loading reviews from Firestore:', err);
  }
}

function generateMockReviews(item) {
  const reviews = [
    { name: 'CineFan2024', rating: Math.min(10, item.rating + 0.5), text: `An absolute masterpiece! "${item.title}" delivers on every level — the performances, direction, and cinematography are all stellar. This is easily one of the best films I have seen in years.`, date: '2 days ago', likes: 42 },
    { name: 'FilmCritic_AI', rating: Math.max(6, item.rating - 0.8), text: `"${item.title}" is a solid entry in its genre. The storytelling has a few weak moments, but overall it's a compelling and emotional experience that will stay with you.`, date: '1 week ago', likes: 18 },
    { name: 'MovieBuff99', rating: item.rating, text: `Watched this with my family and we all loved it! "${item.title}" really captures the essence of great cinema. Highly recommended for anyone who appreciates quality filmmaking.`, date: '3 weeks ago', likes: 7 }
  ];
  return reviews.map(r => `
    <div class="review-card mb-3">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <div class="d-flex align-items-center gap-2">
          <div style="width:36px;height:36px;background:linear-gradient(135deg,var(--imdb-yellow),#c9a60c);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;color:#000;font-size:0.85rem;">${r.name[0]}</div>
          <div>
            <div class="fw-600 small text-white">${r.name}</div>
            <div class="text-muted" style="font-size:0.7rem;">${r.date}</div>
          </div>
        </div>
        <div class="d-flex align-items-center gap-1 text-warning fw-700 small">
          <i class="bi bi-star-fill"></i>${r.rating.toFixed(1)}
        </div>
      </div>
      <p class="small mb-2 lh-base" style="color:#e8e8e8;">${r.text}</p>
      <button class="btn btn-sm btn-outline-secondary rounded-pill px-3" style="font-size:0.75rem;" onclick="this.innerHTML='<i class=\'bi bi-hand-thumbs-up-fill me-1 text-warning\'></i>' + (parseInt(this.dataset.likes) + 1) + ' Helpful'" data-likes="${r.likes}">
        <i class="bi bi-hand-thumbs-up me-1"></i>${r.likes} Helpful
      </button>
    </div>`).join('');
}

// User Rating
const USER_RATINGS_KEY = 'imdb_clone_ratings';
let tempSelectedRating = 0;

function getUserRating(id) {
  try { return JSON.parse(localStorage.getItem(USER_RATINGS_KEY) || '{}')[id] || 0; }
  catch { return 0; }
}

function selectRating(id, val) {
  tempSelectedRating = val;
  updateStarsDisplay(val);
  document.getElementById('userRatingText').textContent = `Selected: ${val}/10`;
  document.getElementById('reviewRatingDisplay').textContent = `${val}/10`;
  const submitBtn = document.getElementById('submitRatingBtn');
  if (submitBtn) submitBtn.style.display = 'block';

  // Reveal the write-review box with a smooth animation
  const box = document.getElementById('writeReviewBox');
  if (box && box.style.display === 'none') {
    box.style.display = 'block';
    box.style.opacity = '0';
    box.style.transform = 'translateY(-10px)';
    requestAnimationFrame(() => {
      box.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      box.style.opacity = '1';
      box.style.transform = 'translateY(0)';
    });
  }
}

function submitRating(id) {
  const user = (typeof auth !== 'undefined') ? auth.currentUser : null;
  if (!user) {
    const modal = new bootstrap.Modal(document.getElementById('authModal'));
    modal.show();
    return;
  }

  if (tempSelectedRating === 0) return;

  const val = tempSelectedRating;
  const ratings = JSON.parse(localStorage.getItem(USER_RATINGS_KEY) || '{}');
  ratings[id] = val;
  localStorage.setItem(USER_RATINGS_KEY, JSON.stringify(ratings));
  
  // Once submitted, clear temp and display the permanent saved rating
  tempSelectedRating = 0;
  updateStarsDisplay(val);
  
  document.getElementById('userRatingText').textContent = `You rated: ${val}/10`;
  document.getElementById('reviewRatingDisplay').textContent = `${val}/10`;
  
  const submitBtn = document.getElementById('submitRatingBtn');
  if (submitBtn) submitBtn.style.display = 'none';
  
  showToast(`<i class="bi bi-star-fill text-warning me-2"></i>Rated <strong>${val}/10</strong>!`);
}
function hoverStars(val) {
  document.querySelectorAll('.rate-star').forEach((s, i) => {
    const isLit = i < val;
    // Toggle icon class WITHOUT replacing the whole className (avoids flash/flicker)
    s.classList.toggle('bi-star-fill', isLit);
    s.classList.toggle('bi-star', !isLit);
    s.classList.toggle('hovered', isLit);
    s.classList.remove('active'); // clear active during hover preview
  });
}
function resetStars(id) { 
  updateStarsDisplay(tempSelectedRating || getUserRating(id)); 
}
function updateStarsDisplay(val) {
  document.querySelectorAll('.rate-star').forEach((s, i) => {
    const isLit = i < val;
    s.classList.toggle('bi-star-fill', isLit);
    s.classList.toggle('bi-star', !isLit);
    s.classList.toggle('active', isLit);
    s.classList.remove('hovered');
  });
}

/* ── Flicker-free hover: one listener on the container, not each star ── */
function initStarHover(movieId) {
  const container = document.getElementById('rateStars');
  if (!container) return;

  let lastVal = -1;
  container.addEventListener('mousemove', (e) => {
    const star = e.target.closest('.rate-star');
    if (!star) return;
    const val = parseInt(star.dataset.val, 10);
    if (val === lastVal) return; // throttle: only update when star changes
    lastVal = val;
    hoverStars(val);
  });

  container.addEventListener('mouseleave', () => {
    lastVal = -1;
    resetStars(movieId);
  });
}

function handleWatchlistToggle(id, title, poster, year, rating) {
  const added = toggleWatchlist(id, title, poster, year, rating);
  const btn = document.getElementById('mainWLBtn');
  if (btn) {
    if (added) {
      btn.className = 'btn btn-warning rounded-pill px-4 fw-600';
      btn.innerHTML = '<i class="bi bi-bookmark-fill me-1"></i> In Watchlist';
    } else {
      btn.className = 'btn btn-outline-light rounded-pill px-4 fw-600';
      btn.innerHTML = '<i class="bi bi-bookmark-plus me-1"></i> Add to Watchlist';
    }
  }
}

async function submitReview() {
  // Auth gate — open sign-in modal if not logged in
  const user = (typeof auth !== 'undefined') ? auth.currentUser : null;
  if (!user) {
    const modal = new bootstrap.Modal(document.getElementById('authModal'));
    modal.show();
    return;
  }

  const text = document.getElementById('reviewText').value.trim();
  if (!text) { showToast('<i class="bi bi-exclamation-triangle me-2 text-warning"></i>Please write something!', 'danger'); return; }

  // Get current movie id and type
  const params = new URLSearchParams(window.location.search);
  const movieId = params.get('id');
  const type = params.get('type') || 'movie';

  const displayName = user.displayName || user.email || 'Anonymous';
  const rating = getUserRating(parseInt(movieId)) || null;

  // Save to Firestore
  if (typeof db !== 'undefined' && movieId) {
    try {
      await db.collection('reviews').doc(String(movieId)).collection('userReviews').add({
        text,
        displayName,
        uid: user ? user.uid : null,
        rating,
        type,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (err) {
      console.error('Error saving review to Firestore:', err);
    }
  }

  // Show immediately in UI
  const container = document.getElementById('reviewsContainer');
  const initial = displayName[0].toUpperCase();
  const newReview = `
    <div class="review-card mb-3 animate-in">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <div class="d-flex align-items-center gap-2">
          <div style="width:36px;height:36px;background:linear-gradient(135deg,#f5c518,#c9a60c);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;color:#000;font-size:0.85rem;">${initial}</div>
          <div>
            <div class="fw-600 small text-white">${displayName}</div>
            <div class="text-muted" style="font-size:0.7rem;">Just now</div>
          </div>
        </div>
        ${rating ? `<div class="d-flex align-items-center gap-1 text-warning fw-700 small"><i class="bi bi-star-fill"></i>${rating}/10</div>` : '<span class="badge bg-success">New</span>'}
      </div>
      <p class="small mb-0 lh-base" style="color:#e8e8e8;">${text}</p>
    </div>`;
  container.insertAdjacentHTML('afterbegin', newReview);
  document.getElementById('reviewText').value = '';
  showToast('<i class="bi bi-check-circle-fill me-2 text-success"></i>Review submitted!');
}

function shareMovie(title) {
  if (navigator.share) {
    navigator.share({ title: `${title} – IMDb Clone`, url: window.location.href });
  } else {
    navigator.clipboard.writeText(window.location.href).then(() => {
      showToast('<i class="bi bi-link-45deg me-2 text-warning"></i>Link copied to clipboard!');
    });
  }
}

/* ── Auth Modal Handlers ── */
function closeAuthModal() {
  const el = document.getElementById('authModal');
  if (el) bootstrap.Modal.getInstance(el)?.hide();
}

async function handleGoogleAuth() {
  try {
    await googleLogin();
    closeAuthModal();
    showToast('<i class="bi bi-check-circle-fill me-2 text-success"></i>Signed in with Google!');
  } catch (err) {
    showToast('<i class="bi bi-x-circle me-2 text-danger"></i>' + (err.message || 'Google sign-in failed'), 'danger');
  }
}

async function handleEmailSignIn() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  errEl.style.display = 'none';
  if (!email || !password) { errEl.textContent = 'Please fill in all fields.'; errEl.style.display = 'block'; return; }
  try {
    await loginUser(email, password);
    closeAuthModal();
    showToast('<i class="bi bi-check-circle-fill me-2 text-success"></i>Signed in successfully!');
  } catch (err) {
    errEl.textContent = err.message || 'Sign-in failed. Check your credentials.';
    errEl.style.display = 'block';
  }
}

async function handleEmailSignUp() {
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const errEl = document.getElementById('signupError');
  errEl.style.display = 'none';
  if (!email || !password) { errEl.textContent = 'Please fill in all fields.'; errEl.style.display = 'block'; return; }
  try {
    const cred = await signupUser(email, password);
    if (name && cred.user) await cred.user.updateProfile({ displayName: name });
    closeAuthModal();
    showToast('<i class="bi bi-check-circle-fill me-2 text-success"></i>Account created! Welcome 🎉');
  } catch (err) {
    errEl.textContent = err.message || 'Sign-up failed. Try again.';
    errEl.style.display = 'block';
  }
}
