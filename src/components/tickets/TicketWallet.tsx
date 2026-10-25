'use client';

import React, { useState } from 'react';
import { Ticket, Place } from '@/types';
import { Ticket as TicketIcon, Plus, Eye, Trash2, WifiOff, Upload, FileText, Image as ImageIcon } from 'lucide-react';
import TicketViewerModal from './TicketViewerModal';
import { cacheTicketBlob } from '@/lib/offline/ticketStore';

interface TicketWalletProps {
  tripId: string;
  tickets: Ticket[];
  places: Place[];
  onAddTicket: (ticket: Omit<Ticket, 'id' | 'trip_id' | 'created_at'>) => void;
  onDeleteTicket: (ticketId: string) => void;
}

export default function TicketWallet({
  tripId,
  tickets,
  places,
  onAddTicket,
  onDeleteTicket,
}: TicketWalletProps) {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState<'image' | 'pdf'>('image');
  const [isGroup, setIsGroup] = useState(true);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type.includes('pdf');
    setFileType(isPdf ? 'pdf' : 'image');
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }

    // Convert file to local Data URL and cache in IndexedDB
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setFileUrl(dataUrl);

      // Cache blob offline
      const ticketTempId = 'offline_' + Date.now();
      await cacheTicketBlob(ticketTempId, tripId, file.name, file.type, file);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !fileUrl) return;

    const matchedPlace = places.find(p => p.id === placeId);

    onAddTicket({
      title,
      place_id: placeId || null,
      place_name: matchedPlace?.name,
      user_id: 'user-me',
      file_url: fileUrl,
      file_type: fileType,
      is_group: isGroup,
      local_cached: true,
    });

    setTitle('');
    setPlaceId('');
    setFileUrl('');
    setIsAdding(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl">
            <TicketIcon size={20} />
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-900 dark:text-white">Billetera de Boletos (Llave en mano)</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
              <WifiOff size={11} className="text-emerald-500" /> Accesibles sin conexión durante el viaje
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition"
        >
          <Plus size={14} /> Subir Boleto
        </button>
      </div>

      {/* Add Ticket Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Nuevo Boleto o Pase</h4>
          
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Título del boleto</label>
            <input
              type="text"
              required
              placeholder="Ej. Entrada Museo con Código QR, Pase de Tren..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Asociar a un lugar (opcional)</label>
            <select
              value={placeId}
              onChange={(e) => setPlaceId(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            >
              <option value="">Sin asociar (Boleto general)</option>
              {places.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Archivo (Imagen QR o PDF)</label>
            <input
              type="file"
              accept="image/*,.pdf"
              required={!fileUrl}
              onChange={handleFileUpload}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isGroup"
              checked={isGroup}
              onChange={(e) => setIsGroup(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isGroup" className="text-xs text-slate-600 dark:text-slate-400">
              Visible para todos los amigos del viaje
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!title || !fileUrl}
              className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg shadow-sm"
            >
              Guardar en Billetera
            </button>
          </div>
        </form>
      )}

      {/* Ticket List */}
      {tickets.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-xs">
          No tienes boletos guardados aún. Sube tus pases para tenerlos listos en torniquetes.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50/50 dark:bg-slate-800/40 transition group"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
                  {ticket.file_type === 'pdf' ? <FileText size={18} /> : <ImageIcon size={18} />}
                </div>
                <div className="overflow-hidden">
                  <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">
                    {ticket.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {ticket.place_name || 'Boleto general'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  onClick={() => setSelectedTicket(ticket)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition"
                  title="Abrir para escaneo rápido"
                >
                  <Eye size={13} /> Ver
                </button>
                <button
                  onClick={() => onDeleteTicket(ticket.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition"
                  title="Eliminar boleto"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Optical Viewer Modal */}
      <TicketViewerModal
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
      />
    </div>
  );
}
