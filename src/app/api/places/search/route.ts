import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const city = searchParams.get('city') || '';

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    const searchQuery = city ? `${query.trim()}, ${city.trim()}` : query.trim();
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=6&accept-language=es,en&q=${encodeURIComponent(searchQuery)}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MiViajecitoApp/1.0 (https://github.com/changmateos/Miviajesito; contact@miviajecito.local)',
        'Accept-Language': 'es,en',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ results: [] });
    }

    const data = await response.json();
    const results = (data || []).map((item: any) => ({
      name: item.name || item.display_name.split(',')[0],
      display_name: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Place search error:', error);
    return NextResponse.json({ results: [] });
  }
}
