const fs = require('fs');

const headers = {
  'x-rapidapi-host': 'api-dojo.p.rapidapi.com',
  'x-rapidapi-key': '3b9798580fmsh5505297c4cba235p1158b4jsn3683c74d3ef0'
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchAndSave(url, filename) {
  console.log(`\n⬇️  GET: ${url}`);
  try {
    const response = await fetch(url, { method: 'GET', headers });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Status ${response.status} - Body: ${errorText}`);
    }
    const data = await response.json();
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`✅ File salvato con successo: ${filename}`);
    return data;
  } catch (err) {
    console.error(`❌ Errore durante il recupero o salvataggio di ${filename}:`);
    console.error(`   Path fallito: ${url}`);
    console.error(`   Dettaglio: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log(`🚀 Avvio esplorazione API-Dojo...\n`);

  // 1. Calendario
  const dateToSearch = '2024-04-14';
  const scheduleUrl = `https://api-dojo.p.rapidapi.com/schedule/v2/get-matches?date=${dateToSearch}&timezone=Europe%2FRome`;
  
  const scheduleData = await fetchAndSave(scheduleUrl, 'dojo_1_calendario.json');
  let tournamentId = 23;
  let seasonId = 52760;
  let eventId = 11407312; // Example event ID

  if (scheduleData) {
    let events = scheduleData.events || [];
    if (!events.length && Array.isArray(scheduleData)) {
      events = scheduleData;
    } else if (!events.length && scheduleData.matches) {
      events = scheduleData.matches;
    }

    const serieAMatch = events.find(e => {
      const matchTournament = e.tournament || {};
      const tName = matchTournament.uniqueTournament?.name || matchTournament.name || '';
      return tName.includes('Serie A');
    });

    if (serieAMatch) {
      tournamentId = serieAMatch.tournament?.uniqueTournament?.id || serieAMatch.tournament?.id || 23;
      seasonId = serieAMatch.season?.id || 52760;
      eventId = serieAMatch.id || eventId;
      console.log(`\nℹ️  Match di Serie A Trovato! ID Estratti:`);
      console.log(`   - Tournament ID: ${tournamentId}`);
      console.log(`   - Season ID:     ${seasonId}`);
      console.log(`   - Event ID:      ${eventId}\n`);
    } else {
      console.error("❌ Nessun match di Serie A trovato nel calendario ricevuto. Uso ID di fallback.");
    }
  } else {
    console.error("❌ Errore nel recupero del calendario. Uso ID di fallback per testare i restanti path.");
  }

  await sleep(1000); // Rate limiting

  // 3. Classifica
  // Tentativo col primo path
  let standingsUrl = `https://api-dojo.p.rapidapi.com/standings/get-standings?tournamentId=${tournamentId}&seasonId=${seasonId}`;
  let standingsData = await fetchAndSave(standingsUrl, 'dojo_2_classifica.json');
  
  // Se fallisce (404), proviamo il fallback
  if (!standingsData) {
    await sleep(1000);
    console.log(`\n⚠️ Fallito primo tentativo classifica. Provo il fallback...`);
    standingsUrl = `https://api-dojo.p.rapidapi.com/tournaments/get-standings?tournamentId=${tournamentId}&seasonId=${seasonId}`;
    await fetchAndSave(standingsUrl, 'dojo_2_classifica.json');
  }

  await sleep(1000);

  // 4. Eventi (Gol/Cartellini)
  const incidentsUrl = `https://api-dojo.p.rapidapi.com/events/get-incidents?eventId=${eventId}`;
  await fetchAndSave(incidentsUrl, 'dojo_3_eventi.json');

  await sleep(1000);

  // 5. Statistiche Partita
  const statisticsUrl = `https://api-dojo.p.rapidapi.com/events/get-statistics?eventId=${eventId}`;
  await fetchAndSave(statisticsUrl, 'dojo_4_statistiche.json');

  await sleep(1000);

  // 6. Formazioni (Lineups)
  const lineupsUrl = `https://api-dojo.p.rapidapi.com/events/get-lineups?eventId=${eventId}`;
  await fetchAndSave(lineupsUrl, 'dojo_5_formazioni.json');

  console.log(`\n🎉 Processo di esplorazione terminato! Verifica l'output sopra per i file salvati con successo.`);
}

main();
