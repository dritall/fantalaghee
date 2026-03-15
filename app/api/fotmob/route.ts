import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const id = searchParams.get('id');

  if (!type || !id) return NextResponse.json({ error: 'Missing type or id' }, { status: 400 });

  try {
    const fotmobUrl = type === 'league' 
      ? `https://www.fotmob.com/api/leagues?id=${id}`
      : `https://www.fotmob.com/api/matchDetails?matchId=${id}`;

    const res = await fetch(fotmobUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });

    if (!res.ok) throw new Error(`FotMob API responded with ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
