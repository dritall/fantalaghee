import { NextResponse } from 'next/server';

export const runtime = 'edge'; // Cruciale per bypassare i blocchi WAF/Cloudflare

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode');
  const target = searchParams.get('target');

  if (!mode || !target) return NextResponse.json({ error: 'Bad Request' }, { status: 400 });

  try {
    const url = mode === 'l' 
      ? `https://www.fotmob.com/api/leagues?id=${target}`
      : `https://www.fotmob.com/api/matchDetails?matchId=${target}`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });

    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Data fetch failed' }, { status: 500 });
  }
}

