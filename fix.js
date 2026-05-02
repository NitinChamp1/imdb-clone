const fs = require('fs');

function fixFile(file, typeReplacement) {
  let content = fs.readFileSync('public/js/' + file, 'utf8');
  // Match toggleWatchlist(id, title, poster, year, rating)
  // title can be complicated like '${m.title.replace(/'/g, "\\'")}'
  // We can just match the closing parenthesis of toggleWatchlist if we are careful.
  // Actually, let's just replace all occurrences of:
  // ${show.rating}) -> ${show.rating}, 'tv')
  // ${m.rating}) -> ${m.rating}, 'movie') or '${m.type}')
  // ${item.rating}) -> ${item.rating}, 'tv') etc.
  
  if (file === 'tvshows.js') {
    content = content.replace(/\$\{show\.rating\}\)/g, "${show.rating}, 'tv')");
  } else if (file === 'movies.js') {
    content = content.replace(/\$\{m\.rating\}\)/g, "${m.rating}, 'movie')");
  } else if (file === 'home.js') {
    content = content.replace(/\$\{m\.rating\}\)/g, "${m.rating}, '${m.type || 'movie'}')");
  } else if (file === 'detail.js') {
    content = content.replace(/toggleWatchlist\(\$\{m\.id\}(.+?)\$\{m\.rating\}\)/g, "toggleWatchlist(${m.id}$1${m.rating}, '${m.type || 'movie'}')");
    // The main button uses item.rating
    content = content.replace(/handleWatchlistToggle\(\$\{item\.id\}(.+?)\$\{item\.rating\}\)/g, "handleWatchlistToggle(${item.id}$1${item.rating}, '${type}')");
    
    // Also fix the definition and call in detail.js
    content = content.replace(/function handleWatchlistToggle\(id, title, poster, year, rating\) \{/, "function handleWatchlistToggle(id, title, poster, year, rating, type = 'movie') {");
    content = content.replace(/const added = toggleWatchlist\(id, title, poster, year, rating\);/, "const added = toggleWatchlist(id, title, poster, year, rating, type);");
  }
  
  fs.writeFileSync('public/js/' + file, content);
}

fixFile('tvshows.js');
fixFile('movies.js');
fixFile('home.js');
fixFile('detail.js');

console.log('Done!');
