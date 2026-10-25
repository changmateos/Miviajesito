'use client';

import React, { useState } from 'react';
import { Ticket } from '@/types';
import { X, ZoomIn, ZoomOut, Download, WifiOff, CheckCircle2 } from 'lucide-react';

interface TicketViewerModalProps {
  ticket: Ticket | null;
  onClose: () => void;
}

export default function TicketViewerModal({ ticket, onClose }: TicketViewerModalProps) {
  const [zoomLevel, setZoomLevel] = useState(1);

  if (!ticket) return null;

  const isImage = ticket.file_type === 'image';

  return (
    <div className="fixed inset-0 z-[2000] flex flex-col bg-black/90 backdrop-blur-sm animate-fade-in">
      {/* Top Bar with maximum contrast */}
      <div className="flex items-center justify-between p-4 bg-slate-900/90 border-b border-slate-800 text-white">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-600 rounded-lg">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base leading-tight">{ticket.title}</h3>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>{ticket.place_name || 'Boleto de viaje'}</span>
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <WifiOff size={11} /> Listo sin conexión (Llave en mano)
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isImage && (
            <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
              <button
                onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.75))}
                className="p-1.5 hover:bg-slate-700 rounded text-slate-300"
                title="Reducir zoom"
              >
                <ZoomOut size={16} />
              </button>
              <span className="text-xs font-mono px-1.5 text-slate-300">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2.5))}
                className="p-1.5 hover:bg-slate-700 rounded text-slate-300"
                title="Aumentar zoom para escanear"
              >
                <ZoomIn size={16} />
              </button>
            </div>
          )}

          <a
            href={ticket.file_url}
            download={ticket.title}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
            title="Descargar archivo"
          >
            <Download size={18} />
          </a>

          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-red-600 text-slate-200 hover:text-white rounded-lg transition"
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Content Area - White background to boost scanner readability */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4 sm:p-8 bg-white">
        {isImage ? (
          <div
            className="transition-transform duration-150 ease-out flex items-center justify-center"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ticket.file_url}
              alt={ticket.title}
              className="max-h-[80vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
            />
          </div>
        ) : (
          <div className="w-full h-full max-w-4xl bg-slate-100 rounded-xl overflow-hidden shadow-2xl flex flex-col items-center justify-center p-6 text-slate-800">
            <iframe
              src={ticket.file_url}
              className="w-full h-[75vh] rounded-lg border border-slate-300"
              title={ticket.title}
            />
          </div>
        )}
      </div>

      {/* Bottom Hint */}
      <div className="p-3 bg-slate-900 text-center text-xs text-slate-400 border-t border-slate-800">
        Tip: Muestra este código QR o código de barras directamente al lector óptico en la entrada.
      </div>
    </div>
  );
}
