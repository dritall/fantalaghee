const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36',
  'accept': 'text/plain; x-api-version=1.0',
  'Referer': 'https://www.legaseriea.it/',
  'Origin': 'https://www.legaseriea.it',
};
async function run() {
  const url = "https://api-sdp.legaseriea.it/v1/serie-a/football/seasons/serie-a%3A%3AFootball_Season%3A%3A5f0e080fc3a44073984b75b3a8e06a8a/calendar?locale=it-IT";
  const res = await fetch(url, { headers: HEADERS });
  const text = await res.text();
  console.log("Raw text length:", text.length, "Start:", text.slice(0, 100));
  if(text.length > 0) {
    const json = JSON.parse(text);
    const sets = json.calendar?.matchSets || json.matchSets || [];
    if(sets.length > 0) console.log(JSON.stringify(sets[0], null, 2));
  }
}
run();
