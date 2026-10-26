import { NextRequest, NextResponse } from 'next/server';
import { generateWithGemini } from '@/lib/ai/gemini';
import { ExtractedPlaceItem } from '@/types';

// Geocode place in Spanish using Nominatim
async function geocodePlace(name: string, city: string): Promise<{ lat: number | null; lng: number | null; is_located: boolean }> {
  try {
    const query = `${name}, ${city}`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=es,en&q=${encodeURIComponent(query)}`;

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

// Curated top-visited & social media viral spots fallback
function getTopWebRecommendations(city: string, days: number): any[] {
  const norm = city.toLowerCase();

  if (norm.includes('tokio') || norm.includes('tokyo')) {
    return [
      {
        name: 'Cruce de Shibuya y Estatua de Hachiko',
        pros: ['El cruce peatonal más famoso del mundo y viral en redes', 'Totalmente gratis y lleno de vida nocturna'],
        cons: ['Mucha multitud en horas pico', 'Fácil perder de vista al grupo'],
        day_number: 1,
        visit_order: 1,
      },
      {
        name: 'Santuario Meiji Jingu (Harajuku)',
        pros: ['Bosque zen impresionante en el corazón de la ciudad', 'Entrada gratuita y gran valor cultural'],
        cons: ['Hay que caminar bastante por senderos de piedra', 'Cierra temprano al atardecer'],
        day_number: 1,
        visit_order: 2,
      },
      {
        name: 'Templo Senso-ji y Calle Nakamise (Asakusa)',
        pros: ['El templo más antiguo y visitado de Tokio', 'Puestos de comida callejera tradicional japonesa'],
        cons: ['Llegar antes de las 9:30 AM para evitar aglomeraciones', 'Tiendas cierran a las 18:00'],
        day_number: 2,
        visit_order: 1,
      },
      {
        name: 'Tokyo Skytree',
        pros: ['La torre más alta con vistas panorámicas 360°', 'Centro comercial gigantesco en la base'],
        cons: ['Boleto de pago relativamente caro', 'Filas largas si no compras horario anticipado'],
        day_number: 2,
        visit_order: 2,
      },
      {
        name: 'Barrio Eléctrico de Akihabara',
        pros: ['Epicentro mundial del anime, manga y videojuegos', 'Tiendas de electrónica libres de impuestos'],
        cons: ['Muy ruidoso y concurrido', 'Muchas tiendas no aceptan tarjetas extranjeras'],
        day_number: 2,
        visit_order: 3,
      },
      {
        name: 'Parque Shinjuku Gyoen',
        pros: ['Jardín tradicional japonés y casas de té de película', 'Paz absoluta y perfecto para descansar'],
        cons: ['Entrada cuesta 500 yenes', 'Prohibido ingresar con bebidas alcohólicas'],
        day_number: 3,
        visit_order: 1,
      },
      {
        name: 'Callejón Omoide Yokocho (Shinjuku)',
        pros: ['Callejón retro muy fotogénico para Instagram', 'Brochetas yakitori auténticas a buen precio'],
        cons: ['Puestos diminutos para 5 personas', 'Solo aceptan efectivo'],
        day_number: 3,
        visit_order: 2,
      },
    ];
  }

  if (norm.includes('roma') || norm.includes('rome')) {
    return [
      {
        name: 'Coliseo Romano y Foro Romano',
        pros: ['Monumento cumbre de la historia mundial', 'Entrada combinada con el Foro y Palatino'],
        cons: ['Comprar entradas oficiales online con 30 días de antelación', 'Pocas zonas de sombra'],
        day_number: 1,
        visit_order: 1,
      },
      {
        name: 'Fontana di Trevi',
        pros: ['La fuente barroca más famosa del cine y redes sociales', 'Acceso gratuito y mágica iluminada de noche'],
        cons: ['Completamente llena de turistas todo el día', 'Ir al amanecer para fotos sin gente'],
        day_number: 1,
        visit_order: 2,
      },
      {
        name: 'Panteón de Agripa',
        pros: ['Cúpula de hormigón no armado más grande del mundo', 'Plaza della Rotonda con excelente ambiente'],
        cons: ['Entrada requiere pagar 5 euros y reservar hora los fines de semana', 'Filas al mediodía'],
        day_number: 1,
        visit_order: 3,
      },
      {
        name: 'Museos Vaticanos y Capilla Sixtina',
        pros: ['La obra maestra de Miguel Ángel y arte renacentista invaluable', 'Basílica de San Pedro al salir'],
        cons: ['Imprescindible reservar con semanas de antelación', 'Se caminan más de 7 kilómetros adentro'],
        day_number: 2,
        visit_order: 1,
      },
      {
        name: 'Castillo de Sant’Angelo',
        pros: ['Vistas panorámicas espectaculares del río Tíber y el Vaticano', 'Puente de los Ángeles muy fotogénico'],
        cons: ['Cuesta 13 euros la entrada general', 'Subida empinada por rampas'],
        day_number: 2,
        visit_order: 2,
      },
      {
        name: 'Barrio de Trastevere',
        pros: ['Calles empedradas de postal y las mejores trattorias de pasta', 'El ambiente nocturno más vibrante'],
        cons: ['Restaurantes famosos requieren reserva o fila de 40 min', 'Calles empedradas incómodas con tacones'],
        day_number: 2,
        visit_order: 3,
      },
      {
        name: 'Plaza de España y Escalinata Trinità dei Monti',
        pros: ['Punto de encuentro clásico y calles de tiendas exclusivas', 'Hermosa vista desde la cima de las escaleras'],
        cons: ['Prohibido sentarse en los escalones (multan)', 'Precios muy altos en restaurantes cercanos'],
        day_number: 3,
        visit_order: 1,
      },
      {
        name: 'Piazza Navona',
        pros: ['Tres fuentes monumentales de Bernini', 'Pintores al aire libre y arquitectura barroca'],
        cons: ['Trampas para turistas en terrazas frente a la plaza', 'Precios inflados en cafés'],
        day_number: 3,
        visit_order: 2,
      },
    ];
  }

  // Generic global fallback
  return [
    {
      name: `Centro Histórico y Plaza Principal de ${city}`,
      pros: ['Punto de partida obligado y arquitectura patrimonial', 'Caminable, seguro y gratuito'],
      cons: ['Precios más altos en cafés situados directamente en la plaza'],
      day_number: 1,
      visit_order: 1,
    },
    {
      name: `Mercado Gastronómico Tradicional de ${city}`,
      pros: ['Recomendado en redes sociales por su comida local auténtica', 'Precios accesibles y productos frescos'],
      cons: ['Horas pico entre 13:00 y 15:00 con mesas llenas'],
      day_number: 1,
      visit_order: 2,
    },
    {
      name: `Mirador Panorámico de ${city}`,
      pros: ['El punto más viral de fotos para el atardecer', 'Vista completa de la ciudad'],
      cons: ['Subida con escaleras o transporte necesario'],
      day_number: 2,
      visit_order: 1,
    },
    {
      name: `Parque Central o Jardines de ${city}`,
      pros: ['Ideal para descansar después de las caminatas', 'Entrada gratuita y áreas verdes'],
      cons: ['Puede ser muy extenso para recorrer a pie'],
      day_number: 2,
      visit_order: 2,
    },
    {
      name: `Museo Principal de Arte o Historia de ${city}`,
      pros: ['Colección cultural imprescindible de la región', 'Instalaciones climatizadas'],
      cons: ['Cerrado habitualmente los lunes', 'Revisar días con entrada libre'],
      day_number: 3,
      visit_order: 1,
    },
  ];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { destinationCity, destinationCountry, totalDays = 3 } = body;

    if (!destinationCity) {
      return NextResponse.json({ error: 'Debes indicar una ciudad para buscar recomendaciones.' }, { status: 400 });
    }

    const city = destinationCity.trim();
    const country = destinationCountry ? destinationCountry.trim() : '';
    const days = Math.max(1, Math.min(Number(totalDays) || 3, 10));
    const apiKey = process.env.GEMINI_API_KEY;

    let discoveredPlaces: any[] = [];

    if (apiKey && !apiKey.includes('your-gemini')) {
      const prompt = `Actúa como un analista de tendencias de viajes y guía turístico en internet. 
Investiga en la web, redes sociales (TikTok, Instagram, Reddit) y blogs de viajes reales cuáles son las 8 a 12 atracciones turísticas y lugares MÁS VISITADOS, POPULARES, FAMOSOS E IMPERDIBLES de "${city}"${country ? `, ${country}` : ''}.

REGLAS OBLIGATORIAS:
1. SOLO LUGARES REALES Y FAMOSOS que todo viajero de verdad visita (monumentos icónicos, plazas históricas, templos, miradores virales, barrios emblemáticos, mercados populares).
2. Nombres en español o en alfabeto latino internacional comprensible.
3. Organiza los lugares en los ${days} días del viaje ("day_number" de 1 a ${days}) agrupando las paradas cercanas en el mismo día para evitar traslados largos.
4. Para cada lugar incluye:
   - "name": Nombre oficial claro del lugar.
   - "pros": Arreglo con 2 o 3 razones reales por las que es tan visitado o viral.
   - "cons": Arreglo con 1 o 2 advertencias o consejos útiles de viajeros reales (filas, boletos anticipados, horas pico, dinero en efectivo).
   - "day_number": Día asignado (1 a ${days}).
   - "visit_order": Orden de visita en el día (1, 2, 3...).

Responde ÚNICAMENTE con un arreglo JSON válido:
[
  {
    "name": "Nombre oficial",
    "pros": ["Pro 1", "Pro 2"],
    "cons": ["Advertencia 1"],
    "day_number": 1,
    "visit_order": 1
  }
]`;

      try {
        const rawResponse = await generateWithGemini(apiKey, prompt, true);
        const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        discoveredPlaces = JSON.parse(cleanJson);
      } catch (geminiError: any) {
        console.warn('Live web search grounding failed, using curated data:', geminiError?.message);
        discoveredPlaces = getTopWebRecommendations(city, days);
      }
    } else {
      discoveredPlaces = getTopWebRecommendations(city, days);
    }

    if (!Array.isArray(discoveredPlaces) || discoveredPlaces.length === 0) {
      discoveredPlaces = getTopWebRecommendations(city, days);
    }

    // Geocode places with OpenStreetMap in Spanish
    const geocodedPlaces = await Promise.all(
      discoveredPlaces.map(async (place: any) => {
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
    console.error('Error discovering places from web/social media:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al buscar recomendaciones de la web.' },
      { status: 500 }
    );
  }
}
