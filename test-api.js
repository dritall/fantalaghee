async function run() {
  const url = "https://api-sdp.legaseriea.it/v1/serie-a/football/seasons/serie-a%3A%3AFootball_Season%3A%3A5f0e080fc3a44073984b75b3a8e06a8a/matches?locale=it-IT";
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'accept': 'text/plain; x-api-version=1.0',
      'Referer': 'https://www.legaseriea.it/',
      'Origin': 'https://www.legaseriea.it'
    }
  });
  const data = await res.json();
  const m = data.matches?.find(x => x.matchStatus === 'Played') || data.matchSets?.[0]?.matches?.[0] || data.matches?.[0];
  if(m) {
    console.log("MATCH ID:", m.matchId || m.id);
    console.log("MATCH KEYS:", Object.keys(m));
    console.log("competitionId:", m.competitionId, m.seasonId);
    
    // now fetch teamstats
    const mId = encodeURIComponent(m.matchId || m.id);
    const sId = encodeURIComponent(m.seasonId || m.competition?.seasonId || m.competitionId || 'serie-a::Football_Season::5f0e080fc3a44073984b75b3a8e06a8a');
    
    const tsUrl = `https://api-sdp.legaseriea.it/v1/serie-a/football/seasons/${sId}/match/${mId}/teamstats?locale=it-IT`;
    console.log("Fetching teamstats:", tsUrl);
    const tsRes = await fetch(tsUrl, { headers: { 'User-Agent': 'Mozilla/5.0', accept: 'text/plain; x-api-version=1.0'} });
    console.log("Teamstats response:", tsRes.status);
    const tsData = await tsRes.json().catch(e => null);
    const fs = require('fs');
    fs.writeFileSync('teamstats.json', JSON.stringify(tsData, null, 2));

    const pUrl = `https://api-sdp.legaseriea.it/v1/serie-a/football/seasons/${sId}/match/${mId}/summary?locale=it-IT`;
    console.log("Fetching player summary:", pUrl);
    const pRes = await fetch(pUrl, { headers: { 'User-Agent': 'Mozilla/5.0', accept: 'text/plain; x-api-version=1.0'} });
    console.log("Player summary response:", pRes.status);
    const pData = await pRes.json().catch(e => null);
    fs.writeFileSync('player_summary.json', JSON.stringify(pData, null, 2));

  } else {
    console.log("No matches found.");
  }
}
run();
