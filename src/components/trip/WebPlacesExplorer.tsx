'use client';

import React, { useState } from 'react';
import { Compass, Sparkles, Loader2, AlertCircle, CheckCircle, Search, Plus, MapPin, Globe } from 'lucide-react';
import { ExtractedPlaceItem } from '@/types';

interface WebPlacesExplorerProps {
  destinationCity: string;
  destinationCountry?: string;
  totalDays: number;
  onPlacesDiscovered: (places: any[]) => void;
  onAddManualPlace: (place: { name: string; lat: number; lng: number; is_located: boolean; pros: string[]; cons: string[] }) => void;
}

export default function WebPlacesExplorer({
  destinationCity,
  destinationCountry,
  totalDays,
  onPlacesDiscovered,
  onAddManualPlace,
}: WebPlacesExplorerProps) {
  const [activeTab, setActiveTab] = useState<'trending' | 'search'>('trending');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleDiscoverTrending = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessCount(null);

    try {
      const response = await fetch('/api/places/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinationCity,
          destinationCountry,
          totalDays,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No se pudieron obtener recomendaciones de la web.');
      }

      if (data.places && data.places.length > 0) {
        onPlacesDiscovered(data.places);
        setSuccessCount(data.places.length);
      } else {
        setError('No se encontraron recomendaciones destacadas para esta ciudad.');
      }
    } catch (err: any) {
      setError(err.message || 'Error al conectar con la búsqueda de lugares.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchPlaces = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/places/search?city=${encodeURIComponent(destinationCity)}&q=${encodeURIComponent(searchQuery.trim())}`
      );
      const data = await res.json();
      setSearchResults(data.results || []);
      if ((data.results || []).length === 0) {
        setError(`No se encontraron coincidencias para "${searchQuery}" en ${destinationCity}.`);
      }
    } catch (err: any) {
      setError('Error al buscar en el mapa.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (item: any) => {
    onAddManualPlace({
      name: item.name,
      lat: item.lat,
      lng: item.lng,
      is_located: true,
      pros: ['Añadido manualmente al viaje'],
      cons: [],
    });
    setSearchQuery('');
    setSearchResults([]);
    setSuccessCount(1);
  };

  return (
    <div className="bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-emerald-600/10 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
      {/* Top Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-600 text-white rounded-xl shadow-sm">
            <Globe size={18} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Explorador de Lugares de la Web y Redes Sociales
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Descubre lo más visitado en internet y redes o busca cualquier atracción para {destinationCity}.
            </p>
          </div>
        </div>

        <div className="flex items-center p-1 bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('trending')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'trending'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Sparkles size={13} /> Lo más visitado en la Web
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'search'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Search size={13} /> Buscar por Nombre
          </button>
        </div>
      </div>

      {/* Tab 1: Web & Social Media Recommendations */}
      {activeTab === 'trending' ? (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="space-y-1">
            <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
              Atracciones virales y destinos imprescindibles
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Analiza los sitios con más visitas y mejores reseñas en internet sobre {destinationCity}, organizándolos por días y distancias.
            </p>
          </div>

          <button
            onClick={handleDiscoverTrending}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition shrink-0 w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Buscando en la web...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Explorar Lugares Más Visitados</span>
              </>
            )}
          </button>
        </div>
      ) : (
        /* Tab 2: Instant Place Search */
        <div className="space-y-3">
          <form onSubmit={handleSearchPlaces} className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={`Ej. Museo, Mirador, Templo, Parque en ${destinationCity}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 text-xs sm:text-sm font-bold rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {isSearching ? <Loader2 size={16} className="animate-spin" /> : 'Buscar'}
            </button>
          </form>

          {/* Search Results List */}
          {searchResults.length > 0 && (
            <div className="p-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1 max-h-56 overflow-y-auto">
              {searchResults.map((res, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs transition"
                >
                  <div className="flex items-start gap-2 overflow-hidden pr-2">
                    <MapPin size={15} className="text-blue-500 shrink-0 mt-0.5" />
                    <div className="overflow-hidden">
                      <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {res.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {res.display_name}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectSearchResult(res)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shrink-0 transition shadow-sm text-xs"
                  >
                    <Plus size={13} /> Añadir
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs rounded-xl animate-fade-in">
          <AlertCircle size={15} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successCount !== null && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl animate-fade-in">
          <CheckCircle size={15} className="shrink-0" />
          <span>¡Se añadieron {successCount} lugares verificados al mapa y a tu itinerario!</span>
        </div>
      )}
    </div>
  );
}
