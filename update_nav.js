const fs = require('fs');

const replacement = `<ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end">
             <li><a class="dropdown-item" href="profile.html"><i class="bi bi-person me-2"></i>My Profile</a></li>
             <li><a class="dropdown-item" href="watchlist.html"><i class="bi bi-bookmark me-2"></i>My Watchlist</a></li>
             <li><hr class="dropdown-divider"></li>
             <li><a class="dropdown-item text-danger" href="#" onclick="handleLogout()"><i class="bi bi-box-arrow-right me-2"></i>Sign Out</a></li>
          </ul>`;

const files = fs.readdirSync('public').filter(f => f.endsWith('.html'));

files.forEach(f => {
  const p = 'public/' + f;
  let content = fs.readFileSync(p, 'utf8');
  // Replaces the userProfileDropdown ul content
  const regex = /<ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end">[\s\S]*?<\/ul>/;
  if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(p, content);
    console.log('Updated ' + f);
  }
});
