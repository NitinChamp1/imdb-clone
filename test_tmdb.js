const fetch = require('node-fetch');

async function test() {
  const res = await fetch('https://api.themoviedb.org/3/discover/movie?api_key=32d93e0377dd672435a3712b334c0f5e&sort_by=popularity.desc&page=1');
  const data = await res.json();
  console.log(JSON.stringify(data.results[0], null, 2));
}
test();
