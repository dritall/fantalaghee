import { NextResponse } from 'next/server';
import { getSeason } from '@/lib/seasons';
import { normalizeMatch } from '@/lib/lega-normalize';

const HEADERS: HeadersInit = {
  'User-Agent': 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
  'accept': 'text/plain; x-api-version=1.0',
  'Referer': 'https://www.legaseriea.it/',
  'Origin': 'https://www.legaseriea.it',
};

// Cache la risposta di Lega Serie A per qualche minuto: evita di rifare la stessa
// chiamata pesante (tutte le partite della stagione) ad ogni round selezionato
// dall'utente, velocizzando la pagina e riducendo il rischio di errori/timeout
// lato Lega Serie A. Tempi più lunghi per non farsi bannare.
const SEASON_FETCH_REVALIDATE = 300; // 5 minuti per season data
const MATCH_REVALIDATE = 120;        // 2 minuti per match header/lineups
const STATS_REVALIDATE = 600;        // 10 minuti per team/player stats (non cambiano post-partita)

async function legaFetch(url: string, revalidate: number = SEASON_FETCH_REVALIDATE) {
  const res = await fetch(url, {
    headers: HEADERS,
    next: { revalidate },
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

function getRoundFromMatch(m: any): number | null {
  const ms = m?.matchSet;
  return (
    extractRoundNumber(ms?.name) ??
    extractRoundNumber(ms?.shortName) ??
    extractRoundNumber(ms?.providerId) ??
    extractRoundNumber(m?.description) ??
    null
  );
}

/**
 * Unica fonte di verità: una sola chiamata (cachata) che restituisce TUTTE le
 * partite della stagione. Da qui deriviamo sia l'elenco delle giornate
 * (endpoint "matchdays") sia le partite di un singolo round (endpoint
 * "matches"), evitando le chiamate ripetute e la fragile risoluzione del
 * matchDayId tramite più endpoint "candidati" usata in precedenza.
 */
async function getSeasonMatches(BASE: string): Promise<any[]> {
  const data = await legaFetch(`${BASE}/matches?locale=it-IT`);
  return data?.matches || [];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');
  const seasonIdParam = searchParams.get('seasonId');
  const stagioneParam = searchParams.get('stagione');
  const seasonConfig = stagioneParam ? getSeason(stagioneParam) : null;
  const seasonFromConfig = seasonConfig?.serieASeasonId;
  const seasonUnavailable = !!stagioneParam && !!seasonConfig && !seasonFromConfig && !seasonIdParam;
  const SEASON_ID = seasonIdParam || seasonFromConfig || 'serie-a%3A%3AFootball_Season%3A%3A5f0e080fc3a44073984b75b3a8e06a8a';
  const BASE = `https://api-sdp.legaseriea.it/v1/serie-a/football/seasons/${SEASON_ID}`;

  try {
    if (endpoint === 'seasons') {
      // Diagnostico: lista le stagioni disponibili per trovare il Football_Season id della 2026/27
      const data = await legaFetch('https://api-sdp.legaseriea.it/v1/serie-a/football/seasons?locale=it-IT');
      return NextResponse.json({ ok: true, data });
    }

    if (seasonUnavailable) {
      return NextResponse.json({ ok: false, error: 'Calendario non ancora pubblicato da Lega Serie A per questa stagione', seasonUnavailable: true });
    }

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
      const matches = await getSeasonMatches(BASE);
      const matchsetsMap: Record<number, any> = {};

      matches.forEach((m: any) => {
        const ms = m.matchSet;
        const round = getRoundFromMatch(m);
        if (ms && round) {
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
      });

      const out = Object.values(matchsetsMap).map((ms: any) => {
        if (ms.matchesHasLive) ms.matchdayStatus = 'Playing';
        delete ms.matchesHasLive;
        return ms;
      });

      if (out.length === 0) {
        return NextResponse.json(
          { ok: false, error: 'Nessuna giornata disponibile da Lega Serie A per questa stagione' },
          { status: 502 }
        );
      }

      return NextResponse.json({ ok: true, data: out }, { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=60' } });
    }

    if (endpoint === 'matches') {
      const round = parseInt(searchParams.get('round') || '1', 10);
      if (round < 1 || round > 38) {
        return NextResponse.json({ ok: false, error: 'round 1-38' }, { status: 400 });
      }

      const allMatches = await getSeasonMatches(BASE);
      const matches = allMatches
        .filter((m: any) => getRoundFromMatch(m) === round)
        .sort((a: any, b: any) => {
          const da = new Date(a?.matchDateUtc || a?.matchDateLocal || 0).getTime();
          const db = new Date(b?.matchDateUtc || b?.matchDateLocal || 0).getTime();
          return da - db;
        });

      if (matches.length === 0) {
        return NextResponse.json(
          { ok: false, error: `giornata ${round} non trovata per la stagione richiesta` },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          ok: true,
          data: {
            seasonId: SEASON_ID,
            round,
            matches,
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
        legaFetch(`${BASE}/matches/${enc}/header?locale=it-IT`, MATCH_REVALIDATE),
        legaFetch(`${BASE}/match/${enc}/teamstats?locale=it-IT`, STATS_REVALIDATE),
        legaFetch(`${BASE}/matches/${enc}/lineups?locale=it-IT`, MATCH_REVALIDATE),
        legaFetch(`${BASE}/match/${enc}/action?locale=it-IT`, MATCH_REVALIDATE).catch(() => legaFetch(`${BASE}/match/${enc}/events?locale=it-IT`, MATCH_REVALIDATE)),
        legaFetch(`${BASE}/match/${enc}/playerstats?locale=it-IT`, STATS_REVALIDATE),
      ]);

      const payload = {
        header: header.status === 'fulfilled' ? header.value : null,
        stats: stats.status === 'fulfilled' ? stats.value : null,
        lineups: lineups.status === 'fulfilled' ? lineups.value : null,
        events: events1.status === 'fulfilled' ? events1.value : null,
        playerStats: playerStats.status === 'fulfilled' ? playerStats.value : null,
      };

      // I blocchi grezzi restano (retrocompatibilità e diagnostica), ma il sito
      // consuma `normalized`: formazioni, foto, eventi e statistiche già uniti
      // in una forma stabile. Se la normalizzazione fallisce la pagina continua
      // a funzionare con i dati grezzi.
      let normalized = null;
      try {
        normalized = normalizeMatch(payload);
      } catch (err: any) {
        normalized = null;
      }

      return NextResponse.json(
        { ok: true, data: { ...payload, normalized } },
        { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' } }
      );
    }

    if (endpoint === 'player') {
      const playerId = searchParams.get('id');
      if (!playerId) {
        return NextResponse.json({ ok: false, error: 'id mancante' }, { status: 400 });
      }

      const enc = encodeURIComponent(playerId);

      // Non tutte le stagioni espongono la scheda giocatore: proviamo gli
      // endpoint noti e restituiamo il primo che risponde. Il chiamante ha
      // comunque le statistiche della singola partita come base garantita,
      // quindi un fallimento qui degrada senza rompere nulla.
      const attempts = await Promise.allSettled([
        legaFetch(`${BASE}/players/${enc}?locale=it-IT`, 3600),
        legaFetch(`${BASE}/player/${enc}/stats?locale=it-IT`, 600),
      ]);

      const profile = attempts[0].status === 'fulfilled' ? attempts[0].value : null;
      const seasonStats = attempts[1].status === 'fulfilled' ? attempts[1].value : null;

      if (!profile && !seasonStats) {
        return NextResponse.json(
          { ok: false, error: 'Scheda giocatore non disponibile per questa stagione', unavailable: true },
          { headers: { 'Cache-Control': 'public, s-maxage=600' } }
        );
      }

      return NextResponse.json(
        { ok: true, data: { profile, seasonStats } },
        { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300' } }
      );
    }


    return NextResponse.json(
      {
        ok: false,
        error: 'Endpoint non valido',
        disponibili: ['seasons', 'standings', 'matchdays', 'matches?round=1-38', 'match?id=...', 'player?id=...'],
      },
      { status: 400 }
    );
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Errore server' }, { status: 500 });
  }
}
