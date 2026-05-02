const fs = require('fs');

// 1. Update app.js
let appJs = fs.readFileSync('public/js/app.js', 'utf8');
appJs = appJs.replace(
  'function toggleWatchlist(id, title, poster, year, rating) {',
  'function toggleWatchlist(id, title, poster, year, rating, type = \'movie\') {'
);
appJs = appJs.replace(
  'wl.push({ id, title, poster, year, rating, addedAt: Date.now() });',
  'wl.push({ id, title, poster, year, rating, type, addedAt: Date.now() });'
);
fs.writeFileSync('public/js/app.js', appJs);

// 2. Update tvshows.js (all are tv)
let tvshowsJs = fs.readFileSync('public/js/tvshows.js', 'utf8');
tvshowsJs = tvshowsJs.replace(/toggleWatchlist\(\$\{show\.id\}, '\$\{show\.title\.replace\(\/'\/g, "\\\\'\)\}', '\$\{show\.poster\}', '\$\{show\.year\}', \$\{show\.rating\}\)/g, 'toggleWatchlist(${show.id}, \\\'${show.title.replace(/\\\'/g, "\\\\\\\'")}\\\', \\\'${show.poster}\\\', \\\'${show.year}\\\', ${show.rating}, \\\'tv\\\')'.replace(/\\'/g, "'"));
// wait, better to use simple regex
tvshowsJs = tvshowsJs.replace(/(toggleWatchlist\([^,]+, [^,]+, [^,]+, [^,]+, [^,)]+)\)/g, '$1, \'tv\')');
fs.writeFileSync('public/js/tvshows.js', tvshowsJs);

// 3. Update movies.js (all are movie)
// Movies default to 'movie', so technically we don't need to change it, but let's be explicit
let moviesJs = fs.readFileSync('public/js/movies.js', 'utf8');
moviesJs = moviesJs.replace(/(toggleWatchlist\([^,]+, [^,]+, [^,]+, [^,]+, [^,)]+)\)/g, '$1, \'movie\')');
fs.writeFileSync('public/js/movies.js', moviesJs);

// 4. Update home.js (mixed types, m.type usually exists)
let homeJs = fs.readFileSync('public/js/home.js', 'utf8');
// For home.js, the items usually have m.type.
// Let's replace toggleWatchlist(..., ${m.rating}) with toggleWatchlist(..., ${m.rating}, '${m.type}')
homeJs = homeJs.replace(/(toggleWatchlist\(\$\{m\.id\}, '[^]+?', '\$\{m\.poster\}', [^,]+, \$\{m\.rating\})\)/g, '$1, \'${m.type}\')');
fs.writeFileSync('public/js/home.js', homeJs);

// 5. Update detail.js 
let detailJs = fs.readFileSync('public/js/detail.js', 'utf8');
// In renderSimilar (m.type)
detailJs = detailJs.replace(/(toggleWatchlist\(\$\{m\.id\}, '[^]+?', '\$\{m\.poster\}', \$\{m\.year\}, \$\{m\.rating\})\)/g, '$1, \'${m.type}\')');
// In mainWLBtn (type is global 'type' variable)
detailJs = detailJs.replace(/(handleWatchlistToggle\(\$\{item\.id\}, '[^]+?', '\$\{item\.poster\}', '\$\{item\.year\}', \$\{item\.rating\})\)/g, '$1, \'${type}\')');
// Also update handleWatchlistToggle definition
detailJs = detailJs.replace('function handleWatchlistToggle(id, title, poster, year, rating) {', 'function handleWatchlistToggle(id, title, poster, year, rating, type = \'movie\') {');
detailJs = detailJs.replace('const added = toggleWatchlist(id, title, poster, year, rating);', 'const added = toggleWatchlist(id, title, poster, year, rating, type);');
fs.writeFileSync('public/js/detail.js', detailJs);

console.log('Fixed scripts');
