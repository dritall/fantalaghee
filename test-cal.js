const https = require('https');
const url = "https://api-sdp.legaseriea.it/v1/serie-a/football/seasons/serie-a%3A%3AFootball_Season%3A%3A5f0e080fc3a44073984b75b3a8e06a8a/calendar?locale=it-IT";
https.get(url, (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const json = JSON.parse(data);
    const sets = json.calendar?.matchSets || json.matchSets || [];
    console.log("Found matchSets:", sets.length);
    if(sets.length) console.log(JSON.stringify(sets.slice(0,2), null, 2));
  });
});
