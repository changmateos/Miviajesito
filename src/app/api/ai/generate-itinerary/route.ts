import { NextRequest, NextResponse } from 'next/server';
import { generateWithGemini } from '@/lib/ai/gemini';
import { ExtractedPlaceItem } from '@/types';

// Nominatim OpenStreetMap Geocoder with polite delay
async function geocodePlace(name: string, city: string): Promise<{ lat: number | null; lng: number | null; is_located: boolean }> {
  try {
    const query = `${name}, ${city}`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MiViajecitoApp/1.0 (https://github.com/changmateos/Miviajesito; contact@miviajecito.local)',
        'Accept-Language': 'es,en',
      },
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      return { lat: null, lng: null, is_located: false };
    }

    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        is_located: true,
      };
    }
  } catch (err) {
    console.warn(`Geocoding failed for ${name}:`, err);
  }
  return { lat: null, lng: null, is_located: false };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { destinationCity, destinationCountry, totalDays = 3, hotelName } = body;

    if (!destinationCity) {
      return NextResponse.json({ error: 'Debes indicar una ciudad de destino.' }, { status: 400 });
    }

    const city = destinationCity.trim();
    const country = destinationCountry?.trim() || '';
    const days = Math.max(1, Math.min(Number(totalDays) || 3, 14)); // 1 to 14 days
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.includes('your-gemini')) {
      return NextResponse.json(
        {
          error:
            'Configura tu GEMINI_API_KEY en las variables de entorno de Vercel para generar itinerarios con IA.',
        },
        { status: 401 }
      );
    }

    const prompt = `Actúa como un guía turístico local experto y planificador de rutas. Para un viaje de ${days} días a "${city}"${country ? `, ${country}` : ''}${hotelName ? ` alojándose en "${hotelName}"` : ''}, genera un itinerario propuesto completo con los mejores lugares indispensables para visitar.

Reglas del itinerario:
1. Propón entre 3 y 4 lugares por cada día del viaje (total ${days * 3} a ${days * 4} lugares).
2. Agrupa los lugares geográficamente por cercanía para cada día ("day_number" del 1 al ${days}) para que los viajeros no crucen la ciudad de un lado a otro.
3. Para cada lugar, proporciona:
   - "name": Nombre oficial y reconocible del lugar.
   - "pros": Arreglo con 2 o 3 razones clave para visitarlo.
   - "cons": Arreglo con 1 o 2 advertencias o consejos útiles (filas, horarios, reservas).
   - "day_number": Número entero del día asignado (entre 1 y ${days}).
   - "visit_order": Orden lógico de visita en ese día (1, 2, 3...).

Responde ÚNICAMENTE con un arreglo JSON válido sin bloques markdown adicionales:
[
  {
    "name": "Nombre oficial del lugar",
    "pros": ["Razón 1", "Razón 2"],
    "cons": ["Advertencia 1"],
    "day_number": 1,
    "visit_order": 1
  }
]`;

    const rawResponse = await generateWithGemini(apiKey, prompt);
    const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const rawPlaces = JSON.parse(cleanJson);

    // Geocode each proposed place on OpenStreetMap
    const geocodedPlaces = await Promise.all(
      rawPlaces.map(async (place: any) => {
        const geo = await geocodePlace(place.name, city);
        return {
          name: place.name,
          pros: Array.isArray(place.pros) ? place.pros : [],
          cons: Array.isArray(place.cons) ? place.cons : [],
          day_number: place.day_number || 1,
          visit_order: place.visit_order || 1,
          lat: geo.lat,
          lng: geo.lng,
          is_located: geo.is_located,
        };
      })
    );

    return NextResponse.json({
      success: true,
      places: geocodedPlaces,
    });
  } catch (error: any) {
    console.error('Error generating AI itinerary:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al generar el itinerario propuesto con IA.' },
      { status: 500 }
    );
  }
}
