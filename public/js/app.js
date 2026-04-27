/* ============================================================
   app.js — Shared utilities for RNDb Clone
   ============================================================ */

// ---- Watchlist Management (localStorage) ----
const WATCHLIST_KEY = 'rndb_clone_watchlist';

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
  const item = { id, title, poster, year, rating, addedAt: Date.now() };

  if (idx === -1) {
    list.push(item);
    added = true;
  } else {
    list.splice(idx, 1);
  }

  saveWatchlist(list);
  updateWatchlistButtons(id, added);
  updateWatchlistCount();
  showToast(added ? `<i class="bi bi-bookmark-fill me-2 text-warning"></i><strong>${title}</strong> added to Watchlist!` : `<i class="bi bi-bookmark-x me-2 text-danger"></i><strong>${title}</strong> removed from Watchlist.`, added ? 'success' : 'danger');

  // Sync with Firebase if logged in
  const user = firebase.auth().currentUser;
  if (user) {
    if (added) {
      saveToCloudWatchlist(user.uid, item);
    } else {
      removeFromCloudWatchlist(user.uid, id);
    }
  }

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
const RECENT_KEY = 'rndb_clone_recent';
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

// ---- Firebase Auth UI Handlers ----
function openLoginModal() {
  const modal = new bootstrap.Modal(document.getElementById('loginModal'));
  modal.show();
}

function handleEmailLogin() {
  const email = document.getElementById('loginEmail').value;
  const pass = document.getElementById('loginPass').value;
  if (!email || !pass) return showToast("Please enter email and password", "danger");
  
  auth.signInWithEmailAndPassword(email, pass)
    .then(() => {
      bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
      showToast("Signed in successfully!");
    })
    .catch(err => showToast(err.message, "danger"));
}

function openSignupModal() {
  bootstrap.Modal.getInstance(document.getElementById('loginModal'))?.hide();
  const signupModal = new bootstrap.Modal(document.getElementById('signupModal'));
  signupModal.show();
}

function backToLogin() {
  bootstrap.Modal.getInstance(document.getElementById('signupModal'))?.hide();
  openLoginModal();
}

function handleEmailSignup() {
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const pass = document.getElementById('signupPass').value;
  const confirmPass = document.getElementById('signupConfirmPass').value;

  if (!name || !email || !pass) return showToast("Please fill in all fields", "danger");
  if (pass !== confirmPass) return showToast("Passwords do not match", "danger");
  
  auth.createUserWithEmailAndPassword(email, pass)
    .then((userCredential) => {
      // Update profile with name
      return userCredential.user.updateProfile({ displayName: name });
    })
    .then(() => {
      bootstrap.Modal.getInstance(document.getElementById('signupModal'))?.hide();
      showToast("Account created successfully! Welcome " + name + "!");
    })
    .catch(err => showToast(err.message, "danger"));
}

function loginWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(() => {
      bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
      showToast("Signed in with Google!");
    })
    .catch(err => showToast(err.message, "danger"));
}

function handleLogout() {
  logoutUser().then(() => {
    showToast("Signed out.");
    localStorage.removeItem(WATCHLIST_KEY);
    updateWatchlistCount();
    location.reload();
  });
}

async function syncWatchlistFromFirestore(userId) {
  const firestoreList = await fetchWatchlistFromCloud(userId);
  if (firestoreList.length > 0) {
    saveWatchlist(firestoreList);
    updateWatchlistCount();
    if (typeof renderWatchlistPage === 'function') renderWatchlistPage();
  }
}

function ensureAuthUI() {
  if (!document.getElementById('loginModal')) {
    const modalsHtml = `
      <!-- Login Modal -->
      <div class="modal fade" id="loginModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" style="max-width: 400px;">
          <div class="modal-content bg-dark text-white border-secondary">
            <div class="modal-header border-0">
              <h5 class="modal-title fw-bold">Sign In to RNDb</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body px-4 pb-4">
              <div class="text-center mb-4"><span class="rndb-logo fs-3">RNDb</span></div>
              <button class="btn btn-outline-light w-100 rounded-pill mb-3 d-flex align-items-center justify-content-center gap-2" onclick="loginWithGoogle()">
                <i class="bi bi-google"></i> Sign in with Google
              </button>
              <div class="d-flex align-items-center gap-2 mb-3">
                <hr class="flex-grow-1 border-secondary"><span class="text-muted small">OR</span><hr class="flex-grow-1 border-secondary">
              </div>
              <div id="loginForm">
                <div class="mb-3">
                  <label class="form-label small text-light">Email address</label>
                  <input type="email" class="form-control bg-dark text-white border-secondary" id="loginEmail" placeholder="Enter your email">
                </div>
                <div class="mb-3">
                  <label class="form-label small text-light">Password</label>
                  <input type="password" class="form-control bg-dark text-white border-secondary" id="loginPass" placeholder="Enter your password">
                </div>
                <button class="btn btn-warning w-100 rounded-pill fw-600 mb-2" onclick="handleEmailLogin()">Sign In</button>
                <button class="btn btn-link text-warning w-100 text-decoration-none small" onclick="openSignupModal()">Create account</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Sign Up Modal -->
      <div class="modal fade" id="signupModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" style="max-width: 400px;">
          <div class="modal-content bg-dark text-white border-secondary">
            <div class="modal-header border-0">
              <h5 class="modal-title fw-bold">Create Account</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body px-4 pb-4">
              <div id="signupForm">
                <div class="mb-3">
                  <label class="form-label small text-light">Full Name</label>
                  <input type="text" class="form-control bg-dark text-white border-secondary" id="signupName" placeholder="Enter your full name">
                </div>
                <div class="mb-3">
                  <label class="form-label small text-light">Email address</label>
                  <input type="email" class="form-control bg-dark text-white border-secondary" id="signupEmail" placeholder="Enter your email">
                </div>
                <div class="mb-3">
                  <label class="form-label small text-light">Password</label>
                  <input type="password" class="form-control bg-dark text-white border-secondary" id="signupPass" placeholder="Enter password (min 6 chars)">
                </div>
                <div class="mb-3">
                  <label class="form-label small text-light">Confirm Password</label>
                  <input type="password" class="form-control bg-dark text-white border-secondary" id="signupConfirmPass" placeholder="Confirm your password">
                </div>
                <button class="btn btn-warning w-100 rounded-pill fw-600 mb-2" onclick="handleEmailSignup()">Sign Up</button>
                <button class="btn btn-link text-muted w-100 text-decoration-none small" onclick="backToLogin()">Already have an account? Sign In</button>
              </div>
            </div>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', modalsHtml);
  }

  if (!document.getElementById('userProfileDropdown')) {
    const signInBtnNodes = Array.from(document.querySelectorAll('a, button')).filter(el => el.textContent.trim() === 'Sign In');
    if (signInBtnNodes.length > 0) {
      const signInBtn = signInBtnNodes[0];
      const template = document.createElement('div');
      template.innerHTML = `
        <button class="btn btn-warning btn-sm rounded-pill px-3 fw-600" id="navSignInBtn" onclick="openLoginModal()">Sign In</button>
        <div id="userProfileDropdown" class="dropdown d-none">
          <button class="btn btn-outline-light btn-sm rounded-pill px-3 d-flex align-items-center gap-2 dropdown-toggle" data-bs-toggle="dropdown">
            <i class="bi bi-person-circle fs-5"></i>
            <span id="navUserName">User</span>
          </button>
          <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end">
             <li><a class="dropdown-item" href="watchlist.html"><i class="bi bi-bookmark me-2"></i>My Watchlist</a></li>
             <li><hr class="dropdown-divider"></li>
             <li><a class="dropdown-item text-danger" href="#" onclick="handleLogout()"><i class="bi bi-box-arrow-right me-2"></i>Sign Out</a></li>
          </ul>
        </div>
      `;
      while (template.firstChild) {
        signInBtn.parentNode.insertBefore(template.firstChild, signInBtn);
      }
      signInBtn.remove();
    }
  }
}

function setupHoverDropdowns() {
  const links = document.querySelectorAll('.navbar-nav .nav-item > a.nav-link');
  links.forEach(link => {
    const text = link.textContent.trim();
    if (text === 'Movies' || text === 'TV Shows' || text === 'Celebrities') {
      const li = link.parentElement;
      li.classList.add('dropdown', 'hover-dropdown');
      
      let dropdownHtml = '';
      if (text === 'Movies') {
        dropdownHtml = `
          <ul class="dropdown-menu dropdown-menu-dark custom-hover-drop">
            <li><h6 class="dropdown-header text-warning">Movies</h6></li>
            <li><a class="dropdown-item" href="movies.html?category=popular"><i class="bi bi-star me-2"></i>Popular</a></li>
            <li><a class="dropdown-item" href="movies.html?category=now_playing"><i class="bi bi-play-circle me-2"></i>Now Playing</a></li>
            <li><a class="dropdown-item" href="movies.html?category=upcoming"><i class="bi bi-calendar-event me-2"></i>Upcoming</a></li>
            <li><a class="dropdown-item" href="movies.html?category=top_rated"><i class="bi bi-trophy me-2"></i>Top Rated</a></li>
          </ul>
        `;
      } else if (text === 'TV Shows') {
        dropdownHtml = `
          <ul class="dropdown-menu dropdown-menu-dark custom-hover-drop">
            <li><h6 class="dropdown-header text-warning">TV Shows</h6></li>
            <li><a class="dropdown-item" href="tvshows.html?category=popular"><i class="bi bi-star me-2"></i>Popular</a></li>
            <li><a class="dropdown-item" href="tvshows.html?category=airing_today"><i class="bi bi-broadcast me-2"></i>Airing Today</a></li>
            <li><a class="dropdown-item" href="tvshows.html?category=on_tv"><i class="bi bi-tv me-2"></i>On TV</a></li>
            <li><a class="dropdown-item" href="tvshows.html?category=top_rated"><i class="bi bi-trophy me-2"></i>Top Rated</a></li>
          </ul>
        `;
      } else if (text === 'Celebrities') {
        dropdownHtml = `
          <ul class="dropdown-menu dropdown-menu-dark custom-hover-drop">
            <li><h6 class="dropdown-header text-warning">Celebrities</h6></li>
            <li><a class="dropdown-item" href="celebrities.html"><i class="bi bi-people me-2"></i>Popular</a></li>
            <li><a class="dropdown-item" href="celebrities.html"><i class="bi bi-award me-2"></i>Trending</a></li>
          </ul>
        `;
      }
      
      if (dropdownHtml && !li.querySelector('.dropdown-menu')) {
        li.insertAdjacentHTML('beforeend', dropdownHtml);
      }
    }
  });
}

// ---- Initialize on load ----
document.addEventListener('DOMContentLoaded', () => {
  ensureAuthUI();
  setupHoverDropdowns();
  updateWatchlistCount();

  // Handle Auth State Changes
  if (typeof auth !== 'undefined') {
    auth.onAuthStateChanged(user => {
      const signInBtn = document.getElementById('navSignInBtn');
      const profileDrop = document.getElementById('userProfileDropdown');
      const navName = document.getElementById('navUserName');

      if (user) {
        signInBtn?.classList.add('d-none');
        profileDrop?.classList.remove('d-none');
        if (navName) navName.textContent = user.displayName || user.email.split('@')[0];
        syncWatchlistFromFirestore(user.uid);
      } else {
        signInBtn?.classList.remove('d-none');
        profileDrop?.classList.add('d-none');
      }
    });
  }
});

