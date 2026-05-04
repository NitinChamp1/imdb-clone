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

/**
 * Creates a new custom movie list for the user.
 */
async function createCustomList(userId, listName, description = '') {
  try {
    const listRef = await db.collection('users').doc(userId).collection('customLists').add({
      name: listName,
      description: description,
      movies: [], // Array of movie objects
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return listRef.id;
  } catch (err) {
    console.error("Error creating custom list:", err);
    return null;
  }
}

/**
 * Fetches all custom lists for the user.
 */
async function fetchCustomLists(userId) {
  try {
    const snapshot = await db.collection('users').doc(userId).collection('customLists').orderBy('createdAt', 'desc').get();
    const lists = [];
    snapshot.forEach(doc => {
      lists.push({ id: doc.id, ...doc.data() });
    });
    return lists;
  } catch (err) {
    console.error("Error fetching custom lists:", err);
    return [];
  }
}

/**
 * Adds a movie to a specific custom list.
 */
async function addMovieToCustomList(userId, listId, movieItem) {
  try {
    const listRef = db.collection('users').doc(userId).collection('customLists').doc(listId);
    // Remove if already exists to prevent duplicates, then add
    const doc = await listRef.get();
    if (doc.exists) {
      let movies = doc.data().movies || [];
      // If it's already in there, maybe we just return
      if (movies.some(m => m.id === movieItem.id)) {
        return true; // already added
      }
      movies.push({
        ...movieItem,
        addedAt: Date.now()
      });
      await listRef.update({ movies });
    }
    return true;
  } catch (err) {
    console.error("Error adding movie to list:", err);
    return false;
  }
}

/**
 * Removes a movie from a specific custom list.
 */
async function removeMovieFromCustomList(userId, listId, movieId) {
  try {
    const listRef = db.collection('users').doc(userId).collection('customLists').doc(listId);
    const doc = await listRef.get();
    if (doc.exists) {
      let movies = doc.data().movies || [];
      movies = movies.filter(m => m.id !== movieId);
      await listRef.update({ movies });
    }
    return true;
  } catch (err) {
    console.error("Error removing movie from list:", err);
    return false;
  }
}

/**
 * Deletes a custom list entirely.
 */
async function deleteCustomList(userId, listId) {
  try {
    await db.collection('users').doc(userId).collection('customLists').doc(listId).delete();
    return true;
  } catch (err) {
    console.error("Error deleting custom list:", err);
    return false;
  }
}
