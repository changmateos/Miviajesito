import { Trip, Place, Ticket, TripMember } from '@/types';
import { isSupabaseConfigured, createClient } from '../supabase/client';

const DEMO_TRIP_ID = 'trip-tokio-demo';

const INITIAL_DEMO_TRIP: Trip = {
  id: DEMO_TRIP_ID,
  title: 'Viaje a Tokio con Amigos',
  destination_city: 'Tokio',
  destination_country: 'Japón',
  start_date: '2026-11-10',
  end_date: '2026-11-15',
  hotel_name: 'Hotel Gracery Shinjuku (Godzilla)',
  hotel_lat: 35.6953,
  hotel_lng: 139.7022,
  invite_code: 'tokyo26',
  created_by: 'user-me',
  created_at: new Date().toISOString(),
};

const INITIAL_DEMO_PLACES: Place[] = [
  {
    id: 'place-1',
    trip_id: DEMO_TRIP_ID,
    name: 'Templo Senso-ji',
    lat: 35.7148,
    lng: 139.7967,
    is_located: true,
    pros: ['Entrada completamente gratuita', 'Atmósfera tradicional increíble', 'Mercadillo Nakamise con snacks deliciosos'],
    cons: ['Muy abarrotado a partir de las 10:30 AM', 'Cierran tiendas temprano al atardecer'],
    source_video_url: 'https://www.youtube.com/watch?v=demo',
    day_number: 1,
    visit_order: 1,
    created_at: new Date().toISOString(),
    votes_count: 3,
    has_voted: true,
  },
  {
    id: 'place-2',
    trip_id: DEMO_TRIP_ID,
    name: 'Tokyo Skytree',
    lat: 35.7100,
    lng: 139.8107,
    is_located: true,
    pros: ['Las mejores vistas panorámicas de toda la ciudad', 'Gran centro comercial en la base'],
    cons: ['Entrada cara', 'Filas de espera para los elevadores en días despejados'],
    source_video_url: 'https://www.youtube.com/watch?v=demo',
    day_number: 1,
    visit_order: 2,
    created_at: new Date().toISOString(),
    votes_count: 2,
    has_voted: false,
  },
  {
    id: 'place-3',
    trip_id: DEMO_TRIP_ID,
    name: 'Cruce de Shibuya y Estatua de Hachiko',
    lat: 35.6595,
    lng: 139.7005,
    is_located: true,
    pros: ['Experiencia icónica e imperdible', 'Muchos restaurantes y tiendas alrededor', 'Gratis'],
    cons: ['Muchísima multitud', 'Fácil desorientarse con el grupo'],
    source_video_url: 'https://www.youtube.com/watch?v=demo',
    day_number: 2,
    visit_order: 1,
    created_at: new Date().toISOString(),
    votes_count: 4,
    has_voted: true,
  },
  {
    id: 'place-4',
    trip_id: DEMO_TRIP_ID,
    name: 'Santuario Meiji Jingu',
    lat: 35.6764,
    lng: 139.6993,
    is_located: true,
    pros: ['Bosque zen muy relajante y fresco', 'Entrada gratuita', 'Paz total en medio de la ciudad'],
    cons: ['Hay que caminar bastante por el sendero de grava', 'Prohibido comer adentro'],
    source_video_url: 'https://www.youtube.com/watch?v=demo',
    day_number: 2,
    visit_order: 2,
    created_at: new Date().toISOString(),
    votes_count: 3,
    has_voted: false,
  },
  {
    id: 'place-5',
    trip_id: DEMO_TRIP_ID,
    name: 'Restaurante Omoide Yokocho (Callejón del Recuerdo)',
    lat: 35.6931,
    lng: 139.6997,
    is_located: true,
    pros: ['Brochetas yakitori auténticas y baratas', 'Ambiente nocturno retro increíble'],
    cons: ['Locales diminutos para solo 4-6 personas', 'Mucho humo y solo pago en efectivo'],
    source_video_url: 'https://www.youtube.com/watch?v=demo',
    day_number: null, // In pool
    visit_order: 0,
    created_at: new Date().toISOString(),
    votes_count: 1,
    has_voted: false,
  },
  {
    id: 'place-6',
    trip_id: DEMO_TRIP_ID,
    name: 'Terraza secreta con vistas a Akihabara',
    lat: null,
    lng: null,
    is_located: false, // In "Por ubicar" drawer!
    pros: ['Vista única del barrio otaku', 'Poca gente'],
    cons: ['El video no dio la dirección exacta, está dentro de un edificio comercial'],
    source_video_url: 'https://www.youtube.com/watch?v=demo',
    day_number: null,
    visit_order: 0,
    created_at: new Date().toISOString(),
    votes_count: 2,
    has_voted: false,
  },
];

const INITIAL_DEMO_TICKETS: Ticket[] = [
  {
    id: 'ticket-1',
    trip_id: DEMO_TRIP_ID,
    place_id: 'place-2',
    place_name: 'Tokyo Skytree',
    user_id: 'user-me',
    title: 'Entrada Skytree Tembo Deck (Combo Grupo 4 pers)',
    file_url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop',
    file_type: 'image',
    is_group: true,
    created_at: new Date().toISOString(),
    local_cached: true,
  },
  {
    id: 'ticket-2',
    trip_id: DEMO_TRIP_ID,
    place_id: null,
    place_name: 'Narita Express Train',
    user_id: 'user-me',
    title: 'Pase de Tren Narita Express Ida y Vuelta',
    file_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop',
    file_type: 'image',
    is_group: false,
    created_at: new Date().toISOString(),
    local_cached: true,
  },
];

export class TripStore {
  private static STORAGE_PREFIX = 'miviajecito_';

  private static getStorage<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const data = localStorage.getItem(this.STORAGE_PREFIX + key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private static setStorage<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.STORAGE_PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.warn('Storage limit reached or blocked', e);
    }
  }

  static getTrips(): Trip[] {
    const defaultList = [INITIAL_DEMO_TRIP];
    return this.getStorage<Trip[]>('trips', defaultList);
  }

  static getTrip(id: string): Trip | null {
    const trips = this.getTrips();
    return trips.find(t => t.id === id) || (id === DEMO_TRIP_ID ? INITIAL_DEMO_TRIP : null);
  }

  static createTrip(data: Omit<Trip, 'id' | 'created_at' | 'invite_code'>): Trip {
    const trips = this.getTrips();
    const newTrip: Trip = {
      ...data,
      id: 'trip_' + Math.random().toString(36).substring(2, 9),
      invite_code: Math.random().toString(36).substring(2, 8),
      created_at: new Date().toISOString(),
    };
    trips.unshift(newTrip);
    this.setStorage('trips', trips);
    return newTrip;
  }

  static updateTrip(id: string, updates: Partial<Trip>): Trip | null {
    const trips = this.getTrips();
    const idx = trips.findIndex(t => t.id === id);
    if (idx === -1) return null;
    trips[idx] = { ...trips[idx], ...updates };
    this.setStorage('trips', trips);
    return trips[idx];
  }

  static deleteTrip(id: string): boolean {
    const trips = this.getTrips();
    const filtered = trips.filter(t => t.id !== id);
    this.setStorage('trips', filtered);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(this.STORAGE_PREFIX + 'places_' + id);
        localStorage.removeItem(this.STORAGE_PREFIX + 'tickets_' + id);
      } catch (e) {
        console.warn('Error cleaning trip storage', e);
      }
    }
    return true;
  }

  static getPlaces(tripId: string): Place[] {
    const allPlaces = this.getStorage<Place[]>('places_' + tripId, tripId === DEMO_TRIP_ID ? INITIAL_DEMO_PLACES : []);
    return allPlaces;
  }

  static addPlaces(tripId: string, newPlacesData: Omit<Place, 'id' | 'trip_id' | 'created_at'>[]): Place[] {
    const current = this.getPlaces(tripId);
    const created: Place[] = newPlacesData.map(p => ({
      ...p,
      id: 'place_' + Math.random().toString(36).substring(2, 9),
      trip_id: tripId,
      created_at: new Date().toISOString(),
      votes_count: 0,
      has_voted: false,
    }));
    const updated = [...current, ...created];
    this.setStorage('places_' + tripId, updated);
    return created;
  }

  static updatePlace(tripId: string, placeId: string, updates: Partial<Place>): Place | null {
    const places = this.getPlaces(tripId);
    const idx = places.findIndex(p => p.id === placeId);
    if (idx === -1) return null;
    places[idx] = { ...places[idx], ...updates };
    this.setStorage('places_' + tripId, places);
    return places[idx];
  }

  static deletePlace(tripId: string, placeId: string): boolean {
    const places = this.getPlaces(tripId);
    const filtered = places.filter(p => p.id !== placeId);
    this.setStorage('places_' + tripId, filtered);
    return true;
  }

  static toggleVote(tripId: string, placeId: string): Place | null {
    const places = this.getPlaces(tripId);
    const p = places.find(item => item.id === placeId);
    if (!p) return null;
    p.has_voted = !p.has_voted;
    p.votes_count = (p.votes_count || 0) + (p.has_voted ? 1 : -1);
    this.setStorage('places_' + tripId, places);
    return p;
  }

  static getTickets(tripId: string): Ticket[] {
    return this.getStorage<Ticket[]>('tickets_' + tripId, tripId === DEMO_TRIP_ID ? INITIAL_DEMO_TICKETS : []);
  }

  static addTicket(tripId: string, data: Omit<Ticket, 'id' | 'trip_id' | 'created_at'>): Ticket {
    const current = this.getTickets(tripId);
    const newTicket: Ticket = {
      ...data,
      id: 'ticket_' + Math.random().toString(36).substring(2, 9),
      trip_id: tripId,
      created_at: new Date().toISOString(),
      local_cached: true,
    };
    current.unshift(newTicket);
    this.setStorage('tickets_' + tripId, current);
    return newTicket;
  }

  static deleteTicket(tripId: string, ticketId: string): boolean {
    const tickets = this.getTickets(tripId);
    const filtered = tickets.filter(t => t.id !== ticketId);
    this.setStorage('tickets_' + tripId, filtered);
    return true;
  }
}
