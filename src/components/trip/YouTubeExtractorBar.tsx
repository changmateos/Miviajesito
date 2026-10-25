'use client';

import React, { useState } from 'react';
import { Sparkles, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import YoutubeIcon from '@/components/ui/YoutubeIcon';
import { ExtractedPlaceItem } from '@/types';

interface YouTubeExtractorBarProps {
  destinationCity: string;
  onPlacesExtracted: (places: ExtractedPlaceItem[]) => void;
}

export default function YouTubeExtractorBar({
  destinationCity,
  onPlacesExtracted,
}: YouTubeExtractorBarProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setError(null);
    setSuccessCount(null);

    try {
      const response = await fetch('/api/youtube/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: url,
          destinationCity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No se pudieron extraer lugares del video.');
      }

      if (data.places && data.places.length > 0) {
        onPlacesExtracted(data.places);
        setSuccessCount(data.places.length);
        setUrl('');
      } else {
        setError('No se identificaron puntos de interés claros en este video.');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión al procesar el video.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-red-500/10 via-blue-500/10 to-indigo-500/10 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
      <form onSubmit={handleExtract} className="space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-red-600 text-white rounded-lg">
              <YoutubeIcon size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Importar Recomendaciones desde YouTube
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pega el link de cualquier reseña o guía sobre {destinationCity} y la IA extraerá los lugares con pros y contras.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="url"
              required
              placeholder="https://www.youtube.com/watch?v=... o https://youtu.be/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
              className="w-full text-xs sm:text-sm pl-4 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-sm transition shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Analizando...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Extraer Lugares</span>
              </>
            )}
          </button>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs rounded-xl animate-fade-in">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successCount !== null && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl animate-fade-in">
            <CheckCircle size={15} className="shrink-0" />
            <span>¡Se agregaron con éxito {successCount} lugares al mapa y al itinerario!</span>
          </div>
        )}
      </form>
    </div>
  );
}
