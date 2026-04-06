const HEADERS = {
  'User-Agent': 'Mozilla/5.0',
  'accept': 'text/plain; x-api-version=1.0',
  'Referer': 'https://www.legaseriea.it/',
  'Origin': 'https://www.legaseriea.it',
};
const enc = "serie-a%3A%3AFootball_Match%3A%3A56290f4838d04f378d67df40b24a11db";
async function run() {
  const r = await fetch(`https://api-sdp.legaseriea.it/v1/serie-a/football/matches/${enc}/header?locale=it-IT`, { headers: HEADERS });
  const j = await r.json();
  console.log("home keys:", Object.keys(j.home));
  if(j.home.imagery) console.log("home imagery keys:", Object.keys(j.home.imagery));
  if(j.home.colors) console.log("home colors:", j.home.colors);
}
run();
