'use client';

import React from 'react';
import { Place } from '@/types';
import { MapPin, Trash2, HelpCircle, X } from 'lucide-react';

interface UnlocatedPlacesDrawerProps {
  unlocatedPlaces: Place[];
  onStartPinning: (place: Place) => void;
  onDeletePlace: (placeId: string) => void;
  activePinningPlaceId: string | null;
  onCancelPinning: () => void;
}

export default function UnlocatedPlacesDrawer({
  unlocatedPlaces,
  onStartPinning,
  onDeletePlace,
  activePinningPlaceId,
  onCancelPinning,
}: UnlocatedPlacesDrawerProps) {
  if (unlocatedPlaces.length === 0) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <HelpCircle size={18} className="text-amber-600 dark:text-amber-400" />
          <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-200">
            Lugares por Ubicar ({unlocatedPlaces.length})
          </h3>
        </div>
        <span className="text-xs text-amber-700 dark:text-amber-400">
          La IA no encontró su dirección exacta
        </span>
      </div>

      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {unlocatedPlaces.map((place) => {
          const isCurrent = activePinningPlaceId === place.id;
          return (
            <div
              key={place.id}
              className={`flex items-start justify-between gap-3 p-3 rounded-xl border text-sm transition-all ${
                isCurrent
                  ? 'bg-blue-50 border-blue-400 dark:bg-blue-950/60 dark:border-blue-500 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-900/60'
              }`}
            >
              <div className="flex-1">
                <div className="font-medium text-slate-800 dark:text-slate-100">{place.name}</div>
                {place.pros.length > 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    ✓ {place.pros[0]}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {isCurrent ? (
                  <button
                    onClick={onCancelPinning}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition"
                  >
                    <X size={13} /> Cancelar
                  </button>
                ) : (
                  <button
                    onClick={() => onStartPinning(place)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-sm transition"
                  >
                    <MapPin size={13} /> Fijar Pin
                  </button>
                )}

                <button
                  onClick={() => onDeletePlace(place.id)}
                  className="p-1 text-slate-400 hover:text-red-500 rounded-lg transition"
                  title="Descartar lugar"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
