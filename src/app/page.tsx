'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trip } from '@/types';
import { TripStore } from '@/lib/store/tripStore';
import { Compass, Calendar, MapPin, Plus, ArrowRight, Sparkles, Ticket, Users } from 'lucide-react';
import YoutubeIcon from '@/components/ui/YoutubeIcon';

export default function HomePage() {
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    setTrips(TripStore.getTrips());
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 text-white p-6 sm:p-10 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold">
            <Sparkles size={14} /> Planifica sin romperte la cabeza
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Tus viajes organizados con videos de YouTube y mapas libres.
          </h1>

          <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
            Pega enlaces de reseñas de viaje, extrae lugares recomendados con pros y contras al instante, colabora con amigos y ten tus boletos siempre a la mano sin conexión.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/trips/new"
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-600 hover:bg-blue-50 font-bold text-sm rounded-xl shadow-lg transition"
            >
              <Plus size={16} /> Crear Nuevo Viaje
            </Link>
          </div>
        </div>

        {/* Feature Highlights on Hero */}
        <div className="mt-8 pt-6 border-t border-white/20 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="flex items-center gap-2">
            <YoutubeIcon size={18} className="text-red-300" />
            <span>Extracción de POIs desde videos</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-emerald-300" />
            <span>Mapas OpenStreetMap y rutas OSRM</span>
          </div>
          <div className="flex items-center gap-2">
            <Ticket size={18} className="text-amber-300" />
            <span>Boletos 'Llave en mano' offline</span>
          </div>
        </div>
      </div>

      {/* Trips Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Mis Viajes</h2>
            <p className="text-xs text-slate-500">Selecciona un viaje para ver su mapa, itinerario y boletos</p>
          </div>

          <Link
            href="/trips/new"
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            <Plus size={14} /> Nuevo destino
          </Link>
        </div>

        {trips.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
            <Compass size={40} className="mx-auto text-slate-300 dark:text-slate-700" />
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">No tienes viajes creados aún</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Comienza creando tu primer destino y agrega enlaces de videos para descubrir lugares increíbles.
            </p>
            <Link
              href="/trips/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition"
            >
              <Plus size={15} /> Crear Primer Viaje
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {trips.map((trip) => (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}`}
                className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                      {trip.destination_city}, {trip.destination_country}
                    </span>
                    <span className="text-xs text-slate-400 group-hover:text-blue-500 transition">
                      <ArrowRight size={16} />
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-blue-600 transition">
                    {trip.title}
                  </h3>

                  <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    {trip.start_date && (
                      <div className="flex items-center gap-2">
                        <Calendar size={13} className="text-slate-400" />
                        <span>
                          {trip.start_date} al {trip.end_date || 'Fin'}
                        </span>
                      </div>
                    )}
                    {trip.hotel_name && (
                      <div className="flex items-center gap-2">
                        <MapPin size={13} className="text-slate-400" />
                        <span className="truncate">{trip.hotel_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Users size={12} /> Colaborativo
                  </span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">Abrir mapa →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
