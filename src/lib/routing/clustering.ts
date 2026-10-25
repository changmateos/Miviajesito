import { Place } from '@/types';
import { haversineDistance } from './osrm';

// Cluster places into N days by proximity
export function clusterPlacesIntoDays(
  places: Place[],
  totalDays: number,
  hotelLat?: number,
  hotelLng?: number
): { placeId: string; dayNumber: number }[] {
  const locatedPlaces = places.filter(p => p.is_located && p.lat != null && p.lng != null);
  if (locatedPlaces.length === 0 || totalDays <= 0) return [];

  // If we have fewer places than days, assign 1 place per day
  if (locatedPlaces.length <= totalDays) {
    return locatedPlaces.map((p, idx) => ({
      placeId: p.id,
      dayNumber: (idx % totalDays) + 1,
    }));
  }

  // Base coordinates (Hotel or center of all places)
  const baseLat = hotelLat ?? locatedPlaces.reduce((sum, p) => sum + p.lat!, 0) / locatedPlaces.length;
  const baseLng = hotelLng ?? locatedPlaces.reduce((sum, p) => sum + p.lng!, 0) / locatedPlaces.length;

  // Calculate polar angle from base to sort by direction
  const withAngle = locatedPlaces.map(p => {
    const dLat = p.lat! - baseLat;
    const dLng = p.lng! - baseLng;
    const angle = Math.atan2(dLat, dLng); // -PI to PI
    const dist = haversineDistance(baseLat, baseLng, p.lat!, p.lng!);
    return { place: p, angle, dist };
  });

  // Sort by geographic angle (sweep around the hotel)
  withAngle.sort((a, b) => a.angle - b.angle);

  // Divide into N day buckets
  const bucketSize = Math.ceil(withAngle.length / totalDays);
  const assignments: { placeId: string; dayNumber: number }[] = [];

  withAngle.forEach((item, index) => {
    const day = Math.min(Math.floor(index / bucketSize) + 1, totalDays);
    assignments.push({
      placeId: item.place.id,
      dayNumber: day,
    });
  });

  return assignments;
}
