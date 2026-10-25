'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Place } from '@/types';
import { ThumbsUp, Trash2, MapPin, Building, ExternalLink } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface TripMapProps {
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

export default function TripMap({
  hotel,
  places,
  selectedDay,
  routeCoordinates = [],
  onPlaceClick,
  onVotePlace,
  onDeletePlace,
  onMapClick,
  isPinningMode = false,
}: TripMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const [L, setL] = useState<any>(null);

  // Dynamically load Leaflet on client
  useEffect(() => {
    import('leaflet').then((leafletModule) => {
      setL(leafletModule.default || leafletModule);
    });
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!L || !mapContainerRef.current || mapInstanceRef.current) return;

    // Default center: hotel, first place, or Tokyo
    const defaultLat = hotel?.lat ?? places.find(p => p.lat)?.lat ?? 35.6895;
    const defaultLng = hotel?.lng ?? places.find(p => p.lng)?.lng ?? 139.6917;

    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);

    map.on('click', (e: any) => {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [L]);

  // Handle map click events in pinning mode
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const container = mapContainerRef.current;
    if (container) {
      container.style.cursor = isPinningMode ? 'crosshair' : 'grab';
    }
  }, [isPinningMode]);

  // Update Markers and Routes
  useEffect(() => {
    if (!L || !mapInstanceRef.current || !markersLayerRef.current || !routeLayerRef.current) return;

    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const routeLayer = routeLayerRef.current;

    markersLayer.clearLayers();
    routeLayer.clearLayers();

    const bounds: any[] = [];

    // 1. Hotel Marker (Special Blue Pin)
    if (hotel?.lat && hotel?.lng) {
      const hotelIcon = L.divIcon({
        className: 'custom-hotel-marker',
        html: `
          <div style="background-color: #2563eb; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2px solid white;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/></svg>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const hotelMarker = L.marker([hotel.lat, hotel.lng], { icon: hotelIcon }).addTo(markersLayer);
      hotelMarker.bindPopup(`
        <div style="font-family: sans-serif; padding: 4px;">
          <div style="font-size: 11px; font-weight: bold; color: #2563eb; text-transform: uppercase;">Tu Hospedaje</div>
          <div style="font-size: 14px; font-weight: bold; margin-top: 2px;">${hotel.name}</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Punto base de salida y retorno</div>
        </div>
      `);
      bounds.push([hotel.lat, hotel.lng]);
    }

    // 2. Filter places by selected day if specified
    const activePlaces = places.filter(p => {
      if (!p.is_located || p.lat == null || p.lng == null) return false;
      if (selectedDay !== undefined && selectedDay !== null) {
        return p.day_number === selectedDay;
      }
      return true;
    });

    // 3. Render Place Markers
    activePlaces.forEach((place, index) => {
      if (place.lat == null || place.lng == null) return;

      const isAssigned = place.day_number != null;
      const bgColor = isAssigned ? '#10b981' : '#f59e0b'; // Green if assigned, Amber if in pool

      const placeIcon = L.divIcon({
        className: 'custom-place-marker',
        html: `
          <div style="background-color: ${bgColor}; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 13px; box-shadow: 0 4px 10px rgba(0,0,0,0.25); border: 2px solid white; cursor: pointer;">
            ${place.visit_order > 0 ? place.visit_order : index + 1}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([place.lat, place.lng], { icon: placeIcon }).addTo(markersLayer);

      const prosHtml = place.pros?.length
        ? `<div style="margin-top: 6px;">
            <div style="font-size: 11px; font-weight: bold; color: #16a34a;">Pros:</div>
            <ul style="margin: 2px 0 0 16px; padding: 0; font-size: 11px; color: #334155;">
              ${place.pros.map(pro => `<li>${pro}</li>`).join('')}
            </ul>
           </div>`
        : '';

      const consHtml = place.cons?.length
        ? `<div style="margin-top: 6px;">
            <div style="font-size: 11px; font-weight: bold; color: #dc2626;">Contras / Ojo con:</div>
            <ul style="margin: 2px 0 0 16px; padding: 0; font-size: 11px; color: #334155;">
              ${place.cons.map(con => `<li>${con}</li>`).join('')}
            </ul>
           </div>`
        : '';

      const dayBadge = place.day_number
        ? `<span style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">Día ${place.day_number}</span>`
        : `<span style="background: #fef3c7; color: #b45309; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">Sin asignar</span>`;

      const popupHtml = `
        <div style="font-family: sans-serif; min-width: 200px; max-width: 260px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            ${dayBadge}
            <span style="font-size: 11px; color: #64748b;">👍 ${place.votes_count || 0} votos</span>
          </div>
          <div style="font-size: 14px; font-weight: bold; color: #0f172a; line-height: 1.2;">${place.name}</div>
          ${prosHtml}
          ${consHtml}
        </div>
      `;

      marker.bindPopup(popupHtml);
      bounds.push([place.lat, place.lng]);
    });

    // 4. Draw Polylines for Route
    if (routeCoordinates && routeCoordinates.length > 1) {
      L.polyline(routeCoordinates, {
        color: '#2563eb',
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 8',
      }).addTo(routeLayer);
    }

    // Fit bounds if we have points
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [L, hotel, places, selectedDay, routeCoordinates]);

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
      {isPinningMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
          <MapPin size={14} /> Haz clic en el mapa donde quieras ubicar este lugar
        </div>
      )}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
