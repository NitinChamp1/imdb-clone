/* ============================================================
   profile.js — User Profile Logic
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Wait for Firebase Auth to initialize
  auth.onAuthStateChanged(user => {
    if (user) {
      loadUserProfile(user);
    } else {
      // Not logged in, redirect to home or show error
      window.location.href = 'index.html';
    }
  });
});

async function loadUserProfile(user) {
  // Basic info
  const name = user.displayName || user.email.split('@')[0];
  document.getElementById('profileName').textContent = name;
  document.getElementById('profileEmail').textContent = user.email;

  // Avatar
  if (user.photoURL) {
    document.getElementById('profileAvatar').innerHTML = `<img src="${user.photoURL}" class="w-100 h-100 rounded-circle" style="object-fit:cover;">`;
  } else {
    document.getElementById('profileAvatar').textContent = name[0].toUpperCase();
  }

  // Load Watchlist Count
  const wl = getWatchlist();
  document.getElementById('statWatchlist').textContent = wl.length;

  // Load Reviews from all collections
  // Note: Since reviews are nested under movies -> userReviews,
  // we would ideally need a collectionGroup query in Firestore.
  // We'll set it up here!
  await loadUserReviews(user.uid);
  
  // Load Custom Lists
  await loadUserLists(user.uid);
}

async function loadUserReviews(uid) {
  const container = document.getElementById('userReviewsContainer');
  try {
    // We need an index for this collectionGroup query to work, but let's query it.
    // If it fails due to missing index, we will tell the user.
    const snapshot = await db.collectionGroup('userReviews').where('uid', '==', uid).orderBy('createdAt', 'desc').get();
    
    if (snapshot.empty) {
      container.innerHTML = `
        <div class="text-center py-5">
          <i class="bi bi-chat-square-text text-muted" style="font-size: 3rem;"></i>
          <h5 class="text-white mt-3">No reviews yet</h5>
          <p class="text-muted">You haven't written any reviews. Go rate some movies!</p>
          <a href="movies.html" class="btn btn-outline-warning rounded-pill px-4 mt-2">Browse Movies</a>
        </div>
      `;
      document.getElementById('statReviews').textContent = '0';
      return;
    }

    let reviewsHtml = '';
    let totalRating = 0;
    let count = 0;

    snapshot.forEach(doc => {
      const r = doc.data();
      // Try to get movie ID from the parent doc reference
      const movieId = doc.ref.parent.parent.id;
      
      const date = r.createdAt ? new Date(r.createdAt.toDate()).toLocaleDateString() : 'Unknown Date';
      
      if (r.rating) {
        totalRating += r.rating;
        count++;
      }

      reviewsHtml += `
        <div class="review-card mb-4">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
              <div class="text-muted small">${date}</div>
              <h5 class="text-white mb-0 mt-1">
                <a href="detail.html?id=${movieId}&type=${r.type || 'movie'}" class="text-white text-decoration-none hover-warning">
                  Review for Item #${movieId}
                </a>
              </h5>
            </div>
            ${r.rating ? `<div class="d-flex align-items-center gap-1 text-warning fw-700 fs-5"><i class="bi bi-star-fill"></i>${r.rating}/10</div>` : ''}
          </div>
          <p class="mb-0" style="color:#e8e8e8;">${r.text}</p>
        </div>
      `;
    });

    container.innerHTML = reviewsHtml;
    
    // Update Stats
    document.getElementById('statReviews').textContent = snapshot.size;
    if (count > 0) {
      document.getElementById('statAvgRating').textContent = (totalRating / count).toFixed(1);
    }

  } catch (err) {
    console.error("Error loading reviews:", err);
    if (err.code === 'failed-precondition' || err.message.includes("requires an index")) {
      container.innerHTML = `
        <div class="alert alert-warning">
          <strong>Database Index Required!</strong><br>
          To show all your reviews, Firebase needs a specific index. 
          Check the browser console (Right Click -> Inspect -> Console) for a blue link, click it, and wait 3-5 minutes.
        </div>
      `;
    } else if (err.code === 'permission-denied' || err.message.includes("permissions")) {
      container.innerHTML = `
        <div class="alert alert-danger">
          <strong>Permission Denied!</strong><br>
          Your Firebase rules are blocking this query. Go to Firebase Console -> Firestore -> Rules, and add:<br>
          <code class="d-block mt-2 bg-dark p-2 rounded">match /{path=**}/userReviews/{reviewId} { allow read: if true; }</code>
        </div>
      `;
    } else {
      container.innerHTML = `<div class="text-danger py-4">Failed to load reviews. Please try again later.<br><small class="text-muted">Error details: ${err.message}</small></div>`;
    }
  }
}

// Very simple avatar uploader placeholder
async function uploadAvatar(e) {
  const file = e.target.files[0];
  if (!file) return;

  const user = auth.currentUser;
  if (!user) return;

  showToast('<i class="bi bi-hourglass-split me-2 text-warning"></i>Uploading avatar...');
  
  // Real app: upload to Firebase Storage, then update profile photoURL.
  // Since we haven't formally configured storage bucket rules, we'll just mock it or do a base64 for now
  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64 = e.target.result;
    try {
      await user.updateProfile({ photoURL: base64 });
      document.getElementById('profileAvatar').innerHTML = `<img src="${base64}" class="w-100 h-100 rounded-circle" style="object-fit:cover;">`;
      showToast('<i class="bi bi-check-circle-fill me-2 text-success"></i>Avatar updated!');
    } catch(err) {
      showToast('<i class="bi bi-x-circle me-2 text-danger"></i>Update failed', 'danger');
    }
  };
  reader.readAsDataURL(file);
}

// ============================================================
// CUSTOM LISTS LOGIC
// ============================================================
let currentLists = [];
let currentViewListId = null;

async function loadUserLists(uid) {
  const container = document.getElementById('userListsContainer');
  const lists = await fetchCustomLists(uid);
  currentLists = lists;
  
  if (lists.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-5" style="background:rgba(255,255,255,0.03);border:1px dashed rgba(255,255,255,0.2);border-radius:12px;">
        <i class="bi bi-collection-play text-muted" style="font-size: 3rem;"></i>
        <h5 class="text-white mt-3">No Custom Lists</h5>
        <p class="text-muted">Create a list to organize your favorite movies and shows!</p>
        <button class="btn btn-outline-warning rounded-pill px-4 mt-2" onclick="openCreateListModal()">Create First List</button>
      </div>
    `;
    return;
  }
  
  let html = '';
  lists.forEach(list => {
    const itemCount = (list.movies || []).length;
    const coverPoster = itemCount > 0 && list.movies[0].poster ? list.movies[0].poster : 'https://via.placeholder.com/200x300/1e1e1e/888?text=No+Items';
    
    html += `
      <div class="col-sm-6 col-md-4">
        <div class="list-card position-relative overflow-hidden rounded-3" style="cursor:pointer; border:1px solid rgba(255,255,255,0.1); background:#1e1e1e;" onclick="openViewListModal('${list.id}')">
          <div class="list-cover" style="height:140px; background:url('${coverPoster}') center/cover;">
            <div class="w-100 h-100" style="background:linear-gradient(to top, rgba(0,0,0,0.9), transparent);"></div>
          </div>
          <div class="p-3 position-absolute bottom-0 w-100">
            <h5 class="text-white fw-bold mb-1 text-truncate">${list.name}</h5>
            <div class="d-flex justify-content-between align-items-center">
              <span class="text-muted small">${itemCount} items</span>
              <i class="bi bi-arrow-right-circle text-warning fs-5"></i>
            </div>
          </div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

function openCreateListModal() {
  const modal = new bootstrap.Modal(document.getElementById('createListModal'));
  document.getElementById('newListName').value = '';
  document.getElementById('newListDesc').value = '';
  modal.show();
}

async function handleCreateList() {
  const name = document.getElementById('newListName').value.trim();
  const desc = document.getElementById('newListDesc').value.trim();
  if (!name) {
    showToast('<i class="bi bi-x-circle me-2 text-danger"></i>List name is required', 'danger');
    return;
  }
  
  const user = auth.currentUser;
  if (!user) return;
  
  showToast('<i class="bi bi-hourglass-split me-2 text-warning"></i>Creating list...');
  const id = await createCustomList(user.uid, name, desc);
  
  if (id) {
    bootstrap.Modal.getInstance(document.getElementById('createListModal')).hide();
    showToast('<i class="bi bi-check-circle-fill me-2 text-success"></i>List created successfully!');
    loadUserLists(user.uid);
  } else {
    showToast('<i class="bi bi-x-circle me-2 text-danger"></i>Failed to create list', 'danger');
  }
}

function openViewListModal(listId) {
  const list = currentLists.find(l => l.id === listId);
  if (!list) return;
  
  currentViewListId = listId;
  document.getElementById('viewListTitle').textContent = list.name;
  document.getElementById('viewListDesc').textContent = list.description || 'No description';
  
  const container = document.getElementById('viewListItemsContainer');
  const movies = list.movies || [];
  
  if (movies.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <p class="text-muted mb-0">This list is empty.</p>
      </div>
    `;
  } else {
    container.innerHTML = movies.map(m => `
      <div class="col-6 col-sm-4 col-md-3 mb-3">
        <div class="movie-card position-relative">
          <div class="movie-poster-wrap">
            <img class="movie-poster" src="${m.poster}" alt="${m.title}" onclick="goToDetail(${m.id}, '${m.type}')" style="cursor:pointer;"/>
            <button class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 rounded-circle" style="width:30px;height:30px;padding:0;z-index:3;" onclick="handleRemoveFromList('${m.id}')">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
          <div class="movie-info p-2" style="background:#111;">
            <div class="movie-title small text-truncate" style="font-size:0.8rem;">${m.title}</div>
          </div>
        </div>
      </div>
    `).join('');
  }
  
  const modal = new bootstrap.Modal(document.getElementById('viewListModal'));
  modal.show();
}

async function handleRemoveFromList(movieId) {
  if (!currentViewListId) return;
  const user = auth.currentUser;
  if (!user) return;
  
  if (confirm("Remove this movie from the list?")) {
    const success = await removeMovieFromCustomList(user.uid, currentViewListId, movieId);
    if (success) {
      showToast('<i class="bi bi-check-circle-fill me-2 text-success"></i>Movie removed from list');
      // Refresh
      await loadUserLists(user.uid);
      // Re-open modal with updated data
      const modal = bootstrap.Modal.getInstance(document.getElementById('viewListModal'));
      if (modal) modal.hide();
      openViewListModal(currentViewListId);
    } else {
      showToast('<i class="bi bi-x-circle me-2 text-danger"></i>Failed to remove movie', 'danger');
    }
  }
}

async function handleDeleteList() {
  if (!currentViewListId) return;
  const user = auth.currentUser;
  if (!user) return;
  
  if (confirm("Are you sure you want to delete this list entirely? This cannot be undone.")) {
    const success = await deleteCustomList(user.uid, currentViewListId);
    if (success) {
      bootstrap.Modal.getInstance(document.getElementById('viewListModal')).hide();
      showToast('<i class="bi bi-check-circle-fill me-2 text-success"></i>List deleted');
      loadUserLists(user.uid);
    } else {
      showToast('<i class="bi bi-x-circle me-2 text-danger"></i>Failed to delete list', 'danger');
    }
  }
}
