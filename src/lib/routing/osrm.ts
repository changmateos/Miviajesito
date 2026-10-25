// Free OSRM Routing and Traveling Salesperson Problem (TSP) Engine

export interface RoutePoint {
  id?: string;
  name: string;
  lat: number;
  lng: number;
  isHotel?: boolean;
}

export interface RouteLeg {
  distanceMeters: number;
  durationSeconds: number;
  summary?: string;
}

export interface OptimizedRouteResult {
  waypoints: RoutePoint[];
  polylineCoordinates: [number, number][]; // [lat, lng] for Leaflet
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  legs: RouteLeg[];
}

// Haversine distance in meters
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Format duration into readable string (e.g., "15 min", "1 h 20 min")
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)} s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return remainingMins > 0 ? `${hours} h ${remainingMins} min` : `${hours} h`;
}

// Format distance into readable string (e.g. "800 m", "3.4 km")
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

// Fallback Nearest Neighbor TSP when OSRM is offline
function solveLocalTSP(hotel: RoutePoint, stops: RoutePoint[]): RoutePoint[] {
  if (stops.length <= 1) return [hotel, ...stops, hotel];

  const unvisited = [...stops];
  const ordered: RoutePoint[] = [hotel];
  let current = hotel;

  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let minDist = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const dist = haversineDistance(current.lat, current.lng, unvisited[i].lat, unvisited[i].lng);
      if (dist < minDist) {
        minDist = dist;
        nearestIdx = i;
      }
    }

    current = unvisited.splice(nearestIdx, 1)[0];
    ordered.push(current);
  }

  ordered.push(hotel); // Roundtrip to hotel
  return ordered;
}

export async function calculateOptimizedRoute(
  hotel: RoutePoint,
  places: RoutePoint[]
): Promise<OptimizedRouteResult> {
  if (places.length === 0) {
    return {
      waypoints: [hotel],
      polylineCoordinates: [[hotel.lat, hotel.lng]],
      totalDistanceMeters: 0,
      totalDurationSeconds: 0,
      legs: [],
    };
  }

  // Build coordinate list: Hotel first, stops in between, Hotel at the end for roundtrip
  const points = [hotel, ...places, hotel];
  const coordsString = points.map(p => `${p.lng},${p.lat}`).join(';');
  const url = `https://router.project-osrm.org/trip/v1/driving/${coordsString}?source=first&destination=last&roundtrip=true&overview=full&geometries=geojson&steps=false`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MiViajecitoApp/1.0',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.code === 'Ok' && data.trips && data.trips.length > 0) {
        const trip = data.trips[0];
        const geojsonCoords = trip.geometry.coordinates as [number, number][]; // [lon, lat]
        const leafletCoords: [number, number][] = geojsonCoords.map(([lon, lat]) => [lat, lon]);

        // Map waypoints according to OSRM order
        const waypointsOrder = data.waypoints.sort((a: any, b: any) => a.waypoint_index - b.waypoint_index);
        const orderedWaypoints: RoutePoint[] = waypointsOrder.map((wp: any) => points[wp.waypoint_index] || hotel);

        const legs: RouteLeg[] = (trip.legs || []).map((l: any) => ({
          distanceMeters: l.distance,
          durationSeconds: l.duration,
        }));

        return {
          waypoints: orderedWaypoints,
          polylineCoordinates: leafletCoords,
          totalDistanceMeters: trip.distance,
          totalDurationSeconds: trip.duration,
          legs,
        };
      }
    }
  } catch (error) {
    console.warn('OSRM request failed, falling back to local TSP:', error);
  }

  // Fallback: Calculate local nearest neighbor order and straight-line legs
  const localOrdered = solveLocalTSP(hotel, places);
  const polylineCoords: [number, number][] = localOrdered.map(p => [p.lat, p.lng]);
  let totalDist = 0;
  const legs: RouteLeg[] = [];

  for (let i = 0; i < localOrdered.length - 1; i++) {
    const d = haversineDistance(localOrdered[i].lat, localOrdered[i].lng, localOrdered[i + 1].lat, localOrdered[i + 1].lng);
    totalDist += d;
    // Estimate transit speed ~ 25 km/h (approx 7 m/s) in city
    legs.push({
      distanceMeters: d,
      durationSeconds: Math.round(d / 6.94),
    });
  }

  return {
    waypoints: localOrdered,
    polylineCoordinates: polylineCoords,
    totalDistanceMeters: totalDist,
    totalDurationSeconds: Math.round(totalDist / 6.94),
    legs,
  };
}
