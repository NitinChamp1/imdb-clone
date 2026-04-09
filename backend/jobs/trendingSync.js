/* ============================================================
   jobs/trendingSync.js — Daily Trending Movies Sync
   ============================================================
   What it does (in order):
     1. Fetch page 1 + page 2 of /trending/movie/week from TMDb
        → up to 40 movies
     2. UPSERT every movie into the `media` table
     3. SET is_trending = FALSE for ALL movies
     4. SET is_trending = TRUE for the fetched TMDb IDs
     5. Log a clear summary: inserted, updated, errors

   Schedule: runs once a day at 02:00 AM (server local time).
   Can also be triggered manually via GET /run-trending-sync.
   ============================================================ */

'use strict';

const cron  = require('node-cron');
const fetch = require('node-fetch');

// ─── These are injected by server.js when it calls initTrendingSync() ─────────
let _db       = null;
let _tmdbKey  = null;
let _tmdbBase = null;


// ============================================================
// CORE JOB FUNCTION
// Called by the cron schedule AND the manual /run-trending-sync endpoint
// ============================================================
async function runTrendingSync() {
  const startedAt = new Date();
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🔄 [TrendingSync] Job started at ${startedAt.toISOString()}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Track results across all pages
  const stats = {
    fetched:  0,
    inserted: 0,
    updated:  0,
    errors:   0,
    ids:      [],   // TMDb IDs successfully processed
  };

  // ─── STEP 1: Fetch trending movies (pages 1 & 2 = up to 40 movies) ─────────
  console.log('\n📡 [Step 1] Fetching trending movies from TMDb…');

  let allMovies = [];
  for (const page of [1, 2]) {
    try {
      const url = new URL(`${_tmdbBase}/trending/movie/week`);
      url.searchParams.set('api_key',  _tmdbKey);
      url.searchParams.set('language', 'en-US');
      url.searchParams.set('page',     page);

      const res  = await fetch(url.toString());
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

      const data = await res.json();
      const movies = data.results || [];
      allMovies = allMovies.concat(movies);
      console.log(`   ✅ Page ${page}: received ${movies.length} movies`);
    } catch (err) {
      console.error(`   ❌ Page ${page} fetch failed: ${err.message}`);
      stats.errors++;
    }
  }

  stats.fetched = allMovies.length;
  console.log(`\n   📊 Total fetched: ${stats.fetched} movies`);

  if (stats.fetched === 0) {
    console.error('\n❌ [TrendingSync] No movies fetched — aborting to avoid wiping is_trending flags.');
    return buildReport(stats, startedAt, 'aborted — fetch returned 0 results');
  }


  // ─── STEP 2: UPSERT each movie into the media table ─────────────────────────
  console.log('\n💾 [Step 2] Upserting movies into database…');

  const upsertSQL = `
    INSERT INTO media (
      id, type, title, original_title, overview,
      poster_path, backdrop_path, tmdb_rating, tmdb_votes,
      popularity, release_date, language, tmdb_updated_at
    )
    VALUES (
      $1, 'movie', $2, $3, $4,
      $5, $6, $7, $8,
      $9, $10, $11, NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      title           = EXCLUDED.title,
      overview        = EXCLUDED.overview,
      poster_path     = EXCLUDED.poster_path,
      backdrop_path   = EXCLUDED.backdrop_path,
      tmdb_rating     = EXCLUDED.tmdb_rating,
      tmdb_votes      = EXCLUDED.tmdb_votes,
      popularity      = EXCLUDED.popularity,
      tmdb_updated_at = NOW()
    RETURNING (xmax = 0) AS was_inserted;
    -- xmax = 0  → row was newly INSERTed
    -- xmax > 0  → row was UPDATEd
  `;

  for (const movie of allMovies) {
    try {
      const values = [
        movie.id,
        movie.title             || movie.name || 'Unknown',
        movie.original_title    || movie.title || 'Unknown',
        movie.overview          || null,
        movie.poster_path       || null,
        movie.backdrop_path     || null,
        parseFloat(movie.vote_average?.toFixed(2)) || 0,
        movie.vote_count        || 0,
        parseFloat(movie.popularity?.toFixed(4))   || 0,
        movie.release_date      || null,
        movie.original_language || 'en',
      ];

      const { rows } = await _db.query(upsertSQL, values);
      const wasInserted = rows[0]?.was_inserted;

      if (wasInserted) {
        stats.inserted++;
        console.log(`   ✅ INSERTED  [${movie.id}] "${movie.title}"`);
      } else {
        stats.updated++;
        console.log(`   🔄 UPDATED   [${movie.id}] "${movie.title}"`);
      }

      stats.ids.push(movie.id);
    } catch (err) {
      stats.errors++;
      console.error(`   ❌ FAILED    [${movie.id}] "${movie.title}": ${err.message}`);
    }
  }


  // ─── STEP 3: Reset ALL is_trending → FALSE ───────────────────────────────────
  // Only run if we successfully processed at least 1 movie
  if (stats.ids.length === 0) {
    console.error('\n❌ [TrendingSync] No movies were upserted — skipping is_trending reset.');
    return buildReport(stats, startedAt, 'aborted — 0 successful upserts');
  }

  console.log('\n🔁 [Step 3] Resetting is_trending = FALSE on all movies…');
  try {
    const { rowCount } = await _db.query(
      `UPDATE media SET is_trending = FALSE WHERE type = 'movie' AND is_trending = TRUE`
    );
    console.log(`   ✅ Cleared is_trending on ${rowCount} previously-trending movie(s)`);
  } catch (err) {
    console.error('   ❌ Reset FAILED:', err.message);
    stats.errors++;
  }


  // ─── STEP 4: Set is_trending = TRUE for today's trending IDs ─────────────────
  console.log(`\n🌟 [Step 4] Marking ${stats.ids.length} movies as is_trending = TRUE…`);
  try {
    // Use ANY($1::bigint[]) — safe parameterised array
    const { rowCount } = await _db.query(
      `UPDATE media
       SET    is_trending = TRUE, updated_at = NOW()
       WHERE  id = ANY($1::bigint[])`,
      [stats.ids]
    );
    console.log(`   ✅ Marked ${rowCount} movie(s) as trending`);
  } catch (err) {
    console.error('   ❌ Mark trending FAILED:', err.message);
    stats.errors++;
  }


  // ─── STEP 5: Final report ─────────────────────────────────────────────────────
  return buildReport(stats, startedAt, 'completed');
}


// ─── Helper: build + log the final report ────────────────────────────────────
function buildReport(stats, startedAt, status) {
  const durationMs = Date.now() - startedAt.getTime();
  const report = {
    status,
    started_at:   startedAt.toISOString(),
    finished_at:  new Date().toISOString(),
    duration_ms:  durationMs,
    movies_fetched:  stats.fetched,
    movies_inserted: stats.inserted,
    movies_updated:  stats.updated,
    errors:          stats.errors,
    trending_ids:    stats.ids,
  };

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ [TrendingSync] ${status.toUpperCase()} in ${durationMs}ms`);
  console.log(`   Fetched: ${stats.fetched}  |  Inserted: ${stats.inserted}  |  Updated: ${stats.updated}  |  Errors: ${stats.errors}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  return report;
}


// ============================================================
// INIT — called from server.js after the DB pool is ready
// ============================================================
function initTrendingSync(db, tmdbKey, tmdbBase) {
  _db       = db;
  _tmdbKey  = tmdbKey;
  _tmdbBase = tmdbBase;

  // ── Schedule: every day at 02:00 AM ─────────────────────
  // Cron syntax: second(opt) minute hour day-of-month month day-of-week
  //              0           0      2    *              *     *
  const schedule = '0 2 * * *';

  cron.schedule(schedule, async () => {
    console.log('\n⏰ [TrendingSync] Cron triggered (daily 02:00 AM)');
    await runTrendingSync();
  }, {
    scheduled: true,
    timezone:  'Asia/Kolkata',   // IST — change if your server is elsewhere
  });

  console.log('⏰ [TrendingSync] Cron job scheduled — runs daily at 02:00 AM IST');
  console.log('   Trigger manually: GET http://localhost:3000/run-trending-sync');
}


module.exports = { initTrendingSync, runTrendingSync };
