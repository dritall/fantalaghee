const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'accept': 'text/plain; x-api-version=1.0',
};

async function run() {
  const url = "https://api-sdp.legaseriea.it/v1/serie-a/football/seasons/serie-a%3A%3AFootball_Season%3A%3A5f0e080fc3a44073984b75b3a8e06a8a/calendar?locale=it-IT";
  const res = await fetch(url, { headers: HEADERS });
  const json = await res.json();
  const sets = json.calendar?.matchSets || json.matchSets || [];
  console.log("MatchSets length:", sets.length);
  if(sets.length > 0) {
    console.log(sets[0]);
  }
}
run();
