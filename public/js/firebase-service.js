/* ============================================================
   firebase-service.js — Firebase Helper Functions
   ============================================================ */

/**
 * Signs up a new user with email and password.
 */
function signupUser(email, password) {
  return auth.createUserWithEmailAndPassword(email, password);
}

/**
 * Logs in an existing user.
 */
function loginUser(email, password) {
  return auth.signInWithEmailAndPassword(email, password);
}

/**
 * Logs out the current user.
 */
function logoutUser() {
  return auth.signOut();
}

/**
 * Logs in using Google Popup.
 */
function googleLogin() {
  const provider = new firebase.auth.GoogleAuthProvider();
  return auth.signInWithPopup(provider);
}

/**
 * Fetches the user's watchlist from Firestore.
 */
async function fetchWatchlistFromCloud(userId) {
  try {
    const snapshot = await db.collection('users').doc(userId).collection('watchlist').orderBy('addedAt', 'desc').get();
    const list = [];
    snapshot.forEach(doc => {
      list.push(doc.data());
    });
    return list;
  } catch (err) {
    console.error("Error fetching cloud watchlist:", err);
    return [];
  }
}

/**
 * Saves an item to the user's cloud watchlist.
 */
async function saveToCloudWatchlist(userId, item) {
  try {
    await db.collection('users').doc(userId).collection('watchlist').doc(String(item.id)).set({
      ...item,
      addedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return true;
  } catch (err) {
    console.error("Error saving to cloud:", err);
    return false;
  }
}

/**
 * Removes an item from the user's cloud watchlist.
 */
async function removeFromCloudWatchlist(userId, itemId) {
  try {
    await db.collection('users').doc(userId).collection('watchlist').doc(String(itemId)).delete();
    return true;
  } catch (err) {
    console.error("Error removing from cloud:", err);
    return false;
  }
}
