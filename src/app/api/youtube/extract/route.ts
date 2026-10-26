import { NextRequest, NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';
import { Ytdl } from '@distube/ytdl-core';
import { generateWithGemini } from '@/lib/ai/gemini';
import { ExtractedPlaceItem } from '@/types';

// Extract YouTube ID from various URL formats
function getYouTubeId(url: string): string | null {
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

// Download compressed audio chunk from YouTube (up to maxBytes)
async function downloadAudioChunk(videoUrl: string, maxBytes = 3.5 * 1024 * 1024): Promise<{ buffer: Buffer; mimeType: string } | null> {
  try {
    const ytdl = new Ytdl();
    const stream = ytdl.download(videoUrl, {
      filter: { hasAudio: true, hasVideo: false },
      quality: 'lowestaudio',
    });

    return await new Promise((resolve) => {
      const chunks: Buffer[] = [];
      let totalBytes = 0;

      stream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
        totalBytes += chunk.length;
        if (totalBytes >= maxBytes) {
          stream.destroy();
          resolve({ buffer: Buffer.concat(chunks), mimeType: 'audio/mp4' });
        }
      });

      stream.on('end', () => {
        resolve({ buffer: Buffer.concat(chunks), mimeType: 'audio/mp4' });
      });

      stream.on('error', () => {
        if (chunks.length > 0) {
          resolve({ buffer: Buffer.concat(chunks), mimeType: 'audio/mp4' });
        } else {
          resolve(null);
        }
      });

      setTimeout(() => {
        stream.destroy();
        if (chunks.length > 0) {
          resolve({ buffer: Buffer.concat(chunks), mimeType: 'audio/mp4' });
        } else {
          resolve(null);
        }
      }, 10000); // 10s max timeout for audio streaming
    });
  } catch (err) {
    console.warn('Audio streaming failed:', err);
    return null;
  }
}

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

// Demo fallback generator when GEMINI_API_KEY is not configured
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
    const { videoUrl, destinationCity, rawText } = body;

    const city = destinationCity || 'Ciudad de destino';
    const apiKey = process.env.GEMINI_API_KEY;

    // Direct text / notes extraction mode
    if (rawText && rawText.trim().length > 10) {
      let extractedPlaces: ExtractedPlaceItem[] = [];

      if (apiKey && !apiKey.includes('your-gemini')) {
        const prompt = `Actúa como un experto en viajes. A partir de las siguientes notas o descripción sobre "${city}", extrae los lugares turísticos o de interés específicos mencionados (monumentos, miradores, restaurantes, templos, etc.).

Para cada lugar incluye estrictamente en JSON:
- "name": Nombre conciso y oficial del lugar.
- "pros": Arreglo con 2 o 3 ventajas o recomendaciones.
- "cons": Arreglo con 1 o 2 desventajas o advertencias.

Responde ÚNICAMENTE con un arreglo JSON válido:
[
  { "name": "Nombre", "pros": ["Pro 1", "Pro 2"], "cons": ["Contra 1"] }
]

Texto:
${rawText.slice(0, 15000)}`;

        const rawResponse = await generateWithGemini(apiKey, prompt);
        const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        extractedPlaces = JSON.parse(cleanJson);
      } else {
        extractedPlaces = getDemoExtractedPlaces(city);
      }

      const geocoded = await Promise.all(
        extractedPlaces.map(async (place) => {
          const geo = await geocodePlace(place.name, city);
          return { ...place, lat: geo.lat, lng: geo.lng, is_located: geo.is_located };
        })
      );

      return NextResponse.json({ success: true, places: geocoded });
    }

    if (!videoUrl) {
      return NextResponse.json({ error: 'Debes proporcionar un enlace de video de YouTube o notas de texto.' }, { status: 400 });
    }

    const videoId = getYouTubeId(videoUrl);
    if (!videoId) {
      return NextResponse.json({ error: 'El enlace proporcionado no parece ser una URL válida de YouTube.' }, { status: 400 });
    }

    // Step 1: Try transcript
    let transcriptText = '';
    try {
      const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'es' })
        .catch(() => YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' }))
        .catch(() => YoutubeTranscript.fetchTranscript(videoId));

      if (transcriptItems && transcriptItems.length > 0) {
        transcriptText = transcriptItems.map((item) => item.text).join(' ').slice(0, 15000);
      }
    } catch {
      // Transcript unavailable
    }

    // Step 2: Try video metadata & description
    let videoTitle = '';
    let videoDescription = '';
    try {
      const ytdl = new Ytdl();
      const info = await ytdl.getInfo(videoUrl);
      videoTitle = info.videoDetails.title || '';
      videoDescription = (info.videoDetails.description || '').slice(0, 8000);
    } catch (e) {
      console.warn('Metadata fetch failed:', e);
    }

    // Step 3: Try audio extraction if no transcript
    let audioData: { buffer: Buffer; mimeType: string } | null = null;
    if (!transcriptText) {
      console.log('No transcript found, attempting audio extraction for Gemini...');
      audioData = await downloadAudioChunk(videoUrl);
    }

    // If demo mode (no real Gemini key)
    if (!apiKey || apiKey.includes('your-gemini')) {
      console.log('Demo mode fallback extraction...');
      const demoPlaces = getDemoExtractedPlaces(city);
      const geocoded = await Promise.all(
        demoPlaces.map(async (place) => {
          const geo = await geocodePlace(place.name, city);
          return { ...place, lat: geo.lat, lng: geo.lng, is_located: geo.is_located };
        })
      );
      return NextResponse.json({ success: true, source: 'demo_simulation', places: geocoded });
    }

    // Step 4: Call Gemini 3.8 Flash
    let extractedPlaces: ExtractedPlaceItem[] = [];

    const basePrompt = `Actúa como un experto en planificación de viajes. Tu misión es extraer los lugares de interés específicos (monumentos, museos, miradores, restaurantes, templos, parques, etc.) que se mencionan o recomiendan para visitar en "${city}".

Para cada lugar incluye estrictamente:
- "name": Nombre oficial y reconocible del lugar.
- "pros": Arreglo con 2 o 3 recomendaciones o ventajas clave.
- "cons": Arreglo con 1 o 2 desventajas, advertencias o precauciones.

Responde ÚNICAMENTE con un arreglo JSON válido sin explicaciones adicionales:
[
  { "name": "Nombre", "pros": ["Pro 1", "Pro 2"], "cons": ["Contra 1"] }
]`;

    if (transcriptText) {
      // Use transcript
      const prompt = `${basePrompt}\n\nTítulo del video: ${videoTitle}\nDescripción: ${videoDescription}\n\nTranscripción del video:\n${transcriptText}`;
      const rawResponse = await generateWithGemini(apiKey, prompt);
      const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      extractedPlaces = JSON.parse(cleanJson);
    } else if (audioData) {
      // Use audio file directly with Gemini multimodal audio
      console.log('Sending audio directly to Gemini...');
      const prompt = `${basePrompt}\n\nEscucha atentamente el audio de este video de viaje sobre "${city}" y toma en cuenta también el título: "${videoTitle}" y la descripción: "${videoDescription}". Extrae los lugares de los que se habla en el audio.`;

      const contents = [
        {
          inlineData: {
            mimeType: audioData.mimeType,
            data: audioData.buffer.toString('base64'),
          },
        },
        { text: prompt },
      ];

      const rawResponse = await generateWithGemini(apiKey, contents);
      const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      extractedPlaces = JSON.parse(cleanJson);
    } else if (videoDescription && videoDescription.length > 50) {
      // Fallback: extract from video description and title
      const prompt = `${basePrompt}\n\nTítulo del video: ${videoTitle}\nDescripción del video (con capítulos y lugares):\n${videoDescription}`;
      const rawResponse = await generateWithGemini(apiKey, prompt);
      const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      extractedPlaces = JSON.parse(cleanJson);
    } else {
      return NextResponse.json(
        {
          error:
            'YouTube tiene restricciones en este video y no se pudo obtener audio ni subtítulos. Puedes usar la pestaña "Pegar Notas / Texto" para ingresar el itinerario o capítulos manualmente.',
        },
        { status: 422 }
      );
    }

    // Step 5: Geocode with Nominatim
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
    console.error('Extraction error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al procesar el video de viaje.' },
      { status: 500 }
    );
  }
}
