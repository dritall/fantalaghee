import { NextResponse } from 'next/server';
export const runtime = 'edge';
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');
  if (!endpoint) return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
  
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
    
    const data = await res.json().catch(() => ({}));
    
    // Se WAF o RapidAPI bloccano, restituisci lo status reale e il body
    if (!res.ok) {
      return NextResponse.json({ 
        debugError: true, 
        status: res.status, 
        message: data.message || 'RapidAPI Error',
        hasKey: !!process.env.RAPIDAPI_KEY 
      }, { status: 200 }); // Status 200 per forzare il passaggio al client
    }
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
