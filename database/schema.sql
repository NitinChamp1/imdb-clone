-- ============================================================
-- IMDb Clone — PostgreSQL Schema
-- Mirrors app data model: movies, tv shows, users, watchlist
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";    -- For UUID primary keys
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- For fuzzy/full-text search on titles


-- ============================================================
-- ENUM TYPES
-- ============================================================
CREATE TYPE media_type    AS ENUM ('movie', 'tv');
CREATE TYPE watch_status  AS ENUM ('plan_to_watch', 'watching', 'completed', 'dropped', 'on_hold');
CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected');


-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE users (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    username        VARCHAR(50)     NOT NULL UNIQUE,
    email           VARCHAR(255)    NOT NULL UNIQUE,
    password_hash   TEXT            NOT NULL,                  -- bcrypt/argon2 hash
    display_name    VARCHAR(100),
    avatar_url      TEXT,
    bio             TEXT,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    is_admin        BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email    ON users (email);
CREATE INDEX idx_users_username ON users (username);

COMMENT ON TABLE users IS 'Registered user accounts.';


-- ============================================================
-- 2. GENRES
-- ============================================================
CREATE TABLE genres (
    id          SMALLINT     PRIMARY KEY,          -- TMDb genre IDs (28 = Action, etc.)
    name        VARCHAR(50)  NOT NULL,
    media_type  media_type   NOT NULL,             -- movie | tv
    slug        VARCHAR(50)  NOT NULL,             -- lowercase-hyphenated e.g. 'sci-fi'
    UNIQUE (id, media_type)
);

INSERT INTO genres (id, name, media_type, slug) VALUES
-- Movie genres
(28,    'Action',       'movie', 'action'),
(12,    'Adventure',    'movie', 'adventure'),
(16,    'Animation',    'movie', 'animation'),
(35,    'Comedy',       'movie', 'comedy'),
(80,    'Crime',        'movie', 'crime'),
(99,    'Documentary',  'movie', 'documentary'),
(18,    'Drama',        'movie', 'drama'),
(10751, 'Family',       'movie', 'family'),
(14,    'Fantasy',      'movie', 'fantasy'),
(36,    'History',      'movie', 'history'),
(27,    'Horror',       'movie', 'horror'),
(10402, 'Music',        'movie', 'music'),
(9648,  'Mystery',      'movie', 'mystery'),
(10749, 'Romance',      'movie', 'romance'),
(878,   'Science Fiction', 'movie', 'sci-fi'),
(10770, 'TV Movie',     'movie', 'tv-movie'),
(53,    'Thriller',     'movie', 'thriller'),
(10752, 'War',          'movie', 'war'),
(37,    'Western',      'movie', 'western'),
-- TV genres
(10759, 'Action & Adventure', 'tv', 'action'),
(10762, 'Kids',         'tv', 'kids'),
(10763, 'News',         'tv', 'news'),
(10764, 'Reality',      'tv', 'reality'),
(10765, 'Sci-Fi & Fantasy', 'tv', 'sci-fi'),
(10766, 'Soap',         'tv', 'soap'),
(10767, 'Talk',         'tv', 'talk'),
(10768, 'War & Politics', 'tv', 'war');


-- ============================================================
-- 3. MEDIA  (movies + TV shows in one table — polymorphic)
-- ============================================================
CREATE TABLE media (
    id              BIGINT          PRIMARY KEY,          -- TMDb ID (not auto-generated)
    type            media_type      NOT NULL,
    title           VARCHAR(500)    NOT NULL,
    original_title  VARCHAR(500),
    overview        TEXT,
    tagline         TEXT,

    -- Images (TMDb paths, not full URLs)
    poster_path     TEXT,
    backdrop_path   TEXT,

    -- Ratings (cached from TMDb, refreshed periodically)
    tmdb_rating     NUMERIC(4,2)    DEFAULT 0,            -- e.g. 8.40
    tmdb_votes      INTEGER         DEFAULT 0,
    popularity      NUMERIC(10,4)   DEFAULT 0,

    -- Dates
    release_date    DATE,                                 -- movies: release, TV: first air date
    end_date        DATE,                                 -- TV shows only

    -- Movie-specific
    runtime_minutes SMALLINT,                             -- e.g. 148
    certification   VARCHAR(10),                          -- 'PG-13', 'R', etc.
    budget          BIGINT,
    revenue         BIGINT,

    -- TV-specific
    num_seasons     SMALLINT,
    num_episodes    SMALLINT,
    status          VARCHAR(50),                          -- 'Returning Series', 'Ended', etc.

    -- Flags
    is_trending     BOOLEAN         DEFAULT FALSE,
    is_featured     BOOLEAN         DEFAULT FALSE,

    -- Meta
    language        CHAR(5)         DEFAULT 'en',
    tmdb_updated_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_media_type         ON media (type);
CREATE INDEX idx_media_rating       ON media (tmdb_rating DESC);
CREATE INDEX idx_media_release_date ON media (release_date DESC);
CREATE INDEX idx_media_popularity   ON media (popularity DESC);
CREATE INDEX idx_media_trending     ON media (is_trending) WHERE is_trending = TRUE;
CREATE INDEX idx_media_title_trgm   ON media USING GIN (title gin_trgm_ops); -- fuzzy search

COMMENT ON TABLE media IS 'Unified table for movies and TV shows sourced from TMDb.';


-- ============================================================
-- 4. MEDIA_GENRES  (many-to-many: media ↔ genres)
-- ============================================================
CREATE TABLE media_genres (
    media_id    BIGINT      NOT NULL REFERENCES media (id) ON DELETE CASCADE,
    genre_id    SMALLINT    NOT NULL REFERENCES genres (id) ON DELETE CASCADE,
    PRIMARY KEY (media_id, genre_id)
);

CREATE INDEX idx_media_genres_genre ON media_genres (genre_id);


-- ============================================================
-- 5. PEOPLE  (actors, directors, creators)
-- ============================================================
CREATE TABLE people (
    id              INTEGER     PRIMARY KEY,              -- TMDb person ID
    name            VARCHAR(255) NOT NULL,
    profile_path    TEXT,
    biography       TEXT,
    birthday        DATE,
    deathday        DATE,
    place_of_birth  TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_people_name_trgm ON people USING GIN (name gin_trgm_ops);


-- ============================================================
-- 6. CAST  (media ↔ people — acting roles)
-- ============================================================
CREATE TABLE cast_members (
    id          SERIAL      PRIMARY KEY,
    media_id    BIGINT      NOT NULL REFERENCES media (id) ON DELETE CASCADE,
    person_id   INTEGER     NOT NULL REFERENCES people (id) ON DELETE CASCADE,
    character   VARCHAR(255),
    credit_id   VARCHAR(50),                              -- TMDb credit_id
    "order"     SMALLINT,                                 -- billing order
    UNIQUE (media_id, person_id, credit_id)
);

CREATE INDEX idx_cast_media  ON cast_members (media_id);
CREATE INDEX idx_cast_person ON cast_members (person_id);


-- ============================================================
-- 7. CREW  (directors, writers, composers, etc.)
-- ============================================================
CREATE TABLE crew_members (
    id          SERIAL      PRIMARY KEY,
    media_id    BIGINT      NOT NULL REFERENCES media (id) ON DELETE CASCADE,
    person_id   INTEGER     NOT NULL REFERENCES people (id) ON DELETE CASCADE,
    department  VARCHAR(100),                             -- 'Directing', 'Writing', etc.
    job         VARCHAR(100),                             -- 'Director', 'Screenplay', etc.
    credit_id   VARCHAR(50),
    UNIQUE (media_id, person_id, credit_id)
);

CREATE INDEX idx_crew_media  ON crew_members (media_id);
CREATE INDEX idx_crew_person ON crew_members (person_id);


-- ============================================================
-- 8. VIDEOS  (trailers, teasers, clips)
-- ============================================================
CREATE TABLE videos (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    media_id    BIGINT      NOT NULL REFERENCES media (id) ON DELETE CASCADE,
    name        VARCHAR(255),
    youtube_key VARCHAR(50) NOT NULL,                     -- e.g. 'dQw4w9WgXcQ'
    type        VARCHAR(50),                              -- 'Trailer', 'Teaser', 'Clip'
    is_official BOOLEAN     DEFAULT FALSE,
    published_at TIMESTAMPTZ
);

CREATE INDEX idx_videos_media ON videos (media_id);


-- ============================================================
-- 9. WATCHLIST
-- ============================================================
CREATE TABLE watchlist (
    id          UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID            NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    media_id    BIGINT          NOT NULL REFERENCES media (id) ON DELETE CASCADE,
    status      watch_status    NOT NULL DEFAULT 'plan_to_watch',
    added_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    note        TEXT,                                     -- user's private note
    UNIQUE (user_id, media_id)
);

CREATE INDEX idx_watchlist_user       ON watchlist (user_id);
CREATE INDEX idx_watchlist_media      ON watchlist (media_id);
CREATE INDEX idx_watchlist_status     ON watchlist (user_id, status);
CREATE INDEX idx_watchlist_added_at   ON watchlist (user_id, added_at DESC);

COMMENT ON TABLE watchlist IS 'User watchlists — one row per user+media pair.';


-- ============================================================
-- 10. USER RATINGS  (personal star rating 1-10)
-- ============================================================
CREATE TABLE user_ratings (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    media_id    BIGINT      NOT NULL REFERENCES media (id) ON DELETE CASCADE,
    rating      SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 10),
    rated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, media_id)
);

CREATE INDEX idx_user_ratings_media ON user_ratings (media_id);
CREATE INDEX idx_user_ratings_user  ON user_ratings (user_id);


-- ============================================================
-- 11. REVIEWS
-- ============================================================
CREATE TABLE reviews (
    id          UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID            NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    media_id    BIGINT          NOT NULL REFERENCES media (id) ON DELETE CASCADE,
    title       VARCHAR(255),
    body        TEXT            NOT NULL,
    rating      SMALLINT        CHECK (rating BETWEEN 1 AND 10),
    contains_spoilers BOOLEAN   DEFAULT FALSE,
    status      review_status   NOT NULL DEFAULT 'approved',
    likes       INTEGER         NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, media_id)
);

CREATE INDEX idx_reviews_media    ON reviews (media_id, status);
CREATE INDEX idx_reviews_user     ON reviews (user_id);
CREATE INDEX idx_reviews_rating   ON reviews (rating DESC);

COMMENT ON TABLE reviews IS 'User-written reviews for movies and TV shows.';


-- ============================================================
-- 12. SEARCH HISTORY  (per-user, for autocomplete)
-- ============================================================
CREATE TABLE search_history (
    id          BIGSERIAL   PRIMARY KEY,
    user_id     UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    query       VARCHAR(255) NOT NULL,
    searched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_search_history_user ON search_history (user_id, searched_at DESC);


-- ============================================================
-- VIEWS
-- ============================================================

-- Enriched watchlist view (joins user + media for easy API response)
CREATE OR REPLACE VIEW v_watchlist_detail AS
SELECT
    wl.id               AS watchlist_id,
    wl.user_id,
    wl.status,
    wl.added_at,
    wl.note,
    m.id                AS media_id,
    m.type,
    m.title,
    m.release_date,
    m.poster_path,
    m.tmdb_rating       AS rating,
    m.tmdb_votes        AS votes,
    m.runtime_minutes,
    m.certification,
    m.num_seasons,
    m.num_episodes,
    -- Aggregate genres as an array
    ARRAY_AGG(g.slug ORDER BY g.slug) FILTER (WHERE g.slug IS NOT NULL) AS genres
FROM watchlist wl
JOIN media       m  ON m.id = wl.media_id
LEFT JOIN media_genres mg ON mg.media_id = m.id
LEFT JOIN genres       g  ON g.id = mg.genre_id
GROUP BY wl.id, m.id;

COMMENT ON VIEW v_watchlist_detail IS 'Full watchlist with media info and genre array.';


-- Per-media aggregate stats (avg user rating + review count)
CREATE OR REPLACE VIEW v_media_stats AS
SELECT
    m.id,
    m.title,
    m.type,
    m.tmdb_rating,
    m.tmdb_votes,
    ROUND(AVG(ur.rating), 2)   AS avg_user_rating,
    COUNT(DISTINCT ur.id)      AS total_user_ratings,
    COUNT(DISTINCT r.id)       AS total_reviews,
    COUNT(DISTINCT wl.id)      AS total_watchlisted
FROM media m
LEFT JOIN user_ratings ur ON ur.media_id = m.id
LEFT JOIN reviews      r  ON r.media_id  = m.id AND r.status = 'approved'
LEFT JOIN watchlist    wl ON wl.media_id = m.id
GROUP BY m.id;

COMMENT ON VIEW v_media_stats IS 'Aggregate user stats per media item.';


-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_media_updated_at
    BEFORE UPDATE ON media
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_watchlist_updated_at
    BEFORE UPDATE ON watchlist
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ============================================================
-- SAMPLE QUERIES
-- ============================================================

-- 1. Get a user's watchlist (newest first)
-- SELECT * FROM v_watchlist_detail
-- WHERE user_id = '<uuid>'
-- ORDER BY added_at DESC;

-- 2. Top-rated movies with user rating overlay
-- SELECT m.id, m.title, m.tmdb_rating, s.avg_user_rating
-- FROM media m
-- JOIN v_media_stats s ON s.id = m.id
-- WHERE m.type = 'movie'
-- ORDER BY m.tmdb_rating DESC LIMIT 20;

-- 3. Fuzzy title search (pg_trgm)
-- SELECT id, title, type, tmdb_rating
-- FROM media
-- WHERE title % 'Incepion'          -- typo-tolerant
-- ORDER BY similarity(title, 'Incepion') DESC LIMIT 10;

-- 4. Watchlist stats for a user
-- SELECT
--     COUNT(*)                                           AS total,
--     AVG(m.tmdb_rating)::NUMERIC(4,2)                  AS avg_rating,
--     COUNT(*) FILTER (WHERE m.type = 'movie')           AS movies,
--     COUNT(*) FILTER (WHERE m.type = 'tv')              AS tv_shows
-- FROM watchlist wl
-- JOIN media m ON m.id = wl.media_id
-- WHERE wl.user_id = '<uuid>';

-- 5. Add to watchlist (upsert — safe to call multiple times)
-- INSERT INTO watchlist (user_id, media_id, status)
-- VALUES ('<uuid>', 12345, 'plan_to_watch')
-- ON CONFLICT (user_id, media_id)
-- DO UPDATE SET status = EXCLUDED.status, updated_at = NOW();

-- 6. Remove from watchlist
-- DELETE FROM watchlist WHERE user_id = '<uuid>' AND media_id = 12345;

-- 7. Trending + featured media
-- SELECT id, title, type, tmdb_rating, poster_path
-- FROM media
-- WHERE is_trending = TRUE
-- ORDER BY popularity DESC LIMIT 12;

-- 8. Discover movies by genre + min rating (mirrors TMDB.discoverMovies)
-- SELECT m.id, m.title, m.tmdb_rating, m.release_date
-- FROM media m
-- JOIN media_genres mg ON mg.media_id = m.id
-- JOIN genres       g  ON g.id = mg.genre_id
-- WHERE m.type = 'movie'
--   AND g.slug = 'action'
--   AND m.tmdb_rating >= 7.0
-- ORDER BY m.popularity DESC LIMIT 20;
