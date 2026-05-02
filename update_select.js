const fs = require('fs');

const newHtml = `<input type="hidden" id="searchCategory" value="all">
          <button class="btn search-category-btn dropdown-toggle d-flex align-items-center justify-content-between" type="button" data-bs-toggle="dropdown" aria-expanded="false" style="max-width:110px; background:#2a2a2a; border:1px solid #3a3a3a; color:#fff; border-radius: 4px 0 0 4px; padding-right: 12px;">
            <span id="searchCategoryLabel" class="me-2">All</span>
          </button>
          <ul class="dropdown-menu dropdown-menu-dark">
            <li><a class="dropdown-item category-item" href="#" data-value="all">All</a></li>
            <li><a class="dropdown-item category-item" href="#" data-value="movies">Movies</a></li>
            <li><a class="dropdown-item category-item" href="#" data-value="tv">TV Shows</a></li>
            <li><a class="dropdown-item category-item" href="#" data-value="people">People</a></li>
          </ul>`;

const files = fs.readdirSync('public').filter(f => f.endsWith('.html'));

files.forEach(f => {
  const p = 'public/' + f;
  let content = fs.readFileSync(p, 'utf8');
  const regex = /<select[\s\S]*?id="searchCategory"[\s\S]*?<\/select>/;
  if (regex.test(content)) {
    content = content.replace(regex, newHtml);
    fs.writeFileSync(p, content);
    console.log('Updated ' + f);
  }
});
