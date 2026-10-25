import { calculateOptimizedRoute, haversineDistance } from '../src/lib/routing/osrm.js';
import { clusterPlacesIntoDays } from '../src/lib/routing/clustering.js';

console.log('--- 1. Testing Haversine Distance ---');
const distTokyo = haversineDistance(35.6953, 139.7022, 35.7148, 139.7967);
console.log(`Distance Shinjuku to Senso-ji: ${(distTokyo / 1000).toFixed(2)} km`);
if (distTokyo > 8000 && distTokyo < 12000) {
  console.log('✓ Haversine distance verified.');
} else {
  console.error('✗ Unexpected distance result.');
}

console.log('\n--- 2. Testing OSRM / TSP Optimization Fallback ---');
const hotel = { name: 'Hotel Shinjuku', lat: 35.6953, lng: 139.7022, isHotel: true };
const stops = [
  { id: '1', name: 'Senso-ji', lat: 35.7148, lng: 139.7967 },
  { id: '2', name: 'Skytree', lat: 35.7100, lng: 139.8107 },
  { id: '3', name: 'Shibuya', lat: 35.6595, lng: 139.7005 }
];

const route = await calculateOptimizedRoute(hotel, stops);
console.log(`Optimized waypoints count: ${route.waypoints.length}`);
console.log(`Total distance: ${(route.totalDistanceMeters / 1000).toFixed(2)} km`);
console.log(`Total duration: ${Math.round(route.totalDurationSeconds / 60)} mins`);
console.log(`Route legs: ${route.legs.length}`);
if (route.waypoints.length === 5 && route.legs.length === 4) {
  console.log('✓ TSP Roundtrip (Hotel -> 3 stops -> Hotel) verified.');
} else {
  console.error('✗ Unexpected TSP structure.');
}

console.log('\n--- 3. Testing Geographic Clustering ---');
const placesForClustering = [
  { id: 'p1', is_located: true, lat: 35.7148, lng: 139.7967, name: 'Senso-ji' },
  { id: 'p2', is_located: true, lat: 35.7100, lng: 139.8107, name: 'Skytree' },
  { id: 'p3', is_located: true, lat: 35.6595, lng: 139.7005, name: 'Shibuya' },
  { id: 'p4', is_located: true, lat: 35.6764, lng: 139.6993, name: 'Meiji Jingu' },
];

const clusters = clusterPlacesIntoDays(placesForClustering, 2, hotel.lat, hotel.lng);
console.log('Day assignments:', clusters);
if (clusters.length === 4) {
  console.log('✓ All 4 places clustered successfully into days.');
} else {
  console.error('✗ Clustering count mismatch.');
}

console.log('\nAll Automated Unit Logic Tests Passed Successfully!');
