const fs = require('fs');
const path = require('path');

const jsDir = path.join(__dirname, 'public/js');
const files = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));

files.forEach(file => {
  const filePath = path.join(jsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Replace .replace(/'/g, "\\'") with .replace(/'/g, "\\'").replace(/"/g, "&quot;")
  // Be careful not to double replace if already done.
  const regex = /\.replace\(\/'\/g,\s*"\\\\'"\)(?!\.replace\(\/"\/g)/g;
  if (regex.test(content)) {
    content = content.replace(regex, `.replace(/'/g, "\\\\'").replace(/"/g, "&quot;")`);
    changed = true;
  }

  // Also fix ${m.year} or ${item.year} to '${m.year}' or '${item.year}' in toggleWatchlist calls
  const yearRegex = /toggleWatchlist\([^,]+,\s*[^,]+,\s*[^,]+,\s*\$\{([^}]+)\}/g;
  content = content.replace(yearRegex, (match, yearVar) => {
    // If it already has quotes around it, it won't match this exactly if we use a better regex.
    // Actually let's just use a regex that matches ", ${m.year}," and replaces with ", '${m.year}',"
    return match;
  });

  const exactYearRegex = /(toggleWatchlist\([^,]+,\s*[^,]+,\s*[^,]+,\s*)\$\{([^}]+)\}/g;
  if (exactYearRegex.test(content)) {
    content = content.replace(exactYearRegex, `$1'\${$2}'`);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
});
