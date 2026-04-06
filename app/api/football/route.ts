import { NextResponse } from 'next/server';

const HEADERS: HeadersInit = {
  'User-Agent': 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
  'accept': 'text/plain; x-api-version=1.0',
  'Referer': 'https://www.legaseriea.it/',
  'Origin': 'https://www.legaseriea.it',
};

async function legaFetch(url: string) {
  const res = await fetch(url, {
    headers: HEADERS,
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Lega ${res.status} | ${url} | ${body.slice(0, 200)}`);
  }

  return res.json();
}

function extractRoundNumber(value?: string | null): number | null {
  if (!value) return null;
  const s = String(value);

  let m = s.match(/matchday\s*(\d{1,2})/i);
  if (m) return Number(m[1]);

  m = s.match(/giornata\s*(\d{1,2})/i);
  if (m) return Number(m[1]);

  m = s.match(/matchday(\d{1,2})/i);
  if (m) return Number(m[1]);

  return null;
}

async function getMatchdayMap() {
  const SEASON_ID = 'serie-a%3A%3AFootball_Season%3A%3A5f0e080fc3a44073984b75b3a8e06a8a';
  const BASE = `https://api-sdp.legaseriea.it/v1/serie-a/football/seasons/${SEASON_ID}`;

  const candidates = [
    `${BASE}/matches?locale=it-IT`,
    `${BASE}/calendar?locale=it-IT`,
    `${BASE}?locale=it-IT`,
  ];

  for (const url of candidates) {
    try {
      const data = await legaFetch(url);

      const buckets = [
        data?.matchSets,
        data?.calendar?.matchSets,
        data?.competition?.matchSets,
        data?.matches,
      ].filter(Boolean);

      const roundMap: Record<number, string> = {};

      for (const bucket of buckets) {
        for (const item of bucket || []) {
          // Prova a estrarre dal set o dal singolo match
          const itemRound =
            extractRoundNumber(item?.name) ??
            extractRoundNumber(item?.shortName) ??
            extractRoundNumber(item?.description) ??
            extractRoundNumber(item?.providerId);

          const itemId =
            item?.matchSetId ||
            item?.id ||
            item?.matchdayId ||
            item?.matchSet?.matchSetId ||
            item?.matchSet?.id;

          if (itemRound && itemId && !roundMap[itemRound]) {
            roundMap[itemRound] = encodeURIComponent(String(itemId)).replace(/%253A/g, '%3A');
          }

          // Prova a estrarre dal matchSet annidato (tipico di endpoint matches)
          const nestedMatchSet = item?.matchSet;
          if (nestedMatchSet) {
            const nestedRound =
              extractRoundNumber(nestedMatchSet?.name) ??
              extractRoundNumber(nestedMatchSet?.shortName) ??
              extractRoundNumber(nestedMatchSet?.providerId);

            const nestedId =
              nestedMatchSet?.matchSetId ||
              nestedMatchSet?.id;

            if (nestedRound && nestedId && !roundMap[nestedRound]) {
              roundMap[nestedRound] = encodeURIComponent(String(nestedId)).replace(/%253A/g, '%3A');
            }
          }
        }
      }

      if (Object.keys(roundMap).length >= 20) {
        return roundMap;
      }
    } catch (e) {
      // Prova il candidato successivo
    }
  }

  throw new Error('Impossibile costruire la mappa giornate della stagione 2025/2026');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');
  const seasonIdParam = searchParams.get('seasonId');
  const SEASON_ID = seasonIdParam || 'serie-a%3A%3AFootball_Season%3A%3A5f0e080fc3a44073984b75b3a8e06a8a';
  const BASE = `https://api-sdp.legaseriea.it/v1/serie-a/football/seasons/${SEASON_ID}`;

  try {
    if (endpoint === 'standings') {
      const data = await legaFetch(`${BASE}/standings/overall?locale=it-IT`);
      const teams = data?.standings?.[0]?.teams || [];
      return NextResponse.json(
        {
          ok: true,
          data: {
            seasonId: SEASON_ID,
            seasonName: data?.competition?.seasonName || '2025/2026',
            teams,
          },
        },
        { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' } }
      );
    }

    if (endpoint === 'matchdays') {
      const data = await legaFetch(`${BASE}/matches?locale=it-IT`);
      const matches = data?.matches || [];
      const matchsetsMap: Record<number, any> = {};

      matches.forEach((m: any) => {
        const ms = m.matchSet;
        if (ms) {
          const round = extractRoundNumber(ms.name) || extractRoundNumber(ms.providerId);
          if (round) {
            if (!matchsetsMap[round]) {
               matchsetsMap[round] = {
                 round,
                 matchdayStatus: ms.matchdayStatus,
                 startDateUtc: ms.startDateUtc,
                 endDateUtc: ms.endDateUtc,
                 matchesHasLive: false,
               };
            }
            if (m.status === 'LIVE' || m.matchStatus === 'LIVE') {
              matchsetsMap[round].matchesHasLive = true;
            }
          }
        }
      });
      
      const out = Object.values(matchsetsMap).map((ms: any) => {
        if (ms.matchesHasLive) ms.matchdayStatus = 'Playing';
        delete ms.matchesHasLive;
        return ms;
      });

      return NextResponse.json({ ok: true, data: out }, { headers: { 'Cache-Control': 'public, s-maxage=3600' } });
    }

    if (endpoint === 'matches') {
      const round = parseInt(searchParams.get('round') || '30', 10);
      if (round < 1 || round > 38) {
        return NextResponse.json({ ok: false, error: 'round 1-38' }, { status: 400 });
      }

      // Recupera la mappa dinamica delle giornate
      const roundMap = await getMatchdayMap();
      const matchDayId = roundMap[round];

      if (!matchDayId) {
        return NextResponse.json(
          { ok: false, error: `giornata ${round} non trovata per la stagione 2025/2026` },
          { status: 404 }
        );
      }

      const data = await legaFetch(`${BASE}/matches?matchDayId=${matchDayId}&locale=it-IT`);
      
      // Ordinamento cronologico
      const matches = [...(data?.matches || [])].sort((a: any, b: any) => {
        const da = new Date(a?.matchDateUtc || a?.matchDateLocal || 0).getTime();
        const db = new Date(b?.matchDateUtc || b?.matchDateLocal || 0).getTime();
        return da - db;
      });

      return NextResponse.json(
        {
          ok: true,
          data: {
            seasonId: SEASON_ID,
            seasonName: data?.competition?.seasonName || '2025/2026',
            round,
            matches,
            debug: {
              requestedRound: round,
              resolvedMatchDayId: matchDayId,
            }
          },
        },
        { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=60' } }
      );
    }

    if (endpoint === 'match') {
      const matchId = searchParams.get('id');
      if (!matchId) {
        return NextResponse.json({ ok: false, error: 'id mancante' }, { status: 400 });
      }

      const enc = encodeURIComponent(matchId);

      const [header, stats, lineups, events1, playerStats] = await Promise.allSettled([
        legaFetch(`${BASE}/matches/${enc}/header?locale=it-IT`),
        legaFetch(`${BASE}/match/${enc}/teamstats?locale=it-IT`),
        legaFetch(`${BASE}/matches/${enc}/lineups?locale=it-IT`),
        legaFetch(`${BASE}/match/${enc}/action?locale=it-IT`).catch(() => legaFetch(`${BASE}/match/${enc}/events?locale=it-IT`)),
        legaFetch(`${BASE}/match/${enc}/playerstats?locale=it-IT`),
      ]);

      return NextResponse.json(
        {
          ok: true,
          data: {
            header: header.status === 'fulfilled' ? header.value : null,
            stats: stats.status === 'fulfilled' ? stats.value : null,
            lineups: lineups.status === 'fulfilled' ? lineups.value : null,
            events: events1.status === 'fulfilled' ? events1.value : null,
            playerStats: playerStats.status === 'fulfilled' ? playerStats.value : null,
          },
        },
        { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' } }
      );
    }


    return NextResponse.json(
      {
        ok: false,
        error: 'Endpoint non valido',
        disponibili: ['standings', 'matches?round=1-38', 'match?id=...'],
      },
      { status: 400 }
    );
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Errore server' }, { status: 500 });
  }
}
