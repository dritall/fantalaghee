// app/api/football/route.ts
import { NextResponse } from 'next/server';

// ✅ Season ID CORRETTA dal HAR (con underscore!)
const SEASON_ID = 'serie-a%3A%3AFootball_Season%3A%3A5f0e080fc3a44073984b75b3a8e06a8a';
const COMPETITION_ID = 'serie-a%3A%3AFootball_Competition%3A%3Aec93b94f74294dc98ab5bcfd67fc0d88';
const BASE = `https://api-sdp.legaseriea.it/v1/serie-a/football/seasons/${SEASON_ID}`;

const HEADERS: HeadersInit = {
  "User-Agent": "Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
  "accept": "text/plain; x-api-version=1.0",
  "Referer": "https://www.legaseriea.it/",
  "Origin": "https://www.legaseriea.it",
  "sec-ch-ua": '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Chrome OS"',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');

  try {
    // ✅ CLASSIFICA - funziona confermato dal HAR
    if (endpoint === 'standings') {
      const res = await fetch(`${BASE}/standings/overall?locale=it-IT`, {
        headers: HEADERS, cache: 'no-store'
      });
      if (!res.ok) return NextResponse.json({ error: `Lega ${res.status}`, url: res.url }, { status: res.status });
      const data = await res.json();
      return NextResponse.json(data, {
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' }
      });
    }

    // ✅ PARTITE PER GIORNATA - richiede matchDayId
    // es: /api/football?endpoint=matchday&id=serie-a%3A%3AFootballMatchDay%3A%3Ab1e1578e...
    if (endpoint === 'matchday') {
      const matchDayId = searchParams.get('id');
      if (!matchDayId) return NextResponse.json({ error: 'id mancante' }, { status: 400 });
      const url = `${BASE}/match-days/${matchDayId}/matches?locale=it-IT`;
      const res = await fetch(url, { headers: HEADERS, cache: 'no-store' });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        return NextResponse.json({ error: `Lega ${res.status}`, url, body: body.slice(0, 300) }, { status: res.status });
      }
      const data = await res.json();
      return NextResponse.json(data, {
        headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=60' }
      });
    }

    // ✅ TUTTE LE GIORNATE (lista matchDay dalla standings o seasons)
    if (endpoint === 'matches') {
      // Strategia: prendiamo le giornate dall'endpoint match-days della stagione
      const url = `${BASE}/match-days?locale=it-IT`;
      const res = await fetch(url, { headers: HEADERS, cache: 'no-store' });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        return NextResponse.json({ error: `Lega ${res.status}`, url, body: body.slice(0,300) }, { status: res.status });
      }
      const data = await res.json();
      return NextResponse.json(data, {
        headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' }
      });
    }

    // ✅ STATS SQUADRE - funziona confermato dal HAR
    if (endpoint === 'stats') {
      const res = await fetch(`${BASE}/stats/teams?category=General&locale=it-IT`, {
        headers: HEADERS, cache: 'no-store'
      });
      if (!res.ok) return NextResponse.json({ error: `Lega ${res.status}` }, { status: res.status });
      const data = await res.json();
      return NextResponse.json(data, {
        headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' }
      });
    }

    // ✅ DETTAGLIO SINGOLA PARTITA
    if (endpoint === 'match') {
      const matchId = searchParams.get('id');
      if (!matchId) return NextResponse.json({ error: 'id mancante' }, { status: 400 });
      const res = await fetch(`${BASE}/matches/${matchId}/header?locale=it-IT`, {
        headers: HEADERS, cache: 'no-store'
      });
      if (!res.ok) return NextResponse.json({ error: `Lega ${res.status}` }, { status: res.status });
      const data = await res.json();
      return NextResponse.json(data, {
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' }
      });
    }

    return NextResponse.json({ error: "Endpoint non riconosciuto", disponibili: ['standings','matches','matchday','stats','match'] }, { status: 400 });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
