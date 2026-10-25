'use client';

import React, { useState } from 'react';
import { Place } from '@/types';
import { OptimizedRouteResult, formatDistance, formatDuration } from '@/lib/routing/osrm';
import { Calendar, Compass, ArrowDown, ThumbsUp, Trash2, ArrowUp, MoveDown, Sparkles, Navigation } from 'lucide-react';

interface DayPlannerProps {
  places: Place[];
  totalDays: number;
  selectedDay: number | null;
  onSelectDay: (day: number | null) => void;
  onUpdatePlaceDay: (placeId: string, dayNumber: number | null) => void;
  onReorderPlaces: (places: Place[]) => void;
  onDeletePlace: (placeId: string) => void;
  onAutoCluster: () => void;
  onOptimizeCurrentDayRoute: () => void;
  currentRouteResult: OptimizedRouteResult | null;
  isOptimizing: boolean;
  hotelName?: string;
}

export default function DayPlanner({
  places,
  totalDays,
  selectedDay,
  onSelectDay,
  onUpdatePlaceDay,
  onReorderPlaces,
  onDeletePlace,
  onAutoCluster,
  onOptimizeCurrentDayRoute,
  currentRouteResult,
  isOptimizing,
  hotelName,
}: DayPlannerProps) {
  // Filter places for active day tab (or pool)
  const currentDayPlaces = places
    .filter((p) => (selectedDay === null ? p.day_number == null : p.day_number === selectedDay))
    .sort((a, b) => (a.visit_order || 0) - (b.visit_order || 0));

  const movePlace = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= currentDayPlaces.length) return;

    const reordered = [...currentDayPlaces];
    const temp = reordered[index];
    reordered[index] = reordered[targetIdx];
    reordered[targetIdx] = temp;

    // Update visit_order
    reordered.forEach((p, idx) => {
      p.visit_order = idx + 1;
    });

    onReorderPlaces(reordered);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
      {/* Header and Smart Action Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar size={20} className="text-blue-600 dark:text-blue-400" />
          <h2 className="font-bold text-base text-slate-900 dark:text-white">Organizador de Itinerario</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onAutoCluster}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 rounded-xl transition shadow-sm"
            title="Agrupar automáticamente lugares cercanos por día"
          >
            <Sparkles size={14} /> Agrupar por Cercanía
          </button>

          {selectedDay !== null && currentDayPlaces.length > 0 && (
            <button
              onClick={onOptimizeCurrentDayRoute}
              disabled={isOptimizing}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition disabled:opacity-50"
              title="Calcular la ruta más corta saliendo y regresando al hotel con OSRM"
            >
              <Navigation size={14} className={isOptimizing ? 'animate-spin' : ''} />
              {isOptimizing ? 'Calculando...' : 'Optimizar Ruta OSRM'}
            </button>
          )}
        </div>
      </div>

      {/* Day Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100 dark:border-slate-800">
        <button
          onClick={() => onSelectDay(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            selectedDay === null
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Lugares sin asignar ({places.filter((p) => p.day_number == null).length})
        </button>

        {Array.from({ length: totalDays }).map((_, idx) => {
          const dayNum = idx + 1;
          const count = places.filter((p) => p.day_number === dayNum).length;
          const isSelected = selectedDay === dayNum;

          return (
            <button
              key={dayNum}
              onClick={() => onSelectDay(dayNum)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>Día {dayNum}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-blue-700 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Route Summary Bar (if current day is optimized) */}
      {selectedDay !== null && currentRouteResult && currentRouteResult.totalDistanceMeters > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl p-3 flex flex-wrap items-center justify-between text-xs text-blue-900 dark:text-blue-200">
          <div className="flex items-center gap-2">
            <Compass size={16} className="text-blue-600" />
            <span className="font-semibold">Ruta calculada para el Día {selectedDay}:</span>
          </div>
          <div className="flex items-center gap-3">
            <span>
              Distancia total: <strong>{formatDistance(currentRouteResult.totalDistanceMeters)}</strong>
            </span>
            <span>
              Tiempo de traslado: <strong>{formatDuration(currentRouteResult.totalDurationSeconds)}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Sequence of Stops */}
      <div className="space-y-3">
        {/* Hotel departure marker if active day */}
        {selectedDay !== null && (
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
              🏠
            </div>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Salida: {hotelName || 'Hospedaje'}</span>
          </div>
        )}

        {currentDayPlaces.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            {selectedDay === null
              ? 'No hay lugares pendientes en el pool. Pega un video de YouTube para añadir más.'
              : `Aún no has agregado paradas para el Día ${selectedDay}. Asigna lugares desde el pool o usa 'Agrupar por Cercanía'.`}
          </div>
        ) : (
          currentDayPlaces.map((place, idx) => {
            const leg = currentRouteResult?.legs?.[idx];

            return (
              <React.Fragment key={place.id}>
                {/* Transit duration between stops */}
                {selectedDay !== null && leg && (
                  <div className="flex items-center gap-2 pl-6 py-0.5 text-[11px] text-slate-400">
                    <ArrowDown size={13} className="text-blue-500" />
                    <span>
                      Traslado aprox: {formatDuration(leg.durationSeconds)} ({formatDistance(leg.distanceMeters)})
                    </span>
                  </div>
                )}

                {/* Place Card */}
                <div className="flex items-start justify-between gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 transition shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {idx + 1}
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                        {place.name}
                      </h4>

                      {/* Pros & Cons summary pills */}
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {place.pros.slice(0, 2).map((pro, pIdx) => (
                          <span
                            key={pIdx}
                            className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md font-medium"
                          >
                            ✓ {pro}
                          </span>
                        ))}
                        {place.cons.slice(0, 1).map((con, cIdx) => (
                          <span
                            key={cIdx}
                            className="text-[10px] bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-md font-medium"
                          >
                            ⚠ {con}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Day Assignment */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Move Up / Down */}
                    {selectedDay !== null && (
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => movePlace(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-20"
                          title="Subir parada"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          onClick={() => movePlace(idx, 'down')}
                          disabled={idx === currentDayPlaces.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-20"
                          title="Bajar parada"
                        >
                          <MoveDown size={13} />
                        </button>
                      </div>
                    )}

                    {/* Change Day selector */}
                    <select
                      value={place.day_number ?? ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                        onUpdatePlaceDay(place.id, val);
                      }}
                      className="text-xs py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      <option value="">Sin asignar</option>
                      {Array.from({ length: totalDays }).map((_, dIdx) => (
                        <option key={dIdx + 1} value={dIdx + 1}>
                          Día {dIdx + 1}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => onDeletePlace(place.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition"
                      title="Eliminar lugar del viaje"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}

        {/* Hotel return marker if active day */}
        {selectedDay !== null && currentDayPlaces.length > 0 && (
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 mt-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
              🛏️
            </div>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Retorno: {hotelName || 'Hospedaje'}</span>
          </div>
        )}
      </div>
    </div>
  );
}
