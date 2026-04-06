const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36',
  'accept': 'text/plain; x-api-version=1.0',
  'Referer': 'https://www.legaseriea.it/',
  'Origin': 'https://www.legaseriea.it',
};
const SEASON_ID = 'serie-a%3A%3AFootball_Season%3A%3A5f0e080fc3a44073984b75b3a8e06a8a';
async function run() {
  const r = await fetch(`https://api-sdp.legaseriea.it/v1/serie-a/football/seasons/${SEASON_ID}/matches?locale=it-IT`, { headers: HEADERS });
  const j = await r.json();
  console.log("matches length:", j.matches?.length);
  if(j.matches?.length > 0) {
    const sets = j.matches.map(m => m.matchSet).filter(Boolean);
    console.log("Found matchSets in matches:", sets.length);
    if(sets.length > 0) {
       console.log("matchdayStatus:", sets[0].matchdayStatus);
       console.log("Keys of matchSet:", Object.keys(sets[0]));
    }
  }
}
run();
