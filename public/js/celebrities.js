/* ============================================================
   celebrities.js — logic for celebrities.html
   ============================================================ */

const ITEMS_PER_PAGE = 20;

document.addEventListener('DOMContentLoaded', async () => {
  await initTMDb();
  loadCelebrities();
});

async function loadCelebrities() {
  const container = document.getElementById('celebritiesGrid');
  if (!container) return;

  container.innerHTML = '<div class="w-100 text-center py-5"><div class="spinner-border text-warning" role="status"></div><div class="mt-3 text-muted">Loading 200+ Celebrities...</div></div>';

  try {
    // TMDb returns 20 results per page. We need 10 pages for 200 actors.
    const pageRequests = Array.from({ length: 10 }, (_, i) => TMDB.getPopularPeople(i + 1));
    const pagesData = await Promise.all(pageRequests);
    
    let allActors = [];
    for (const data of pagesData) {
      if (data && data.results) {
        allActors = allActors.concat(data.results);
      }
    }

    if (allActors.length === 0) {
      container.innerHTML = '<div class="w-100 text-center text-muted py-5">No celebrities found.</div>';
      return;
    }

    // Optional: update the search placeholder or a title counter
    const countText = document.getElementById('actorsCountText');
    if (countText) countText.textContent = `Showing all ${allActors.length} popular actors`;

    container.innerHTML = allActors.map(person => createCelebrityCard(person)).join('');
  } catch (error) {
    container.innerHTML = '<div class="w-100 text-center text-danger py-5">Error fetching celebrities. Please try again.</div>';
    console.error("Failed to load actors", error);
  }
}

function createCelebrityCard(person) {
  const imageUrl = person.profile_path 
    ? `${TMDB_CONFIG.IMG.POSTER_MD}${person.profile_path}` 
    : TMDB_CONFIG.FALLBACK_POSTER;
  
  const knownFor = (person.known_for || [])
    .map(work => work.title || work.name)
    .filter(Boolean)
    .slice(0, 3)
    .join(', ');

  return `
    <div class="col">
      <a href="person.html?id=${person.id}" class="text-decoration-none">
        <div class="card bg-dark text-white h-100 border-secondary celebrity-card">
          <img src="${imageUrl}" class="card-img-top" alt="${person.name}" style="height: 380px; object-fit: cover; object-position: top;">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title fw-bold text-truncate text-white" title="${person.name}">${person.name}</h5>
            <p class="card-text small text-muted flex-grow-1">Known for: ${knownFor || 'N/A'}</p>
          </div>
        </div>
      </a>
    </div>
  `;
}
