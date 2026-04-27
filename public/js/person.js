/* ============================================================
   person.js — Logic for person.html (Celebrity Detail)
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  await initTMDb();
  
  const params = new URLSearchParams(window.location.search);
  const personId = params.get('id');

  if (!personId) {
    document.getElementById('loader').innerHTML = '<div class="text-white py-5">Person not found.</div>';
    return;
  }

  loadPerson(personId);
});

async function loadPerson(id) {
  const data = await TMDB.getPersonDetail(id);
  
  if (!data) {
    document.getElementById('loader').innerHTML = '<div class="text-white py-5">Failed to load data.</div>';
    return;
  }

  // 1. Populate Personal Info
  document.getElementById('personImage').src = data.profile_path ? TMDB_CONFIG.IMG.POSTER_LG + data.profile_path : TMDB_CONFIG.FALLBACK_POSTER;
  document.getElementById('personName').textContent = data.name;
  document.getElementById('personBio').textContent = data.biography || "We don't have a biography for " + data.name + ".";
  
  document.getElementById('personKnownForDept').textContent = data.known_for_department || '-';
  document.getElementById('personGender').textContent = data.gender === 1 ? 'Female' : data.gender === 2 ? 'Male' : '-';
  
  // Calculate age if birthday exists
  let birthdayStr = data.birthday || '-';
  if (data.birthday) {
    const bDate = new Date(data.birthday);
    const ageDifMs = Date.now() - bDate.getTime();
    const ageDate = new Date(ageDifMs);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    birthdayStr += ` (${age} years old)`;
  }
  document.getElementById('personBirthday').textContent = birthdayStr;
  document.getElementById('personBirthplace').textContent = data.place_of_birth || '-';
  
  const aka = data.also_known_as && data.also_known_as.length > 0 ? data.also_known_as.join('\n') : '-';
  document.getElementById('personAlsoKnownAs').textContent = aka;

  // 2. Populate "Known For"
  // Usually this is the highest popularity combined credits. Let's filter to acting roles if they are an actor.
  const credits = data.combined_credits?.cast || [];
  
  // Sort by cast popularity/vote_count to get top known for
  const knownForItems = [...credits].sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0)).slice(0, 8);
  
  const knownForContainer = document.getElementById('knownForList');
  knownForContainer.innerHTML = knownForItems.map(item => {
    const title = item.title || item.name;
    const imgUrl = item.poster_path ? TMDB_CONFIG.IMG.POSTER_MD + item.poster_path : TMDB_CONFIG.FALLBACK_POSTER;
    const type = item.media_type || 'movie';
    const link = `detail.html?id=${item.id}&type=${type}`;
    
    return `
      <a href="${link}" class="text-decoration-none known-for-card">
        <div class="card bg-dark text-white h-100 border-0">
          <img src="${imgUrl}" class="card-img-top rounded" alt="${title}" style="height: 200px; object-fit: cover;">
          <div class="card-body p-2 text-center text-truncate">
            <span class="small fw-bold text-white d-block text-truncate" title="${title}">${title}</span>
          </div>
        </div>
      </a>
    `;
  }).join('');

  // 3. Populate Acting Credits List
  const creditsList = document.getElementById('creditsList');
  
  const bYear = data.birthday ? parseInt(data.birthday.slice(0, 4)) : 0;

  // Clean, format, and sort by year descending
  const sortedCredits = [...credits]
    .map(item => {
      let year = parseInt((item.release_date || item.first_air_date || '').slice(0, 4));
      // If the media's first_air_date is before they were even born (common for long-running TV shows),
      // we mark it as 0 so it displays as '—' instead of a ridiculous past year.
      if (bYear > 0 && year > 0 && year < bYear) {
        year = 0;
      }
      return { ...item, parsedYear: isNaN(year) ? 0 : year };
    })
    .sort((a, b) => b.parsedYear - a.parsedYear);

  let currentYear = -1;
  const tableRows = sortedCredits.map(c => {
    const title = c.title || c.name;
    const character = c.character ? `<span class="d-block small" style="color: #bbb;">as ${c.character}</span>` : '';
    const yearDisplay = c.parsedYear > 0 ? c.parsedYear : '—';
    const type = c.media_type || 'movie';
    const link = `detail.html?id=${c.id}&type=${type}`;
    
    // Optional timeline gap styling
    let borderStyle = '';
    if (currentYear !== -1 && currentYear !== c.parsedYear) {
      borderStyle = 'border-top: 2px solid #222;';
    }
    currentYear = c.parsedYear;

    return `
      <tr style="${borderStyle}">
        <td class="credits-year">${yearDisplay}</td>
        <td>
          <a href="${link}" class="text-white text-decoration-none fw-bold" title="${title}">${title}</a>
          ${character}
        </td>
      </tr>
    `;
  }).join('');

  creditsList.innerHTML = tableRows || '<tr><td colspan="2" class="text-center text-muted">No credits found.</td></tr>';

  // Show UI
  document.getElementById('loader').style.display = 'none';
  document.getElementById('personContent').style.display = 'block';
}
