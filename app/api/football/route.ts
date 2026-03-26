// app/api/football/route.ts
import { NextResponse } from 'next/server';

const SEASON_ID = 'serie-a%3A%3AFootball_Season%3A%3A5f0e080fc3a44073984b75b3a8e06a8a';
const BASE = `https://api-sdp.legaseriea.it/v1/serie-a/football/seasons/${SEASON_ID}`;

// ✅ Tutti e 38 i matchDayId estratti dal HAR, in ordine di giornata
const MATCHDAY_IDS: Record<number, string> = {
  1:  'serie-a%3A%3AFootball_MatchDay%3A%3A88d2f767b8d14b2ea2380592208e94dc',
  2:  'serie-a%3A%3AFootball_MatchDay%3A%3Ad78fbb367b6d48c49766b52aad7c9dbf',
  3:  'serie-a%3A%3AFootball_MatchDay%3A%3A9ddc353a21c540eebf0547a7b8a9d64a',
  4:  'serie-a%3A%3AFootball_MatchDay%3A%3Acdaf759b85f445579ae97638e1658911',
  5:  'serie-a%3A%3AFootball_MatchDay%3A%3Aa59442353e2e4da9878ef983a7e72bf0',
  6:  'serie-a%3A%3AFootball_MatchDay%3A%3A4b68c43aeee946768d544b2bc946f791',
  7:  'serie-a%3A%3AFootball_MatchDay%3A%3Ae1f79a3ba75f46938b865ebb18dff64e',
  8:  'serie-a%3A%3AFootball_MatchDay%3A%3A54add330b7774bc18dc4f7aef6af14f8',
  9:  'serie-a%3A%3AFootball_MatchDay%3A%3A5cc9eb75a21d4a4b9130047d37b9b063',
  10: 'serie-a%3A%3AFootball_MatchDay%3A%3A68dd0faafc084276b4fd467ecfdef254',
  11: 'serie-a%3A%3AFootball_MatchDay%3A%3A9d407554653b426ab0c7eb5f7e62a1a1',
  12: 'serie-a%3A%3AFootball_MatchDay%3A%3A975ddee90e63469a8f960ddf2bf5b958',
  13: 'serie-a%3A%3AFootball_MatchDay%3A%3A0eab96e36e7e4f0387420e570e93b0e0',
  14: 'serie-a%3A%3AFootball_MatchDay%3A%3A44a2c07580284268b06fe4660ef30d5c',
  15: 'serie-a%3A%3AFootball_MatchDay%3A%3A5c3bebb509214dcf855c2c401a71f39e',
  16: 'serie-a%3A%3AFootball_MatchDay%3A%3A3c66c6664d7840c2905a6b88672c69db',
  17: 'serie-a%3A%3AFootball_MatchDay%3A%3A329dec16ac8641f99b0653359ac93ed2',
  18: 'serie-a%3A%3AFootball_MatchDay%3A%3Aae87867ae32146108edabe7e52e48892',
  19: 'serie-a%3A%3AFootball_MatchDay%3A%3A82319652c8424a96aad1fbd5fede0387',
  20: 'serie-a%3A%3AFootball_MatchDay%3A%3A455e8502f3f74600910ada6ec756ed5b',
  21: 'serie-a%3A%3AFootball_MatchDay%3A%3A4cbe273f4e734eaba401c81497f3b90e',
  22: 'serie-a%3A%3AFootball_MatchDay%3A%3A92c7bfdecc6947508a82549c7e34e3a8',
  23: 'serie-a%3A%3AFootball_MatchDay%3A%3A952075d1808649e8b1db2698a2741fec',
  24: 'serie-a%3A%3AFootball_MatchDay%3A%3A52459b0209194e698dddd12e9a09dd9c',
  25: 'serie-a%3A%3AFootball_MatchDay%3A%3A5478571c5c57429887055a49822e37ba',
  26: 'serie-a%3A%3AFootball_MatchDay%3A%3A88693dd38bfe4705ae69bcda7a488f8c',
  27: 'serie-a%3A%3AFootball_MatchDay%3A%3Adba0b1f7837c4e8b85f07d97d543b6fd',
  28: 'serie-a%3A%3AFootball_MatchDay%3A%3A158e473b6726423cbf29f55fe11b9fb4',
  29: 'serie-a%3A%3AFootball_MatchDay%3A%3Abc03bc54bcd544bd9b5484803be6142a',
  30: 'serie-a%3A%3AFootball_MatchDay%3A%3Aba40a3d8193142ec9d04e1538299532c',
  31: 'serie-a%3A%3AFootball_MatchDay%3A%3A1190d91acddd4b019a89ef103ee78ccf',
  32: 'serie-a%3A%3AFootball_MatchDay%3A%3Af697ee91109246b3a5731e47c25f9d1e',
  33: 'serie-a%3A%3AFootball_MatchDay%3A%3Ade3fea643f6d40e6b9f80247914b701b',
  34: 'serie-a%3A%3AFootball_MatchDay%3A%3A270c7fb11e9d4661bf656cdda0f9907b',
  35: 'serie-a%3A%3AFootball_MatchDay%3A%3A94c43cdac0af41b9992b6659420121c7',
  36: 'serie-a%3A%3AFootball_MatchDay%3A%3Aa7670060382040eeafcfd656c5fd32b4',
  37: 'serie-a%3A%3AFootball_MatchDay%3A%3A9c6f1f31a7a34da3bea1d38536e0c3e1',
  38: 'serie-a%3A%3AFootball_MatchDay%3A%3Ab1e1578e184c4376bc7197668c64197a',
};

const HEADERS: HeadersInit = {
  "User-Agent": "Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
  "accept": "text/plain; x-api-version=1.0",
  "Referer": "https://www.legaseriea.it/",
  "Origin": "https://www.legaseriea.it",
  "sec-ch-ua": '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Chrome OS"',
};

async function leagaFetch(url: string) {
  const res = await fetch(url, { headers: HEADERS, cache: 'no-store' });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Lega ${res.status} | ${url} | ${body.slice(0, 200)}`);
  }
  return res.json();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');

  try {
    // ✅ CLASSIFICA
    if (endpoint === 'standings') {
      const data = await leagaFetch(`${BASE}/standings/overall?locale=it-IT`);
      // Normalizza: restituisce { teams: [...20 squadre...] }
      const teams = data?.standings?.[0]?.teams || data?.teams || [];
      return NextResponse.json({ ok: true, data: { teams } }, {
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' }
      });
    }

    // ✅ PARTITE - richiede round=1..38
    if (endpoint === 'matches') {
      const round = parseInt(searchParams.get('round') || '1');
      if (round < 1 || round > 38) {
        return NextResponse.json({ error: 'round deve essere tra 1 e 38' }, { status: 400 });
      }
      const matchDayId = MATCHDAY_IDS[round];
      const data = await leagaFetch(`${BASE}/matches?matchDayId=${matchDayId}&locale=it-IT`);
      const matches = data?.matches || data?.data?.matches || (Array.isArray(data) ? data : []);
      return NextResponse.json({ ok: true, data: { matches, round, matchDayId } }, {
        headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=60' }
      });
    }

    // ✅ DETTAGLIO SINGOLA PARTITA (header + lineups + stats)
    if (endpoint === 'match') {
      const matchId = searchParams.get('id');
      if (!matchId) return NextResponse.json({ error: 'id mancante' }, { status: 400 });
      const encodedId = encodeURIComponent(matchId);
      const [header, lineups, stats] = await Promise.allSettled([
        leagaFetch(`${BASE}/matches/${encodedId}/header?locale=it-IT`),
        leagaFetch(`${BASE}/matches/${encodedId}/lineups?locale=it-IT`),
        leagaFetch(`${BASE}/match/${encodedId}/teamstats?locale=it-IT`),
      ]);
      return NextResponse.json({
        ok: true,
        data: {
          header:  header.status  === 'fulfilled' ? header.value  : null,
          lineups: lineups.status === 'fulfilled' ? lineups.value : null,
          stats:   stats.status   === 'fulfilled' ? stats.value   : null,
        }
      }, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' } });
    }

    // ✅ LISTA GIORNATE (solo gli ID, utile per debug)
    if (endpoint === 'matchdays') {
      return NextResponse.json({ ok: true, data: { matchdays: MATCHDAY_IDS } });
    }

    return NextResponse.json({
      error: 'Endpoint non riconosciuto',
      disponibili: ['standings', 'matches?round=1..38', 'match?id=<matchId>', 'matchdays']
    }, { status: 400 });

  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
