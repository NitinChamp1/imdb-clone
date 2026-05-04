const fs = require('fs');
const path = require('path');

const files = fs.readdirSync('public').filter(f => f.endsWith('.html') && f !== 'discover.html');

files.forEach(f => {
  const p = path.join('public', f);
  let content = fs.readFileSync(p, 'utf8');
  
  // Look for the Celebrities nav item and insert Discover after it.
  const regexCelebrities = /(<li class="nav-item"><a class="nav-link nav-pill text-(?:white|warning)(?: fw-600)?" href="celebrities\.html">Celebrities<\/a><\/li>)/g;
  
  // Some files might not have celebrities, so fallback to tvshows
  const regexTvShows = /(<li class="nav-item"><a class="nav-link nav-pill text-(?:white|warning)(?: fw-600)?" href="tvshows\.html">TV Shows<\/a><\/li>)/g;

  if (content.includes('href="discover.html"')) {
     console.log('Skipping ' + f + ', already has discover link.');
     return;
  }

  if (regexCelebrities.test(content)) {
    content = content.replace(regexCelebrities, '$1\n        <li class="nav-item"><a class="nav-link nav-pill text-white" href="discover.html">Discover</a></li>');
    fs.writeFileSync(p, content);
    console.log('Updated ' + f + ' (via Celebrities)');
  } else if (regexTvShows.test(content)) {
    content = content.replace(regexTvShows, '$1\n        <li class="nav-item"><a class="nav-link nav-pill text-white" href="discover.html">Discover</a></li>');
    fs.writeFileSync(p, content);
    console.log('Updated ' + f + ' (via TV Shows)');
  } else {
    console.log('Could not find nav hook in ' + f);
  }
});
