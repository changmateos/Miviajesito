'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Trip, Place, Ticket } from '@/types';
import { TripStore } from '@/lib/store/tripStore';
import { isSupabaseConfigured, createClient } from '@/lib/supabase/client';
import TripMapWrapper from '@/components/map/TripMapWrapper';
import YouTubeExtractorBar from '@/components/trip/YouTubeExtractorBar';
import UnlocatedPlacesDrawer from '@/components/trip/UnlocatedPlacesDrawer';
import DayPlanner from '@/components/itinerary/DayPlanner';
import TicketWallet from '@/components/tickets/TicketWallet';
import { calculateOptimizedRoute, OptimizedRouteResult } from '@/lib/routing/osrm';
import { clusterPlacesIntoDays } from '@/lib/routing/clustering';
import { Share2, MapPin, Calendar, ArrowLeft, Users, Check, Copy, Sparkles, Building, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TripWorkspacePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const tripId = resolvedParams.id;
  const router = useRouter();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [pinningPlace, setPinningPlace] = useState<Place | null>(null);

  // Routing State
  const [routeResult, setRouteResult] = useState<OptimizedRouteResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Share Modal State
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load Trip Data
  useEffect(() => {
    const loadedTrip = TripStore.getTrip(tripId);
    if (!loadedTrip) {
      router.push('/');
      return;
    }
    setTrip(loadedTrip);
    setPlaces(TripStore.getPlaces(tripId));
    setTickets(TripStore.getTickets(tripId));
  }, [tripId, router]);

  // Recalculate OSRM route whenever selectedDay changes or places change
  useEffect(() => {
    if (!trip || selectedDay === null) {
      setRouteResult(null);
      return;
    }

    const dayPlaces = places
      .filter((p) => p.day_number === selectedDay && p.is_located && p.lat != null && p.lng != null)
      .sort((a, b) => (a.visit_order || 0) - (b.visit_order || 0));

    if (dayPlaces.length === 0 || !trip.hotel_lat || !trip.hotel_lng) {
      setRouteResult(null);
      return;
    }

    // Auto-calculate route preview
    const hotelPoint = {
      name: trip.hotel_name || 'Hospedaje',
      lat: trip.hotel_lat,
      lng: trip.hotel_lng,
      isHotel: true,
    };

    const placePoints = dayPlaces.map((p) => ({
      id: p.id,
      name: p.name,
      lat: p.lat!,
      lng: p.lng!,
    }));

    calculateOptimizedRoute(hotelPoint, placePoints).then(setRouteResult);
  }, [trip, selectedDay, places]);

  if (!trip) return null;

  // Calculate total days
  let totalDays = 3; // Default 3 days
  if (trip.start_date && trip.end_date) {
    const diff = Math.ceil(
      (new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff > 0) totalDays = diff + 1;
  }

  // Handlers
  const handleDeleteCurrentTrip = async () => {
    if (!trip) return;
    if (!confirm(`¿Estás seguro de que deseas eliminar el viaje "${trip.title}"? Esta acción borrará todos sus lugares y boletos.`)) {
      return;
    }
    TripStore.deleteTrip(trip.id);
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        await supabase.from('trips').delete().eq('id', trip.id);
      } catch (err) {
        console.warn('Error deleting trip from Supabase', err);
      }
    }
    router.push('/');
  };

  const handlePlacesExtracted = (extractedItems: any[]) => {
    const newPlacesData = extractedItems.map((item, idx) => ({
      name: item.name,
      lat: item.lat ?? null,
      lng: item.lng ?? null,
      is_located: item.is_located ?? false,
      pros: item.pros || [],
      cons: item.cons || [],
      day_number: null, // pool
      visit_order: 0,
    }));

    const added = TripStore.addPlaces(tripId, newPlacesData);
    setPlaces(TripStore.getPlaces(tripId));
  };

  const handleUpdatePlaceDay = (placeId: string, dayNumber: number | null) => {
    TripStore.updatePlace(tripId, placeId, { day_number: dayNumber });
    setPlaces(TripStore.getPlaces(tripId));
  };

  const handleReorderPlaces = (reordered: Place[]) => {
    reordered.forEach((p) => {
      TripStore.updatePlace(tripId, p.id, { visit_order: p.visit_order });
    });
    setPlaces(TripStore.getPlaces(tripId));
  };

  const handleDeletePlace = (placeId: string) => {
    TripStore.deletePlace(tripId, placeId);
    setPlaces(TripStore.getPlaces(tripId));
  };

  const handleVotePlace = (placeId: string) => {
    TripStore.toggleVote(tripId, placeId);
    setPlaces(TripStore.getPlaces(tripId));
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (!pinningPlace) return;

    TripStore.updatePlace(tripId, pinningPlace.id, {
      lat,
      lng,
      is_located: true,
    });
    setPlaces(TripStore.getPlaces(tripId));
    setPinningPlace(null);
  };

  const handleAutoCluster = () => {
    const assignments = clusterPlacesIntoDays(
      places,
      totalDays,
      trip.hotel_lat,
      trip.hotel_lng
    );

    assignments.forEach(({ placeId, dayNumber }) => {
      TripStore.updatePlace(tripId, placeId, { day_number: dayNumber });
    });

    setPlaces(TripStore.getPlaces(tripId));
  };

  const handleOptimizeCurrentDayRoute = async () => {
    if (selectedDay === null || !trip.hotel_lat || !trip.hotel_lng) return;

    setIsOptimizing(true);
    const dayPlaces = places.filter(
      (p) => p.day_number === selectedDay && p.is_located && p.lat != null && p.lng != null
    );

    const hotelPoint = {
      name: trip.hotel_name || 'Hospedaje',
      lat: trip.hotel_lat,
      lng: trip.hotel_lng,
      isHotel: true,
    };

    const placePoints = dayPlaces.map((p) => ({
      id: p.id,
      name: p.name,
      lat: p.lat!,
      lng: p.lng!,
    }));

    const result = await calculateOptimizedRoute(hotelPoint, placePoints);
    setRouteResult(result);

    // Apply the optimal order to the places
    result.waypoints.forEach((wp, orderIdx) => {
      if (wp.id) {
        TripStore.updatePlace(tripId, wp.id, { visit_order: orderIdx });
      }
    });

    setPlaces(TripStore.getPlaces(tripId));
    setIsOptimizing(false);
  };

  // Ticket Handlers
  const handleAddTicket = (ticketData: any) => {
    TripStore.addTicket(tripId, ticketData);
    setTickets(TripStore.getTickets(tripId));
  };

  const handleDeleteTicket = (ticketId: string) => {
    TripStore.deleteTicket(tripId, ticketId);
    setTickets(TripStore.getTickets(tripId));
  };

  const unlocatedPlaces = places.filter((p) => !p.is_located || p.lat == null || p.lng == null);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/trips/${trip.id}/join?code=${trip.invite_code}`
    : '';

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Workspace Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition mb-1"
            >
              <ArrowLeft size={13} /> Mis Viajes
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {trip.title}
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                {trip.destination_city}, {trip.destination_country}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
              {trip.start_date && (
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-blue-500" />
                  <span>
                    {trip.start_date} al {trip.end_date || 'Fin'} ({totalDays} días)
                  </span>
                </div>
              )}
              {trip.hotel_name && (
                <div className="flex items-center gap-1.5">
                  <Building size={13} className="text-emerald-500" />
                  <span>Hotel: {trip.hotel_name}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowShareModal(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 text-xs font-bold rounded-xl shadow-sm transition"
            >
              <Share2 size={14} /> Invitar Amigos
            </button>
            <button
              onClick={handleDeleteCurrentTrip}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-xl border border-slate-200 dark:border-slate-800 transition"
              title="Eliminar viaje"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* YouTube Extractor Component */}
      <YouTubeExtractorBar
        destinationCity={trip.destination_city}
        onPlacesExtracted={handlePlacesExtracted}
      />

      {/* Unlocated Places Drawer (if any) */}
      <UnlocatedPlacesDrawer
        unlocatedPlaces={unlocatedPlaces}
        onStartPinning={(place) => setPinningPlace(place)}
        onDeletePlace={handleDeletePlace}
        activePinningPlaceId={pinningPlace?.id ?? null}
        onCancelPinning={() => setPinningPlace(null)}
      />

      {/* Grid: Interactive OpenStreetMap & Itinerary Planner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Map Column (7 cols on desktop) */}
        <div className="lg:col-span-7 h-[450px] sm:h-[550px] lg:sticky lg:top-20">
          <TripMapWrapper
            hotel={
              trip.hotel_lat && trip.hotel_lng
                ? { name: trip.hotel_name || 'Hospedaje', lat: trip.hotel_lat, lng: trip.hotel_lng }
                : undefined
            }
            places={places}
            selectedDay={selectedDay}
            routeCoordinates={routeResult?.polylineCoordinates}
            onVotePlace={handleVotePlace}
            onDeletePlace={handleDeletePlace}
            onMapClick={handleMapClick}
            isPinningMode={Boolean(pinningPlace)}
          />
        </div>

        {/* Itinerary Column (5 cols on desktop) */}
        <div className="lg:col-span-5 space-y-6">
          <DayPlanner
            places={places}
            totalDays={totalDays}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            onUpdatePlaceDay={handleUpdatePlaceDay}
            onReorderPlaces={handleReorderPlaces}
            onDeletePlace={handleDeletePlace}
            onAutoCluster={handleAutoCluster}
            onOptimizeCurrentDayRoute={handleOptimizeCurrentDayRoute}
            currentRouteResult={routeResult}
            isOptimizing={isOptimizing}
            hotelName={trip.hotel_name}
          />
        </div>
      </div>

      {/* Ticket Wallet ("Llave en mano") Offline Section */}
      <TicketWallet
        tripId={trip.id}
        tickets={tickets}
        places={places}
        onAddTicket={handleAddTicket}
        onDeleteTicket={handleDeleteTicket}
      />

      {/* Invite Friends Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/60 text-blue-600 rounded-xl">
                <Users size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Invitar a Amigos al Viaje</h3>
                <p className="text-xs text-slate-500">Tus amigos podrán proponer lugares y votar</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Comparte este enlace directo. Al abrirlo, tus amigos iniciarán sesión con su cuenta y tendrán acceso como colaboradores:
            </p>

            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full text-xs bg-transparent border-0 text-slate-700 dark:text-slate-300 focus:outline-none select-all"
              />
              <button
                onClick={copyShareLink}
                className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1 shrink-0 transition"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
