'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TripStore } from '@/lib/store/tripStore';
import { Compass, Calendar, MapPin, Building, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function NewTripPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hotelName, setHotelName] = useState('');
  const [autoGenerateAI, setAutoGenerateAI] = useState(true);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !city) return;

    setIsGeocoding(true);

    let hotelLat: number | undefined = undefined;
    let hotelLng: number | undefined = undefined;

    // Attempt to geocode hotel or city center with Nominatim OSM
    try {
      const searchTarget = hotelName ? `${hotelName}, ${city}` : city;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(searchTarget)}`,
        {
          headers: { 'User-Agent': 'MiViajecitoApp/1.0' },
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          hotelLat = parseFloat(data[0].lat);
          hotelLng = parseFloat(data[0].lon);
        }
      }
    } catch (e) {
      console.warn('Geocoding fallback', e);
    } finally {
      setIsGeocoding(false);
    }

    const created = TripStore.createTrip({
      title,
      destination_city: city,
      destination_country: country,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      hotel_name: hotelName || `Centro de ${city}`,
      hotel_lat: hotelLat,
      hotel_lng: hotelLng,
      created_by: 'user-me',
    });

    if (autoGenerateAI) {
      try {
        const totalDays = startDate && endDate
          ? Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1)
          : 3;

        const aiRes = await fetch('/api/ai/generate-itinerary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            destinationCity: city,
            destinationCountry: country,
            totalDays,
            hotelName,
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          if (aiData.places && aiData.places.length > 0) {
            TripStore.addPlaces(created.id, aiData.places);
          }
        }
      } catch (err) {
        console.warn('Auto AI generation failed', err);
      }
    }

    router.push(`/trips/${created.id}`);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
      >
        <ArrowLeft size={14} /> Volver a Mis Viajes
      </Link>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Planificar Nuevo Viaje</h1>
          <p className="text-xs text-slate-500 mt-1">
            Indica tu destino y hotel base. Luego podrás pegar videos de YouTube para descubrir lugares.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Nombre del viaje <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Vacaciones en Roma con Amigos"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Ciudad de destino <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Roma, Tokio, Madrid..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                País (opcional)
              </label>
              <input
                type="text"
                placeholder="Ej. Italia, Japón, España..."
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Fecha de inicio</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Fecha de fin</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-1 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Hotel o Alojamiento (Pin base)
              </label>
              <span className="text-[11px] text-blue-600 dark:text-blue-400">Punto de inicio y fin de ruta</span>
            </div>
            <input
              type="text"
              placeholder="Ej. Hotel Quirinale, Via Nazionale 7 o Airbnb Trastevere"
              value={hotelName}
              onChange={(e) => setHotelName(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 mt-3">
            <input
              type="checkbox"
              id="autoGenerate"
              checked={autoGenerateAI}
              onChange={(e) => setAutoGenerateAI(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="autoGenerate" className="text-xs font-semibold text-blue-900 dark:text-blue-200 cursor-pointer select-none">
              ✨ Proponer automáticamente lugares e itinerario con IA para estos días
            </label>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isGeocoding || !title || !city}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg transition"
            >
              {isGeocoding ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Geolocalizando destino en OpenStreetMap...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Crear y Abrir Mi Viaje</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
