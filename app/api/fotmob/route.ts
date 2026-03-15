import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('target');
  const mode = searchParams.get('mode');

  if (!target || !mode) return NextResponse.json({ error: 'Bad Request' }, { status: 400 });

  try {
    const fotmobUrl = mode === 'l' 
      ? `https://www.fotmob.com/api/leagues?id=${target}`
      : `https://www.fotmob.com/api/matchDetails?matchId=${target}`;

    const res = await fetch(fotmobUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://www.fotmob.com/',
        'Origin': 'https://www.fotmob.com'
      },
      cache: 'no-store'
    });

    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Data fetch failed' }, { status: 500 });
  }
}
