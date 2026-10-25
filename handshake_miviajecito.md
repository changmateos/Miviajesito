# Handshake · Mi Viajecito App

Status: grilled · 2026-10-25

## The idea in plain words
Quieres una aplicación web que tú y tus amigos puedan abrir en la computadora o en el celular como si fuera una aplicación instalada.

Cuando encuentras un video de YouTube sobre una ciudad que quieres visitar, pegas el enlace en la app. La app lee lo que dice el video, encuentra todos los lugares que menciona y te muestra qué tienen de bueno y qué tienen de malo.

De inmediato, esos lugares aparecen marcados en un mapa para que tú y tus amigos puedan verlos. Si algún lugar no les gusta, lo borran con un toque.

Para armar el itinerario, colocas el hotel donde van a dormir. La app junta los lugares que quedan cerca entre sí para cada día y les traza el camino más corto para visitarlos sin dar vueltas de más. Todo el mapa y los caminos funcionan con herramientas gratuitas.

Además, cada quien puede guardar sus boletos de avión, trenes o entradas a museos dentro de la app. Esos boletos se quedan guardados en el celular para que puedan mostrarlos en la entrada sin importar si hay señal de internet o no.

## Why this matters
Planificar un viaje con amigos o en pareja actualmente es un dolor de cabeza desorganizado:
- La gente mira horas de videos y reseñas en YouTube o redes sociales, anotando nombres de lugares en notas o chats de WhatsApp.
- Es difícil extraer qué lugares valen la pena, qué ventajas y desventajas tienen, y ubicarlos en un mapa.
- Coordinar con otros viajeros suele ser caótico y disperso.
- Al llegar al destino, los boletos y entradas compradas quedan perdidos entre correos electrónicos o capturas de pantalla, y las rutas diarias se hacen sin optimizar distancias.

Mi Viajecito App soluciona esto centralizando la inspiración, selección de lugares mediante extracción inteligente de videos, colaboración grupal, guardado de tickets "llave en mano" y optimización de itinerarios en un solo lugar.

## Who it's for
- Creador y su grupo de viaje (amigos, pareja, familia) para organizar viajes reales de forma práctica y ágil.
- Enfoque de primera fase: herramienta colaborativa funcional para el grupo, priorizando la facilidad de uso y cero costos fijos, sin sobreingeniería de monetización ni escalabilidad masiva inicial.

## What exists today
- Directorio de proyecto nuevo y vacío (`MiViajecitoApp`).
- No existe base de código previa ni infraestructura desplegada.

## What success looks like
- El usuario pega un enlace de un video de YouTube sobre una ciudad, y en segundos la app extrae la transcripción con Gemini y sitúa en el mapa todos los lugares mencionados con sus pros y contras.
- Los amigos invitados inician sesión y pueden revisar el mapa, votar, añadir nuevos puntos o borrar lo que no les interese.
- Al ingresar el hotel y los días del viaje, la app agrupa los lugares inteligentemente día por día y traza la ruta más eficiente usando OpenStreetMap y OSRM sin pagar licencias de mapas.
- Los boletos y reservas vinculados a cada visita se abren al instante en el móvil aun cuando el teléfono esté en modo avión o sin roaming.

## Decisions already made
- Enfoque de primera fase: uso personal y para grupos de amigos o familia, sin cuotas ni muros de pago.
- Plataforma: Web App responsive / PWA (Progressive Web App). Se accede por enlace web directo tanto en navegador de PC como en celular, y se puede añadir a la pantalla de inicio en móviles para usarse como app sin trámites de tiendas de aplicaciones.
- Flujo de extracción de YouTube: importación directa y ágil. Al ingresar el link del video, la app extrae automáticamente la transcripción, identifica los lugares con sus pros y contras mediante IA (Gemini API), los geolocaliza y los coloca directamente en el mapa y la lista del viaje. La tarjeta de cada lugar es mínima y veloz: extrae estrictamente el nombre del lugar, pros principales y contras clave/advertencias para optimizar la velocidad y el consumo de tokens. El usuario y sus amigos revisan el mapa y simplemente descartan o eliminan lo que no les interese. En caso de videos sin subtítulos o con transcripción bloqueada, se aplica fallo estricto con mensaje claro solicitando otro enlace de video compatible.
- Autenticación y colaboración: cada participante cuenta con su propia cuenta individual (registro mediante correo electrónico o Google Sign-In). La colaboración se basa en roles estrictos: el Creador/Organizador del viaje es el único con facultades para fijar fechas, hotel base, borrar lugares y cerrar el itinerario oficial. Los Amigos/Invitados pueden sugerir lugares (mediante videos de YouTube o en el mapa), votar con 'me gusta' en las propuestas de los demás y consultar el mapa y rutas.
- Gestión de tickets 'llave en mano' con soporte offline: los usuarios pueden adjuntar boletos en PDF, imágenes o capturas con códigos QR directamente al lugar de visita o al día correspondiente del itinerario. Estos archivos se sincronizan y almacenan en la memoria local del dispositivo (IndexedDB o cache PWA) para abrirse al instante en destino, incluso sin roaming o conexión a internet. La interfaz incluye una Billetera de Viaje con visor integrado a pantalla completa y zoom optimizado para lectura rápida de códigos QR y códigos de barras en torniquetes y accesos.
- Hospedaje y optimización de itinerarios: el usuario fija el pin de su alojamiento como base de salida y retorno de cada día. La app cuenta con un asistente inteligente de agrupación geográfica (clustering) que distribuye los lugares seleccionados en los días del viaje para minimizar traslados cruzados por la ciudad, calculando el orden óptimo de visita. El itinerario diario se estructura en secuencias flexibles (Paso 1, 2, 3...) indicando la distancia y tiempo estimado de traslado entre paradas, permitiendo al organizador reordenar pasos manualmente mediante arrastrar y soltar (drag and drop) sin atarse a horarios rígidos.
- Pila de mapas libre de costos: uso exclusivo de tecnologías abiertas y gratuitas para evitar tarifas de Google Maps u otras APIs de pago: visualización con Leaflet / MapLibre GL, capas de OpenStreetMap (OSM), geocodificación de nombres mediante Nominatim y trazado de rutas con OSRM (Open Source Routing Machine).
- Geocodificación y bandeja 'Por ubicar': los lugares extraídos del video se geolocalizan contextualizados con la ciudad/país de destino. Aquellos lugares con coordenadas verificadas aparecen directo en el mapa; los lugares coloquiales o sin coincidencia exacta se resguardan en una bandeja lateral 'Por ubicar' para que el usuario o sus amigos puedan asignarles un pin manual con un clic en el mapa.
- Stack tecnológico: Next.js (React + TypeScript + Tailwind CSS) como framework full-stack unificado. Incluye PWA para soporte offline e instalación móvil, y API Routes en Node.js para consumir YouTube Transcripts y Gemini sin restricciones de CORS en el navegador.
- Infraestructura y backend: Supabase para base de datos Postgres, autenticación (Google y email), almacenamiento de archivos de boletos y tiempo real, junto con Gemini Flash API para el procesamiento de lenguaje natural y extracción estructurada de lugares en la capa gratuita.

## Decisions still open
- Ninguna decisión arquitectónica crítica abierta para el inicio de la planificación.

## Constraints and guardrails
- Costo cero recurrente: la arquitectura debe operar completamente dentro de las capas gratuitas (Supabase Free Tier, Gemini API Free Tier, OpenStreetMap, Nominatim y OSRM público).
- Acceso sin conexión en móvil: los boletos y el itinerario diario deben poder consultarse offline en destino.
- Sin em dashes en la documentación y textos (regla de estilo del handshake).

## Out of scope
- Procesamiento de pagos para comprar boletos o reservar hoteles dentro de la app (la app guarda reservas ya hechas por el usuario, no es una agencia de viajes OTA).
- Soporte para transcripción de audio pesado en tiempo real si el video no tiene subtítulos disponibles en YouTube (se apoyará en transcripciones / subtítulos existentes o generados por YouTube).
- Publicación obligatoria en tiendas cerradas de apps (Google Play Console / Apple App Store developer program de pago) en esta fase.

## Open questions for research
- 1. Estrategia más robusta y sin costo para extraer subtítulos o transcripciones de YouTube desde el backend o funciones serverless (ej. youtube-transcript, APIs comunitarias o proxies ligeros ante posibles rate limits).
- 2. Selección óptima de biblioteca frontend para el mapa PWA (Leaflet con React-Leaflet vs MapLibre GL para mejor rendimiento y fluidez en móviles).
- 3. Algoritmo de clustering simple y eficiente (ej. K-means o agrupamiento por distancia euclidiana/Haversine) para repartir los lugares en N días minimizando la distancia de traslado.

## Handoff notes
- La arquitectura sugerida para el planificador es: Next.js (App Router) con PWA configurado (o Vite + React PWA), Supabase Client para Auth/DB/Storage, y llamadas a endpoints de extracción con Gemini 1.5/2.0 Flash.
- El proyecto se inicia en `c:\Code Local\Antigravity\MiViajecitoApp`.
