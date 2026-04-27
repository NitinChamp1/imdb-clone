/* ============================================================
   config.js — TMDb API Configuration
   ⚠️  This file is in .gitignore — DO NOT commit to GitHub!
   ============================================================
   1. Paste your TMDb API key below (from themoviedb.org/settings/api)
   2. Save the file
   3. The entire site will now use live TMDb data!
   ============================================================ */

const TMDB_CONFIG = {
  API_KEY: '32d93e0377dd672435a3712b334c0f5e',       // ← Paste your API key here
  BASE_URL: 'https://api.themoviedb.org/3',
  IMAGE_BASE_URL: 'https://image.tmdb.org/t/p',

  // Image sizes available from TMDb
  IMG: {
    POSTER_SM:   'https://image.tmdb.org/t/p/w185',
    POSTER_MD:   'https://image.tmdb.org/t/p/w342',
    POSTER_LG:   'https://image.tmdb.org/t/p/w500',
    BACKDROP_MD: 'https://image.tmdb.org/t/p/w780',
    BACKDROP_LG: 'https://image.tmdb.org/t/p/w1280',
    PROFILE:     'https://image.tmdb.org/t/p/w185',
  },

  FALLBACK_POSTER:   'assets/no-image.jpg',
  FALLBACK_BACKDROP: 'assets/no-backdrop.jpg',
};
