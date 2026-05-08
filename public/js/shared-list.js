/* ============================================================
   shared-list.js — Public View for Custom Lists
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const uid = params.get('u');
  const listId = params.get('l');
  
  const container = document.getElementById('watchlistItems');
  
  if (!uid || !listId) {
    showError(container, "Invalid Link", "The link you followed is missing required information.");
    return;
  }
  
  try {
    // We must wait for Firebase to initialize before querying
    if (typeof db === 'undefined') {
      setTimeout(() => window.location.reload(), 1000); // give it a sec if loaded weirdly
      return;
    }
    
    // Fetch the specific list from the user's customLists subcollection
    const docRef = db.collection('users').doc(uid).collection('customLists').doc(listId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      showError(container, "List Not Found", "This list may have been deleted or the link is incorrect.");
      return;
    }
    
    const listData = doc.data();
    const movies = listData.movies || [];
    
    // Update Page Header
    document.querySelector('.section-title').textContent = listData.name || 'Shared Custom List';
    document.getElementById('listDescription').textContent = listData.description || `${movies.length} items curated by a user`;
    
    // Add Clone List button if user is logged in
    auth.onAuthStateChanged(user => {
      if (user && user.uid !== uid) {
        document.getElementById('listHeaderActions').innerHTML = `
          <button class="btn btn-outline-warning rounded-pill px-4" onclick="cloneListToProfile('${uid}', '${listId}', '${listData.name.replace(/'/g, "\\'")}')">
            <i class="bi bi-files me-2"></i>Clone to My Profile
          </button>
        `;
      }
    });

    if (movies.length === 0) {
      container.innerHTML = `
        <div class="text-center py-5">
          <i class="bi bi-collection-play text-muted" style="font-size: 3rem;"></i>
          <h5 class="text-white mt-3">This list is empty</h5>
          <p class="text-muted">The creator hasn't added any movies or shows yet.</p>
        </div>
      `;
      return;
    }
    
    // Render the grid
    let html = '<div class="row g-3">';
    movies.forEach(m => {
      html += `
        <div class="col-6 col-sm-4 col-md-3 col-lg-2">
          <div class="movie-card position-relative" onclick="goToDetail(${m.id}, '${m.type}')" style="cursor:pointer;">
            <div class="movie-poster-wrap">
              <img class="movie-poster" src="${m.poster}" alt="${m.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/200x300/1e1e1e/888?text=?'"/>
              <button class="movie-watchlist-btn ${isInWatchlist(m.id) ? 'in-watchlist' : ''}" data-watchlist-id="${m.id}"
                onclick="event.stopPropagation(); toggleWatchlist(${m.id}, '${m.title.replace(/'/g, "\\'").replace(/"/g, "&quot;")}', '${m.poster}', '${m.year}', ${m.rating}, '${m.type}')">
                <i class="bi ${isInWatchlist(m.id) ? 'bi-bookmark-fill' : 'bi-bookmark-plus'}"></i>
              </button>
            </div>
            <div class="movie-info">
              <div class="movie-title">${m.title}</div>
              <div class="movie-rating"><i class="bi bi-star-fill rating-star"></i>${m.rating || '?'}</div>
            </div>
          </div>
        </div>
      `;
    });
    html += '</div>';
    
    container.innerHTML = html;
    
  } catch (err) {
    console.error("Error loading shared list:", err);
    showError(container, "Error Loading List", "An error occurred while fetching the list data. If you lack permissions, make sure Firestore rules allow reading custom lists.");
  }
});

function showError(container, title, message) {
  document.querySelector('.section-title').textContent = title;
  document.getElementById('listDescription').textContent = '';
  container.innerHTML = `
    <div class="text-center py-5">
      <i class="bi bi-exclamation-triangle text-danger" style="font-size: 3rem;"></i>
      <h5 class="text-white mt-3">${title}</h5>
      <p class="text-muted">${message}</p>
      <a href="index.html" class="btn btn-warning rounded-pill px-4 mt-3">Go Home</a>
    </div>
  `;
}

// Clone feature (copies this list into the current user's profile)
async function cloneListToProfile(originalUid, listId, originalName) {
  const user = auth.currentUser;
  if (!user) return;
  
  if (!confirm(`Clone "${originalName}" to your profile?`)) return;
  
  showToast('<i class="bi bi-hourglass-split me-2 text-warning"></i>Cloning list...');
  
  try {
    // 1. Fetch original list
    const originalDoc = await db.collection('users').doc(originalUid).collection('customLists').doc(listId).get();
    if (!originalDoc.exists) throw new Error("List no longer exists");
    
    const data = originalDoc.data();
    
    // 2. Create new list for current user
    await db.collection('users').doc(user.uid).collection('customLists').add({
      name: `${data.name} (Clone)`,
      description: data.description,
      movies: data.movies || [],
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    showToast('<i class="bi bi-check-circle-fill me-2 text-success"></i>List cloned successfully! Check your profile.');
  } catch (err) {
    console.error("Error cloning list:", err);
    showToast('<i class="bi bi-x-circle me-2 text-danger"></i>Failed to clone list', 'danger');
  }
}
