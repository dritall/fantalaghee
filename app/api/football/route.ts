import { NextResponse } from 'next/server';

export const runtime = 'edge';

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "application/json",
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
        url = "https://api-sdp.legaseriea.it/v1/serie-a/football/seasons/serie-a%3A%3AFootball_Season%3A%3A5f0e080fc3a44073984b75b3a8e06a8a/standings/overall?locale=it-IT";
    } 
    else if (endpoint === 'matches') {
        url = "https://api-sdp.legaseriea.it/v1/serie-a/football/seasons/serie-a%3A%3AFootball_Season%3A%3A5f0e080fc3a44073984b75b3a8e06a8a/matches?locale=it-IT";
    }
    else if (endpoint === 'stats') {
        url = "https://api-sdp.legaseriea.it/v1/serie-a/football/seasons/serie-a%3A%3AFootball_Season%3A%3A5f0e080fc3a44073984b75b3a8e06a8a/stats/teams?category=General&locale=it-IT";
    }
    else {
        return NextResponse.json({ error: "Endpoint non riconosciuto" }, { status: 400 });
    }

    const res = await fetch(url, {
      headers: HEADERS,
      next: { revalidate }
    });

    if (!res.ok) throw new Error(`Errore Server Lega: ${res.status}`);

    const data = await res.json();
    
    const responseHeaders: any = {
        'Cache-Control': `public, s-maxage=${revalidate}, stale-while-revalidate=60`
    };
    
    return NextResponse.json(data, { headers: responseHeaders });

  } catch (e) {
    console.error("Errore fetch API Ufficiale Lega:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
