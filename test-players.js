const HEADERS = {
  'User-Agent': 'Mozilla/5.0',
  'accept': 'text/plain; x-api-version=1.0',
};
const enc = "serie-a%3A%3AFootball_Match%3A%3A56290f4838d04f378d67df40b24a11db";
const sid = "serie-a%3A%3AFootball_Season%3A%3A5f0e080fc3a44073984b75b3a8e06a8a";
const base = `https://api-sdp.legaseriea.it/v1/serie-a/football/seasons/${sid}/match/${enc}`;

async function run() {
  let r = await fetch(`${base}/summary?locale=it-IT`, { headers: HEADERS });
  let j = await r.json();
  console.log("== SUMMARY keys ==", Object.keys(j));
  if(j.players) console.log("summary players:", j.players.length);

  r = await fetch(`${base}/playerstats?locale=it-IT`, { headers: HEADERS });
  j = await r.json();
  console.log("== PLAYERSTATS keys ==", Object.keys(j));
  if(j.players) console.log("playerstats players:", j.players.length);
}
run();
