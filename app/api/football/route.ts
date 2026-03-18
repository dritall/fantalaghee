import { NextResponse } from 'next/server';
export const runtime = 'edge';
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');
  if (!endpoint) return NextResponse.json({ error: 'Endpoint missing' }, { status: 400 });
  try {
    const query = new URLSearchParams(Array.from(searchParams.entries()).filter(([k]) => k !== 'endpoint')).toString();
    const url = `https://free-api-live-football-data.p.rapidapi.com/${endpoint}${query ? '?' + query : ''}`;
    const res = await fetch(url, {
      headers: {
        'x-rapidapi-host': 'free-api-live-football-data.p.rapidapi.com',
        'x-rapidapi-key': '3b9798580fmsh5505297c4cba235p1158b4jsn3683c74d3ef0'
      },
      cache: 'no-store'
    });
    return NextResponse.json(await res.json());
  } catch (error) {
    return NextResponse.json({ error: 'Sync Failed' }, { status: 500 });
  }
}
