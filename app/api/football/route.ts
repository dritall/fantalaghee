import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');
  
  if (!endpoint) return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });

  try {
    const searchParamsString = new URLSearchParams(Array.from(searchParams.entries()).filter(([k]) => k !== 'endpoint')).toString();
    const url = `https://sofascore.p.rapidapi.com/${endpoint}${searchParamsString ? '?' + searchParamsString : ''}`;

    const res = await fetch(url, {
      headers: {
        'x-rapidapi-host': 'sofascore.p.rapidapi.com',
        'x-rapidapi-key': process.env.RAPIDAPI_KEY || ''
      },
      cache: 'no-store'
    });

    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'RapidAPI fetch failed' }, { status: 500 });
  }
}
