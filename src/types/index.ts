export type UserRole = 'organizer' | 'collaborator';

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  created_at?: string;
}

export interface Trip {
  id: string;
  title: string;
  destination_city: string;
  destination_country: string;
  start_date?: string;
  end_date?: string;
  hotel_name?: string;
  hotel_lat?: number;
  hotel_lng?: number;
  invite_code?: string;
  created_by: string;
  created_at: string;
}

export interface TripMember {
  id: string;
  trip_id: string;
  user_id: string;
  role: UserRole;
  profile?: Profile;
  joined_at: string;
}

export interface Place {
  id: string;
  trip_id: string;
  name: string;
  lat: number | null;
  lng: number | null;
  is_located: boolean;
  pros: string[];
  cons: string[];
  source_video_url?: string;
  day_number?: number | null;
  visit_order: number;
  created_by?: string;
  created_at: string;
  votes_count?: number;
  has_voted?: boolean;
}

export interface Ticket {
  id: string;
  trip_id: string;
  place_id?: string | null;
  place_name?: string;
  user_id: string;
  title: string;
  file_url: string;
  file_type: 'pdf' | 'image';
  is_group: boolean;
  created_at: string;
  local_cached?: boolean;
}

export interface ExtractedPlaceItem {
  name: string;
  pros: string[];
  cons: string[];
  lat?: number | null;
  lng?: number | null;
  is_located?: boolean;
}
