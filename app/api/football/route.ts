import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');
  
  if (!endpoint) return NextResponse.json({ error: 'Missing endpoint configuration' }, { status: 400 });

  try {
    const query = new URLSearchParams(Array.from(searchParams.entries()).filter(([k]) => k !== 'endpoint')).toString();
    const url = `https://sofascore.p.rapidapi.com/${endpoint}${query ? '?' + query : ''}`;

    const res = await fetch(url, {
      headers: {
        'x-rapidapi-host': 'sofascore.p.rapidapi.com',
        'x-rapidapi-key': process.env.RAPIDAPI_KEY || ''
      },
      cache: 'no-store'
    });

    if (!res.ok) throw new Error(`Provider response status: ${res.status}`);
    return NextResponse.json(await res.json());
  } catch (error) {
    return NextResponse.json({ error: 'Data synchronization failed' }, { status: 500 });
  }
}
