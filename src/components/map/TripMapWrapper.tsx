'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { Place } from '@/types';
import { Loader2 } from 'lucide-react';

interface TripMapWrapperProps {
  hotel?: { name: string; lat: number; lng: number };
  places: Place[];
  selectedDay?: number | null;
  routeCoordinates?: [number, number][];
  onPlaceClick?: (place: Place) => void;
  onVotePlace?: (placeId: string) => void;
  onDeletePlace?: (placeId: string) => void;
  onMapClick?: (lat: number, lng: number) => void;
  isPinningMode?: boolean;
}

const DynamicTripMap = dynamic(() => import('./TripMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] rounded-2xl bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center text-slate-400 gap-3 border border-slate-200 dark:border-slate-800">
      <Loader2 className="animate-spin text-blue-500" size={32} />
      <span className="text-sm font-medium">Cargando mapa libre de OpenStreetMap...</span>
    </div>
  ),
});

export default function TripMapWrapper(props: TripMapWrapperProps) {
  return <DynamicTripMap {...props} />;
}
