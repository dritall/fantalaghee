import { NextResponse } from 'next/server';

export const runtime = 'edge';

const SEASON_ID = 'serie-a%3A%3AFootballSeason%3A%3A5f0e080fc3a44073984b75b3a8e06a8a';
const BASE = `https://api-sdp.legaseriea.it/v1/serie-a/football/seasons/${SEASON_ID}`;

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "accept": "text/plain; x-api-version=1.0",
  "Referer": "https://www.legaseriea.it/",
  "Origin": "https://www.legaseriea.it"
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');

  try {
    let url = "";
    let revalidate = 300;

    if (endpoint === 'standings' || endpoint === 'football-get-standing-all') {
      url = `${BASE}/standings/overall?locale=it-IT`;
    } 
    else if (endpoint === 'matches') {
      url = `${BASE}/matches?locale=it-IT`;
      revalidate = 60;
    }
    else if (endpoint === 'stats') {
      url = `${BASE}/stats/teams?category=General&locale=it-IT`;
    }
    else {
      return NextResponse.json({ error: "Endpoint non riconosciuto" }, { status: 400 });
    }

    const res = await fetch(url, { headers: HEADERS, next: { revalidate } });

    if (!res.ok) throw new Error(`Errore Server Lega: ${res.status} — URL: ${url}`);

    const data = await res.json();

    return NextResponse.json(data, {
      headers: { 'Cache-Control': `public, s-maxage=${revalidate}, stale-while-revalidate=60` }
    });

  } catch (e) {
    console.error("Errore fetch API Ufficiale Lega:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
