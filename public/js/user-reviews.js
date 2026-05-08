/* ============================================================
   user-reviews.js — Paginated and Sorted User Reviews
   ============================================================ */

let allReviews = [];
let currentPage = 1;
const REVIEWS_PER_PAGE = 20;

document.addEventListener('DOMContentLoaded', () => {
  auth.onAuthStateChanged(user => {
    if (user) {
      loadAllReviews(user.uid);
    } else {
      window.location.href = 'index.html';
    }
  });

  document.getElementById('sortReviewsSelect').addEventListener('change', (e) => {
    sortReviews(e.target.value);
    currentPage = 1;
    renderReviews();
  });
});

async function loadAllReviews(uid) {
  const container = document.getElementById('userReviewsContainer');
  container.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-warning" role="status"><span class="visually-hidden">Loading...</span></div></div>`;

  try {
    const snapshot = await db.collectionGroup('userReviews').where('uid', '==', uid).orderBy('createdAt', 'desc').get();
    
    if (snapshot.empty) {
      container.innerHTML = `
        <div class="text-center py-5">
          <i class="bi bi-chat-square-text text-muted" style="font-size: 3rem;"></i>
          <h5 class="text-white mt-3">No reviews yet</h5>
          <p class="text-muted">You haven't written any reviews.</p>
        </div>
      `;
      document.getElementById('paginationContainer').innerHTML = '';
      return;
    }

    allReviews = [];
    snapshot.forEach(doc => {
      const r = doc.data();
      const movieId = doc.ref.parent.parent.id;
      allReviews.push({ id: doc.id, movieId, ...r });
    });

    // Default sort: Newest First
    sortReviews('newest');
    renderReviews();

  } catch (err) {
    console.error("Error loading reviews:", err);
    if (err.code === 'failed-precondition' || err.message.includes("requires an index")) {
      container.innerHTML = `
        <div class="alert alert-warning text-start">
          <strong>Database Index Required!</strong><br>
          To show all your reviews, Firebase needs a specific index. 
          Check the browser console (Right Click -> Inspect -> Console) for a blue link, click it, and wait 3-5 minutes.
        </div>
      `;
    } else if (err.code === 'permission-denied' || err.message.includes("permissions")) {
      container.innerHTML = `
        <div class="alert alert-danger text-start">
          <strong>Permission Denied!</strong><br>
          Your Firebase rules are blocking this query. Go to Firebase Console -> Firestore -> Rules, and add:<br>
          <code class="d-block mt-2 bg-dark p-2 rounded text-light">match /{path=**}/userReviews/{reviewId} { allow read: if true; }</code>
        </div>
      `;
    } else {
      container.innerHTML = `<div class="text-danger py-4">Failed to load reviews. Please try again later.<br><small class="text-muted">Error details: ${err.message}</small></div>`;
    }
  }

function sortReviews(sortType) {
  if (sortType === 'newest') {
    allReviews.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
  } else if (sortType === 'oldest') {
    allReviews.sort((a, b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0));
  } else if (sortType === 'highest') {
    allReviews.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (sortType === 'lowest') {
    allReviews.sort((a, b) => (a.rating || 0) - (b.rating || 0));
  }
}

function renderReviews() {
  const container = document.getElementById('userReviewsContainer');
  
  const startIndex = (currentPage - 1) * REVIEWS_PER_PAGE;
  const endIndex = startIndex + REVIEWS_PER_PAGE;
  const reviewsToShow = allReviews.slice(startIndex, endIndex);

  let reviewsHtml = '';

  reviewsToShow.forEach(r => {
    const date = r.createdAt ? new Date(r.createdAt.toDate()).toLocaleDateString() : 'Unknown Date';
    reviewsHtml += `
      <div class="review-card mb-4" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); padding:20px; border-radius:12px;">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div>
            <div class="text-muted small">${date}</div>
            <h5 class="text-white mb-0 mt-1">
              <a href="detail.html?id=${r.movieId}&type=${r.type || 'movie'}" class="text-white text-decoration-none hover-warning">
                Review for Item #${r.movieId}
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
  renderPagination();
}

function renderPagination() {
  const paginationContainer = document.getElementById('paginationContainer');
  const totalPages = Math.ceil(allReviews.length / REVIEWS_PER_PAGE);

  if (totalPages <= 1) {
    paginationContainer.innerHTML = '';
    return;
  }

  let html = '<ul class="pagination justify-content-center">';
  
  // Prev button
  html += `
    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
      <button class="page-link" onclick="goToPage(${currentPage - 1})">Previous</button>
    </li>
  `;

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    html += `
      <li class="page-item ${currentPage === i ? 'active' : ''}">
        <button class="page-link" onclick="goToPage(${i})">${i}</button>
      </li>
    `;
  }

  // Next button
  html += `
    <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
      <button class="page-link" onclick="goToPage(${currentPage + 1})">Next</button>
    </li>
  `;

  html += '</ul>';
  paginationContainer.innerHTML = html;
}

function goToPage(page) {
  const totalPages = Math.ceil(allReviews.length / REVIEWS_PER_PAGE);
  if (page >= 1 && page <= totalPages) {
    currentPage = page;
    renderReviews();
    window.scrollTo(0, 0);
  }
}
