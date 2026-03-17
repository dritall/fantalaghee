import { NextResponse } from 'next/server';

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
        // La chiave per bucare Cloudflare: simulare l'app iOS ufficiale
        'User-Agent': 'FotMob/175.0.0 (iPhone; iOS 17.0.3; Scale/3.00)',
        'X-Fotmob-Platform': 'iOS',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      cache: 'no-store'
    });

    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
  }
}
