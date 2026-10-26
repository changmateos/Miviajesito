'use client';

import React, { useState } from 'react';
import { Sparkles, Loader2, AlertCircle, CheckCircle, FileText, Link as LinkIcon } from 'lucide-react';
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
  const [mode, setMode] = useState<'url' | 'text'>('url');
  const [url, setUrl] = useState('');
  const [rawText, setRawText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'url' && !url.trim()) return;
    if (mode === 'text' && !rawText.trim()) return;

    setIsLoading(true);
    setError(null);
    setSuccessCount(null);

    try {
      const response = await fetch('/api/youtube/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: mode === 'url' ? url : undefined,
          rawText: mode === 'text' ? rawText : undefined,
          destinationCity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No se pudieron extraer lugares.');
      }

      if (data.places && data.places.length > 0) {
        onPlacesExtracted(data.places);
        setSuccessCount(data.places.length);
        if (mode === 'url') setUrl('');
        if (mode === 'text') setRawText('');
      } else {
        setError('No se identificaron lugares de interés claros.');
      }
    } catch (err: any) {
      setError(err.message || 'Error al procesar el contenido.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-red-500/10 via-blue-500/10 to-indigo-500/10 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
      {/* Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-red-600 text-white rounded-lg">
            <YoutubeIcon size={18} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Importar Recomendaciones con IA (Gemini Flash)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Analiza subtítulos, escucha el audio del video o lee tus notas sobre {destinationCity}.
            </p>
          </div>
        </div>

        <div className="flex items-center p-1 bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition ${
              mode === 'url' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <LinkIcon size={13} /> Video de YouTube
          </button>
          <button
            type="button"
            onClick={() => setMode('text')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition ${
              mode === 'text' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <FileText size={13} /> Pegar Notas / Texto
          </button>
        </div>
      </div>

      <form onSubmit={handleExtract} className="space-y-3">
        {mode === 'url' ? (
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
                  <span>Procesando audio...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Extraer Lugares</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <textarea
              rows={3}
              required
              placeholder="Pega aquí la descripción del video, los capítulos con minutos, un blog de viajes o las recomendaciones de WhatsApp..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              disabled={isLoading}
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading || !rawText.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-sm transition shrink-0"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Analizando con Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Extraer Lugares del Texto</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

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
