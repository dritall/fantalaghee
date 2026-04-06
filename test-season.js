const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko)',
  'accept': 'text/plain; x-api-version=1.0',
  'Referer': 'https://www.legaseriea.it/',
  'Origin': 'https://www.legaseriea.it',
};
const SEASON_ID = 'serie-a%3A%3AFootball_Season%3A%3A5f0e080fc3a44073984b75b3a8e06a8a';
const url = `https://api-sdp.legaseriea.it/v1/serie-a/football/seasons/${SEASON_ID}?locale=it-IT`;
async function run() {
  const r = await fetch(url, { headers: HEADERS });
  const j = await r.json();
  const sets = j?.competition?.matchSets || j?.matchSets || [];
  console.log("Found matchSets:", sets.length);
  if(sets.length > 0) {
    console.log(sets[0].matchdayStatus, sets[0].startDateUtc, sets[0].endDateUtc, sets[0].name);
  }
}
run();
