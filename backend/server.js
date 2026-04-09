/* ============================================================
   server.js — IMDb Clone Express Backend
   Endpoints:
     GET /health       → checks PostgreSQL + TMDb connectivity
     GET /test-insert  → fetches 1 movie from TMDb, inserts into DB
     GET /movies       → paginated list of movies sorted by release_date DESC
     GET /search       → search media by title using ILIKE (case-insensitive)
   ============================================================ */

'use strict';

// ─── Load env vars FIRST ─────────────────────────────────────
require('dotenv').config({ path: '../.env' }); // reads the .env in project root

const express  = require('express');
const cors     = require('cors');
const { Pool } = require('pg');
const fetch    = require('node-fetch');
const { initTrendingSync, runTrendingSync } = require('./jobs/trendingSync');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── CORS ─────────────────────────────────────────────────────
// In production set FRONTEND_URL to your Netlify domain.
// Multiple allowed origins are supported (comma-separated in env).
const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean)
  .concat([
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:8080',
  ]);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (e.g. same-origin, curl, Postman)
    if (!origin) return cb(null, true);
    if (allowedOrigins.some(o => origin.startsWith(o))) return cb(null, true);
    cb(new Error(`CORS: origin "${origin}" is not allowed.`));
  },
  credentials: true,
}));
app.use(express.json());


// ─── PostgreSQL Connection Pool ───────────────────────────────
const db = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || 'imdb_clone',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD,
  // Connection timeout settings
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis:       10000,
});

// Log pool errors (e.g. Postgres not running)
db.on('error', (err) => {
  console.error('❌ [DB Pool Error]', err.message);
});


// ─── TMDb Helper ─────────────────────────────────────────────
const TMDB_KEY     = process.env.TMDB_API_KEY;
const TMDB_BASE    = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';

/**
 * Fetch from TMDb API.
 * @param {string} endpoint  e.g. '/movie/popular'
 * @param {object} params    extra query params
 */
async function tmdbFetch(endpoint, params = {}) {
  const url = new URL(`${TMDB_BASE}${endpoint}`);
  url.searchParams.set('api_key', TMDB_KEY);
  url.searchParams.set('language', 'en-US');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDb responded with ${res.status} ${res.statusText}`);
  return res.json();
}


// ============================================================
// ROUTE 1:  GET /health
// Checks: PostgreSQL (SELECT 1) + TMDb API (popular movies)
// ============================================================
app.get('/health', async (req, res) => {
  console.log('\n📡 [GET /health] Running health checks…');

  const result = {
    db:        'unreachable',
    tmdb:      'unreachable',
    timestamp: new Date().toISOString(),
  };
  let httpStatus = 200;

  // ── 1. PostgreSQL check ──────────────────────────────────
  try {
    const { rows } = await db.query('SELECT 1 AS ping');
    if (rows[0].ping === 1) {
      result.db = 'connected';
      console.log('✅ [DB] PostgreSQL connection OK');
    }
  } catch (err) {
    result.db = 'error';
    result.db_error = err.message;
    httpStatus = 503;
    console.error('❌ [DB] PostgreSQL connection FAILED:', err.message);
    console.error('   → Check DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD in .env');
  }

  // ── 2. TMDb API check ────────────────────────────────────
  try {
    if (!TMDB_KEY || TMDB_KEY === 'your_tmdb_api_key_here') {
      throw new Error('TMDB_API_KEY is not set in .env');
    }
    const data = await tmdbFetch('/movie/popular', { page: 1 });
    if (data?.results?.length > 0) {
      result.tmdb = 'working';
      result.tmdb_sample_title = data.results[0].title;  // e.g. "Oppenheimer"
      console.log(`✅ [TMDb] API working — sample: "${data.results[0].title}"`);
    }
  } catch (err) {
    result.tmdb = 'error';
    result.tmdb_error = err.message;
    httpStatus = 503;
    console.error('❌ [TMDb] API check FAILED:', err.message);
    console.error('   → Check TMDB_API_KEY in .env (get one at themoviedb.org/settings/api)');
  }

  // ── Final response ───────────────────────────────────────
  console.log('📤 [/health] Result:', result);
  res.status(httpStatus).json(result);
});


// ============================================================
// ROUTE 2:  GET /test-insert
// Fetches 1 popular movie from TMDb → inserts into media table
// ============================================================
app.get('/test-insert', async (req, res) => {
  console.log('\n🎬 [GET /test-insert] Fetching movie from TMDb…');

  // ── Step 1: Fetch from TMDb ───────────────────────────────
  let movie;
  try {
    if (!TMDB_KEY || TMDB_KEY === 'your_tmdb_api_key_here') {
      throw new Error('TMDB_API_KEY is not set in .env');
    }
    const data = await tmdbFetch('/movie/popular', { page: 1 });
    movie = data.results[0]; // take the first popular movie
    console.log(`✅ [TMDb] Fetched movie: "${movie.title}" (id=${movie.id})`);
  } catch (err) {
    console.error('❌ [TMDb] Failed to fetch movie:', err.message);
    return res.status(502).json({
      success: false,
      step:    'tmdb_fetch',
      error:   err.message,
    });
  }

  // ── Step 2: Insert into PostgreSQL (media table) ─────────
  // Uses ON CONFLICT DO UPDATE so it's safe to call multiple times
  const sql = `
    INSERT INTO media (
      id,
      type,
      title,
      original_title,
      overview,
      poster_path,
      backdrop_path,
      tmdb_rating,
      tmdb_votes,
      popularity,
      release_date,
      language,
      tmdb_updated_at
    )
    VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9, $10,
      $11, $12, NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      title           = EXCLUDED.title,
      tmdb_rating     = EXCLUDED.tmdb_rating,
      tmdb_votes      = EXCLUDED.tmdb_votes,
      popularity      = EXCLUDED.popularity,
      tmdb_updated_at = NOW()
    RETURNING *;
  `;

  const values = [
    movie.id,                                             // $1  BIGINT
    'movie',                                              // $2  media_type enum
    movie.title,                                          // $3  title
    movie.original_title || movie.title,                  // $4  original_title
    movie.overview       || null,                         // $5  overview
    movie.poster_path    || null,                         // $6  poster_path
    movie.backdrop_path  || null,                         // $7  backdrop_path
    parseFloat(movie.vote_average?.toFixed(2)) || 0,      // $8  tmdb_rating
    movie.vote_count     || 0,                            // $9  tmdb_votes
    parseFloat(movie.popularity?.toFixed(4))   || 0,      // $10 popularity
    movie.release_date   || null,                         // $11 release_date (DATE)
    movie.original_language || 'en',                      // $12 language
  ];

  let inserted;
  try {
    const { rows } = await db.query(sql, values);
    inserted = rows[0];
    console.log(`✅ [DB] Inserted/updated: "${inserted.title}" (id=${inserted.id})`);
  } catch (err) {
    console.error('❌ [DB] Insert FAILED:', err.message);
    console.error('   → SQL state:', err.code);
    console.error('   → Detail:',   err.detail);
    console.error('   → Hint: Make sure you ran database/schema.sql first!');
    return res.status(500).json({
      success:  false,
      step:     'db_insert',
      error:    err.message,
      sql_code: err.code,
      hint:     'Did you run database/schema.sql on your PostgreSQL database?',
    });
  }

  // ── Step 3: Return the inserted row ──────────────────────
  return res.status(200).json({
    success:  true,
    message:  `"${inserted.title}" inserted into media table successfully.`,
    movie:    inserted,
  });
});


// ============================================================
// ROUTE 3:  GET /movies
// Returns movies from DB sorted by release_date DESC.
//
// Query params:
//   page   (integer, default 1)   — which page to return
//   limit  (integer, default 20)  — rows per page, max 100
//
// Example calls:
//   /movies
//   /movies?page=2
//   /movies?limit=10&page=3
// ============================================================
app.get('/movies', async (req, res) => {
  // ── Parse + validate query params ────────────────────────
  const limit  = Math.min(Math.max(parseInt(req.query.limit)  || 20,  1), 100); // clamp 1–100
  const page   = Math.max(parseInt(req.query.page) || 1, 1);                    // minimum page 1
  const offset = (page - 1) * limit;

  console.log(`\n🎬 [GET /movies] page=${page}, limit=${limit}, offset=${offset}`);

  try {
    // ── Run data query + count query in parallel ──────────
    const dataSQL = `
      SELECT
        m.id,
        m.type,
        m.title,
        m.original_title,
        m.overview,
        m.poster_path,
        m.backdrop_path,
        m.tmdb_rating,
        m.tmdb_votes,
        m.popularity,
        m.release_date,
        m.runtime_minutes,
        m.certification,
        m.language,
        m.is_trending,
        m.is_featured,
        m.created_at,
        -- Aggregate genres as a JSON array: [{id, name, slug}]
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT('id', g.id, 'name', g.name, 'slug', g.slug)
            ORDER BY g.name
          ) FILTER (WHERE g.id IS NOT NULL),
          '[]'
        ) AS genres
      FROM  media m
      LEFT JOIN media_genres mg ON mg.media_id = m.id
      LEFT JOIN genres       g  ON g.id = mg.genre_id
      WHERE m.type = 'movie'
      GROUP BY m.id
      ORDER BY m.release_date DESC NULLS LAST, m.popularity DESC
      LIMIT  $1
      OFFSET $2;
    `;

    const countSQL = `
      SELECT COUNT(*) AS total
      FROM  media
      WHERE type = 'movie';
    `;

    // Fire both queries at the same time
    const [dataResult, countResult] = await Promise.all([
      db.query(dataSQL, [limit, offset]),
      db.query(countSQL),
    ]);

    const movies     = dataResult.rows;
    const total      = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    console.log(`✅ [/movies] Returned ${movies.length} of ${total} total movies (page ${page}/${totalPages})`);

    // ── Build response ────────────────────────────────────
    return res.status(200).json({
      success: true,
      pagination: {
        page,
        limit,
        total,
        total_pages:  totalPages,
        has_next:     page < totalPages,
        has_prev:     page > 1,
        next_page:    page < totalPages ? page + 1 : null,
        prev_page:    page > 1         ? page - 1 : null,
      },
      movies,
    });

  } catch (err) {
    console.error('❌ [/movies] Query FAILED:', err.message);
    console.error('   → SQL code:', err.code);
    return res.status(500).json({
      success: false,
      error:   err.message,
      hint:    'Make sure database/schema.sql has been run and the media table exists.',
    });
  }
});


// ============================================================
// ROUTE 4:  GET /search
// Search movies (and optionally TV shows) by title using ILIKE.
//
// Query params:
//   q      (string,  required)    — search term, min 1 char
//   type   (string,  optional)    — 'movie' | 'tv' | omit for both
//   page   (integer, default 1)
//   limit  (integer, default 20, max 100)
//
// Example calls:
//   /search?q=heart
//   /search?q=spider&type=movie
//   /search?q=batman&page=2&limit=5
// ============================================================
app.get('/search', async (req, res) => {
  const q     = (req.query.q || '').trim();
  const type  = req.query.type || null;    // 'movie' | 'tv' | null (both)
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
  const page  = Math.max(parseInt(req.query.page) || 1, 1);
  const offset = (page - 1) * limit;

  console.log(`\n🔍 [GET /search] q="${q}" type=${type || 'any'} page=${page} limit=${limit}`);

  // ── Require at least 1 character ─────────────────────────
  if (!q) {
    return res.status(400).json({
      success: false,
      error:   'Missing query parameter: q',
      hint:    'Use /search?q=your+search+term',
    });
  }

  // ── Wrap the term for ILIKE: %heart% ─────────────────────
  const pattern = `%${q}%`;

  try {
    // ── Build type filter clause ──────────────────────────────
    // If type is specified, filter by it; otherwise search all media
    const typeFilter = type ? `AND m.type = $3` : '';
    const dataParams = type ? [pattern, limit, type, offset] : [pattern, limit, offset];
    const countParams = type ? [pattern, type] : [pattern];
    const offsetParam = type ? '$4' : '$3';

    const dataSQL = `
      SELECT
        m.id,
        m.type,
        m.title,
        m.original_title,
        m.overview,
        m.poster_path,
        m.backdrop_path,
        m.tmdb_rating,
        m.tmdb_votes,
        m.popularity,
        m.release_date,
        m.runtime_minutes,
        m.certification,
        m.language,
        m.is_trending,
        m.is_featured,
        -- Relevance score: exact match = 3, starts-with = 2, contains = 1
        CASE
          WHEN LOWER(m.title) = LOWER(REPLACE(REPLACE($1::text, '%', ''), '_', '')) THEN 3
          WHEN LOWER(m.title) LIKE LOWER(REPLACE(REPLACE($1::text, '%', ''), '_', '') || '%') THEN 2
          ELSE 1
        END AS relevance,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT('id', g.id, 'name', g.name, 'slug', g.slug)
            ORDER BY g.name
          ) FILTER (WHERE g.id IS NOT NULL),
          '[]'
        ) AS genres
      FROM  media m
      LEFT JOIN media_genres mg ON mg.media_id = m.id
      LEFT JOIN genres       g  ON g.id = mg.genre_id
      WHERE (m.title ILIKE $1 OR m.original_title ILIKE $1)
      ${typeFilter}
      GROUP BY m.id
      ORDER BY relevance DESC, m.popularity DESC, m.release_date DESC NULLS LAST
      LIMIT  $2
      OFFSET ${offsetParam};
    `;

    const countSQL = `
      SELECT COUNT(*) AS total
      FROM  media m
      WHERE (m.title ILIKE $1 OR m.original_title ILIKE $1)
      ${type ? 'AND m.type = $2' : ''};
    `;

    const [dataResult, countResult] = await Promise.all([
      db.query(dataSQL, dataParams),
      db.query(countSQL, countParams),
    ]);

    const results    = dataResult.rows;
    const total      = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit) || 1;

    console.log(`✅ [/search] "${q}" → ${results.length} results (${total} total)`);

    return res.status(200).json({
      success: true,
      query:   q,
      type:    type || 'all',
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
        has_next:    page < totalPages,
        has_prev:    page > 1,
        next_page:   page < totalPages ? page + 1 : null,
        prev_page:   page > 1         ? page - 1 : null,
      },
      results,
    });

  } catch (err) {
    console.error('❌ [/search] Query FAILED:', err.message);
    console.error('   → SQL code:', err.code);
    return res.status(500).json({
      success: false,
      error:   err.message,
      hint:    'Make sure database/schema.sql has been run and the media table exists.',
    });
  }
});


// ============================================================
// ROUTE 5:  GET /run-trending-sync
// Manually triggers the daily trending sync job immediately.
// Useful for testing or forcing a refresh outside cron schedule.
// ============================================================
app.get('/run-trending-sync', async (req, res) => {
  console.log('\n⚡ [GET /run-trending-sync] Manual trigger received');
  try {
    const report = await runTrendingSync();
    return res.status(200).json({ success: true, report });
  } catch (err) {
    console.error('❌ [/run-trending-sync] Unexpected error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});


// ============================================================
// 404 Catch-all
// ============================================================
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
});


// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 IMDb Clone Backend running');
  console.log(`   http://localhost:${PORT}/health`);
  console.log(`   http://localhost:${PORT}/test-insert`);
  console.log(`   http://localhost:${PORT}/movies`);
  console.log(`   http://localhost:${PORT}/movies?page=2&limit=10`);
  console.log(`   http://localhost:${PORT}/search?q=heart`);
  console.log(`   http://localhost:${PORT}/search?q=spider&type=movie&limit=5`);
  console.log(`   http://localhost:${PORT}/run-trending-sync  ← manual job trigger`);
  console.log('');
  console.log('📋 Config loaded:');
  console.log(`   DB_HOST  = ${process.env.DB_HOST}`);
  console.log(`   DB_PORT  = ${process.env.DB_PORT}`);
  console.log(`   DB_NAME  = ${process.env.DB_NAME}`);
  console.log(`   DB_USER  = ${process.env.DB_USER}`);
  console.log(`   TMDB_KEY = ${TMDB_KEY ? TMDB_KEY.slice(0, 6) + '…(hidden)' : '⚠️  NOT SET'}`);
  console.log('');

  // ── Start the trending sync cron job ────────────────────
  initTrendingSync(db, TMDB_KEY, TMDB_BASE);
});
