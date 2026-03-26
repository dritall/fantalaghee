// app/api/football/route.ts
import { NextResponse } from 'next/server';

// ❌ RIMOSSO: export const runtime = 'edge';
// Usiamo Node.js runtime standard per fetch affidabili verso API esterne

const SEASON_ID = 'serie-a%3A%3AFootballSeason%3A%3A5f0e080fc3a44073984b75b3a8e06a8a';
const BASE = `https://api-sdp.legaseriea.it/v1/serie-a/football/seasons/${SEASON_ID}`;

const HEADERS: HeadersInit = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "accept": "text/plain; x-api-version=1.0",
  "Referer": "https://www.legaseriea.it/",
  "Origin": "https://www.legaseriea.it",
  "sec-ch-ua": '"Not/A)Brand";v="99", "Google Chrome";v="120", "Chromium";v="120"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');

  let url = "";
  let revalidate = 300;

  if (endpoint === 'standings' || endpoint === 'football-get-standing-all') {
    url = `${BASE}/standings/overall?locale=it-IT`;
  } else if (endpoint === 'matches') {
    url = `${BASE}/matches?locale=it-IT`;
    revalidate = 60;
  } else if (endpoint === 'stats') {
    url = `${BASE}/stats/teams?category=General&locale=it-IT`;
  } else {
    return NextResponse.json({ error: "Endpoint non riconosciuto", endpoint }, { status: 400 });
  }

  try {
    console.log(`[football API] Fetching: ${url}`);
    
    const res = await fetch(url, {
      headers: HEADERS,
      cache: 'no-store', // evita cache Edge durante debug
    });

    console.log(`[football API] Status: ${res.status} for ${endpoint}`);

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[football API] Error body: ${body.slice(0, 300)}`);
      return NextResponse.json({ 
        error: `Lega API error: ${res.status}`, 
        url,
        body: body.slice(0, 300)
      }, { status: res.status });
    }

    const data = await res.json();

    return NextResponse.json(data, {
      headers: { 
        'Cache-Control': `public, s-maxage=${revalidate}, stale-while-revalidate=60` 
      }
    });

  } catch (e: any) {
    console.error(`[football API] Exception:`, e);
    return NextResponse.json({ 
      error: e.message, 
      url,
      stack: e.stack?.slice(0, 500)
    }, { status: 500 });
  }
}
