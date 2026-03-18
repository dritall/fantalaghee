import { NextResponse } from 'next/server';
export const runtime = 'edge';
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');
  try {
    const query = new URLSearchParams(Array.from(searchParams.entries()).filter(([k]) => k !== 'endpoint')).toString();
    const url = `https://free-api-live-football-data.p.rapidapi.com/${endpoint}?${query}`;
    const res = await fetch(url, {
      headers: {
        'x-rapidapi-host': 'free-api-live-football-data.p.rapidapi.com',
        'x-rapidapi-key': '3b9798580fmsh5505297c4cba235p1158b4jsn3683c74d3ef0'
      },
      cache: 'no-store'
    });
    const data = await res.json();
    return NextResponse.json({ status: res.status, raw: data });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
