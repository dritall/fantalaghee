async function run() {
  const url = "https://api-sdp.legaseriea.it/v1/serie-a/football/seasons/serie-a%3A%3AFootball_Season%3A%3A5f0e080fc3a44073984b75b3a8e06a8a/match/serie-a%3A%3AFootball_Match%3A%3A56290f4838d04f378d67df40b24a11db/playerstats?locale=it-IT";
  console.log(url);
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', accept: 'text/plain; x-api-version=1.0'} , redirect: 'follow'});
  console.log("Status:", res.status);
  if(res.ok) {
    const d = await res.json();
    console.log("Keys:", Object.keys(d));
    if(d.stats) console.log("Stats length:", d.stats.length);
    if(d.home) console.log("Home keys:", Object.keys(d.home));
  }
}
run();
