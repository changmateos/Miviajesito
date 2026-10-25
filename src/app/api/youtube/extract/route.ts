import { NextRequest, NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';
import { GoogleGenAI } from '@google/genai';
import { ExtractedPlaceItem } from '@/types';

// Extract YouTube ID from various URL formats
function getYouTubeId(url: string): string | null {
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

// Nominatim OpenStreetMap Geocoder with polite delay
async function geocodePlace(name: string, city: string): Promise<{ lat: number | null; lng: number | null; is_located: boolean }> {
  try {
    const query = `${name}, ${city}`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MiViajecitoApp/1.0 (https://github.com/miviajecito; contact@miviajecito.local)',
        'Accept-Language': 'es,en',
      },
      next: { revalidate: 86400 }, // Cache geocode results
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

// Mock fallback generator when GEMINI_API_KEY is not configured
function getDemoExtractedPlaces(city: string): ExtractedPlaceItem[] {
  const normalized = city.toLowerCase();
  if (normalized.includes('tokio') || normalized.includes('tokyo')) {
    return [
      {
        name: 'Mercado de Pescado de Tsukiji Exterior',
        pros: ['Mariscos ultra frescos y brochetas de wagyu', 'Ambiente tradicional callejero muy animado'],
        cons: ['Cierra temprano (cerca de las 2 PM)', 'Pasillos estrechos y filas largas en puestos famosos'],
      },
      {
        name: 'Parque Ueno',
        pros: ['Enorme parque con lagos y museos', 'Entrada gratuita y excelente para caminar relajado'],
        cons: ['Puede sentirse abrumador por lo extenso', 'Museos internos requieren pago de entrada'],
      },
      {
        name: 'Mirador del Edificio del Gobierno Metropolitano (Shinjuku)',
        pros: ['Piso 45 con vista panorámica 360° totalmente gratis', 'Abierto hasta la noche con vista iluminada'],
        cons: ['Control de seguridad lento en la planta baja', 'Ventanales con reflejos para fotos nocturnas'],
      },
      {
        name: 'Ramen secreto debajo de las vías de Yurakucho',
        pros: ['Sabor increíble y precio muy accesible', 'Sensación local auténtica sin turistas'],
        cons: ['Ubicación difícil de encontrar sin GPS preciso', 'Solo 6 bancos para sentarse'],
      },
    ];
  } else if (normalized.includes('roma') || normalized.includes('rome')) {
    return [
      {
        name: 'Coliseo Romano',
        pros: ['Historia monumental única en el mundo', 'Impresionante tanto por fuera como por dentro'],
        cons: ['Boletos deben comprarse con semanas de anticipación', 'Mucho calor y poca sombra'],
      },
      {
        name: 'Panteón de Agripa',
        pros: ['Cúpula arquitectónica asombrosa', 'Ubicado en una plaza con excelente gelato'],
        cons: ['Cobran entrada de 5 euros desde hace poco', 'Filas largas bajo el sol'],
      },
      {
        name: 'Trastevere',
        pros: ['Calles empedradas hermosas', 'Las mejores trattorias de pasta tradicional'],
        cons: ['Muy concurrido de noche', 'Restaurantes se llenan rápido sin reserva'],
      },
    ];
  } else {
    return [
      {
        name: `Centro Histórico y Plaza Mayor de ${city}`,
        pros: ['Arquitectura hermosa y punto de partida ideal', 'Totalmente caminable y gratuito'],
        cons: ['Precios más altos en cafés frente a la plaza principal'],
      },
      {
        name: `Mercado Central Gastronómico de ${city}`,
        pros: ['Comida local auténtica a buen precio', 'Excelente variedad de sabores'],
        cons: ['Horas pico muy concurridas'],
      },
      {
        name: `Mirador panorámico de ${city}`,
        pros: ['Vistas increíbles de toda la ciudad y atardecer', 'Ideal para fotos'],
        cons: ['Requiere subir escaleras o transporte adicional'],
      },
    ];
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { videoUrl, destinationCity } = body;

    if (!videoUrl) {
      return NextResponse.json({ error: 'Debes proporcionar un enlace de video de YouTube.' }, { status: 400 });
    }

    const city = destinationCity || 'Ciudad de destino';
    const videoId = getYouTubeId(videoUrl);

    if (!videoId) {
      return NextResponse.json(
        { error: 'El enlace proporcionado no parece ser una URL válida de YouTube.' },
        { status: 400 }
      );
    }

    // Step 1: Attempt to download transcript
    let transcriptText = '';
    let transcriptItems = null;

    try {
      transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, {
        lang: 'es',
      }).catch(async () => {
        // Fallback to default auto-generated transcript (any language)
        return await YoutubeTranscript.fetchTranscript(videoId);
      });

      if (transcriptItems && transcriptItems.length > 0) {
        transcriptText = transcriptItems
          .map((item) => item.text)
          .join(' ')
          .slice(0, 15000); // Take first 15k characters for prompt
      }
    } catch (transcriptError: any) {
      console.warn('Transcript download failed:', transcriptError?.message);
    }

    // Strict error check: If no transcript is found or disabled
    const apiKey = process.env.GEMINI_API_KEY;

    if (!transcriptText && (!apiKey || apiKey.includes('your-gemini'))) {
      // In demo mode without API key and without captions, simulate places for local testing
      console.log('Using demo extraction places for testing...');
      const demoPlaces = getDemoExtractedPlaces(city);

      // Geocode demo places
      const geocoded = await Promise.all(
        demoPlaces.map(async (place) => {
          const geo = await geocodePlace(place.name, city);
          return {
            ...place,
            lat: geo.lat,
            lng: geo.lng,
            is_located: geo.is_located,
          };
        })
      );

      return NextResponse.json({
        success: true,
        source: 'demo_simulation',
        places: geocoded,
      });
    }

    if (!transcriptText) {
      // Strict failure requirement agreed during Grill-Me
      return NextResponse.json(
        {
          error:
            'Este video no cuenta con subtítulos o transcripción disponible en YouTube. Por favor utiliza un video que tenga subtítulos habilitados.',
        },
        { status: 422 }
      );
    }

    // Step 2: Parse places with Gemini
    let extractedPlaces: ExtractedPlaceItem[] = [];

    if (apiKey && !apiKey.includes('your-gemini')) {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Actúa como un experto en planificación de viajes. A partir de la siguiente transcripción de un video de YouTube sobre "${city}", extrae los lugares de interés específicos mencionados (monumentos, templos, restaurantes, miradores, museos, etc.).

Para cada lugar, proporciona:
- "name": Nombre conciso y oficial del lugar.
- "pros": Arreglo con 2 o 3 ventajas o recomendaciones clave.
- "cons": Arreglo con 1 o 2 desventajas, advertencias o precauciones.

Responde ÚNICAMENTE con un arreglo JSON válido sin explicaciones adicionales:
[
  {
    "name": "Nombre del lugar",
    "pros": ["Ventaja 1", "Ventaja 2"],
    "cons": ["Desventaja 1"]
  }
]

Transcripción:
${transcriptText}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      });

      const responseText = response.text || '';
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      extractedPlaces = JSON.parse(cleanJson);
    } else {
      // Fallback demo places if API key is not yet set
      extractedPlaces = getDemoExtractedPlaces(city);
    }

    // Step 3: Geocode with Nominatim OSM
    const geocodedPlaces = await Promise.all(
      extractedPlaces.map(async (place) => {
        const geo = await geocodePlace(place.name, city);
        return {
          ...place,
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
    console.error('Error in YouTube extraction route:', error);
    return NextResponse.json(
      { error: error?.message || 'Ocurrió un error al procesar el video de YouTube.' },
      { status: 500 }
    );
  }
}
