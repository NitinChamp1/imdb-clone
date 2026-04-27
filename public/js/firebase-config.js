/* ============================================================
   firebase-config.js — Firebase Configuration & Initialization
   ============================================================ */

const firebaseConfig = {
  apiKey: "AIzaSyCZVEyB5OhgAaNgW5LAaRyVJM3cuVZMLL4",
  authDomain: "imdbclone-1653c.firebaseapp.com",
  projectId: "imdbclone-1653c",
  storageBucket: "imdbclone-1653c.firebasestorage.app",
  messagingSenderId: "388212540287",
  appId: "1:388212540287:web:103b234e5f0d23839d504a",
  measurementId: "G-Q918640EKH"
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
  window.db = firebase.firestore();
  window.auth = firebase.auth();
  console.log("🔥 Firebase initialized.");
} else {
  console.error("❌ Firebase SDK not loaded. Check your internet or script tags.");
}
