import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');
  if (!endpoint) return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });

  try {
    const query = new URLSearchParams(Array.from(searchParams.entries()).filter(([k]) => k !== 'endpoint')).toString();
    const url = `https://sofascore.p.rapidapi.com/${endpoint}${query ? `?${query}` : ''}`;
    
    const res = await fetch(url, {
      headers: {
        'x-rapidapi-host': 'sofascore.p.rapidapi.com',
        'x-rapidapi-key': process.env.RAPIDAPI_KEY || '3b9798580fmsh5505297c4cba235p1158b4jsn3683c74d3ef0'
      },
      cache: 'no-store'
    });

    if (endpoint.includes('get-logo')) {
      const blob = await res.blob();
      return new Response(blob, { headers: { 'Content-Type': 'image/png' } });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
