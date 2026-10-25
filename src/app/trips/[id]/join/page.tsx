'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Trip } from '@/types';
import { TripStore } from '@/lib/store/tripStore';
import { Compass, Users, Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface JoinPageProps {
  params: Promise<{ id: string }>;
}

export default function JoinTripPage({ params }: JoinPageProps) {
  const resolvedParams = use(params);
  const tripId = resolvedParams.id;
  const router = useRouter();

  const [trip, setTrip] = useState<Trip | null>(null);

  useEffect(() => {
    const t = TripStore.getTrip(tripId);
    if (t) {
      setTrip(t);
    }
  }, [tripId]);

  if (!trip) {
    return (
      <div className="text-center py-20 space-y-4">
        <Compass size={40} className="mx-auto text-slate-400" />
        <h2 className="text-lg font-bold">Viaje no encontrado</h2>
        <Link href="/" className="text-xs text-blue-600 font-semibold underline">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const handleJoin = () => {
    // Add user as collaborator
    router.push(`/trips/${trip.id}`);
  };

  return (
    <div className="max-w-md mx-auto py-12 space-y-6 animate-fade-in text-center">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-xl space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
          <Users size={32} />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold">
            Invitación de viaje
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            {trip.title}
          </h1>
          <p className="text-xs text-slate-500">
            {trip.destination_city}, {trip.destination_country}
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 text-xs text-slate-600 dark:text-slate-300 space-y-2 text-left">
          <div className="font-bold text-slate-800 dark:text-slate-200">Como colaborador podrás:</div>
          <div className="flex items-center gap-2">
            <Check size={14} className="text-emerald-500 shrink-0" />
            <span>Proponer lugares pegando enlaces de videos de YouTube</span>
          </div>
          <div className="flex items-center gap-2">
            <Check size={14} className="text-emerald-500 shrink-0" />
            <span>Votar con 'Me gusta' en las propuestas de tus amigos</span>
          </div>
          <div className="flex items-center gap-2">
            <Check size={14} className="text-emerald-500 shrink-0" />
            <span>Consultar el mapa diario y tus boletos sin conexión</span>
          </div>
        </div>

        <button
          onClick={handleJoin}
          className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg transition"
        >
          <span>Aceptar y Entrar al Viaje</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
