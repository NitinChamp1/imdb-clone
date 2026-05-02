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
    if (err.message.includes("requires an index")) {
      container.innerHTML = `
        <div class="alert alert-warning">
          <strong>Database Index Required!</strong><br>
          To show all your reviews, Firebase needs a specific index. 
          Check the console for the index creation link, click it, and wait a few minutes.
        </div>
      `;
    } else {
      container.innerHTML = `<div class="text-danger py-4">Failed to load reviews. Please try again later.</div>`;
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
