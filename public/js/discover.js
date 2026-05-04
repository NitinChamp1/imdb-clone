/* ============================================================
   discover.js — Advanced Discover Page Logic
   ============================================================ */

let currentPage = 1;
let totalPages = 1;
let currentFilters = {};

document.addEventListener('DOMContentLoaded', async () => {
  await initTMDb();
  await updateGenres();
  applyFilters();
});

async function updateGenres() {
  const type = document.getElementById('filterType').value;
  const select = document.getElementById('filterGenre');
  select.innerHTML = '<option value="">All Genres</option>';
  
  let genresData;
  if (type === 'movie') {
    genresData = await TMDB.getMovieGenres();
  } else {
    genresData = await TMDB.getTVGenres();
  }
  
  if (genresData && genresData.genres) {
    genresData.genres.forEach(g => {
      select.innerHTML += `<option value="${g.id}">${g.name}</option>`;
    });
  }
}

async function applyFilters(page = 1) {
  currentPage = page;
  
  const type = document.getElementById('filterType').value;
  const genre = document.getElementById('filterGenre').value;
  const year = document.getElementById('filterYear').value.trim();
  const minRating = document.getElementById('filterRating').value;
  const sortBy = document.getElementById('filterSort').value;
  
  const params = {
    genre,
    year,
    sortBy,
    minRating,
    page: currentPage
  };
  
  document.getElementById('loading').classList.remove('d-none');
  document.getElementById('resultsContainer').innerHTML = '';
  document.getElementById('noResults').classList.add('d-none');
  document.getElementById('paginationContainer').innerHTML = '';
  
  let data;
  if (type === 'movie') {
    data = await TMDB.discoverMovies(params);
  } else {
    data = await TMDB.discoverTV(params);
  }
  
  document.getElementById('loading').classList.add('d-none');
  
  if (!data || !data.results || data.results.length === 0) {
    document.getElementById('noResults').classList.remove('d-none');
    document.getElementById('resultsCount').textContent = 'No results found.';
    return;
  }
  
  totalPages = Math.min(data.total_pages, 500); // TMDB limits to 500 pages
  document.getElementById('resultsCount').textContent = `Found ${data.total_results.toLocaleString()} results (showing page ${currentPage} of ${totalPages})`;
  
  renderResults(data.results.map(item => normalizeTMDb(item, type)));
  renderPagination();
}

function renderResults(items) {
  const container = document.getElementById('resultsContainer');
  let html = '';
  
  items.forEach(item => {
    const inWL = typeof isInWatchlist === 'function' ? isInWatchlist(item.id) : false;
    html += `
      <div class="col-6 col-md-4 col-lg-3 col-xl-2 mb-4">
        <div class="movie-card" onclick="goToDetail(${item.id}, '${item.type}')">
          <div class="movie-poster-wrap">
            <img class="movie-poster" src="${item.poster}" alt="${item.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/200x300/1e1e1e/888?text=?'"/>
            <button class="movie-watchlist-btn ${inWL ? 'in-watchlist' : ''}" data-watchlist-id="${item.id}"
              onclick="event.stopPropagation(); toggleWatchlist(${item.id}, '${item.title.replace(/'/g, "\\'")}', '${item.poster}', ${item.year}, ${item.rating}, '${item.type}')">
              <i class="bi ${inWL ? 'bi-bookmark-fill' : 'bi-bookmark-plus'}"></i>
            </button>
          </div>
          <div class="movie-info">
            <div class="movie-title">${item.title}</div>
            <div class="d-flex justify-content-between align-items-center">
              <div class="movie-rating"><i class="bi bi-star-fill rating-star"></i>${item.rating}</div>
              <div class="text-muted" style="font-size: 0.75rem;">${item.year || ''}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

function renderPagination() {
  if (totalPages <= 1) return;
  
  const container = document.getElementById('paginationContainer');
  let html = '<ul class="pagination pagination-dark">';
  
  // Prev
  html += `
    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
      <button class="page-link" onclick="applyFilters(${currentPage - 1})">Previous</button>
    </li>
  `;
  
  // Logic for pages
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  
  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }
  
  if (startPage > 1) {
    html += `<li class="page-item"><button class="page-link" onclick="applyFilters(1)">1</button></li>`;
    if (startPage > 2) {
      html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
  }
  
  for (let i = startPage; i <= endPage; i++) {
    html += `
      <li class="page-item ${i === currentPage ? 'active' : ''}">
        <button class="page-link" onclick="applyFilters(${i})">${i}</button>
      </li>
    `;
  }
  
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
    html += `<li class="page-item"><button class="page-link" onclick="applyFilters(${totalPages})">${totalPages}</button></li>`;
  }
  
  // Next
  html += `
    <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
      <button class="page-link" onclick="applyFilters(${currentPage + 1})">Next</button>
    </li>
  `;
  
  html += '</ul>';
  container.innerHTML = html;
}
