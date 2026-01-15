/**
 * DATA MODELS - TransportBF
 * Modèles de données centralisés pour l'application
 * Structure complète pour frontend et backend
 */

// ============================================
// TYPES & INTERFACES DE BASE
// ============================================

export type TicketStatus = 'AVAILABLE' | 'HOLD' | 'PAID' | 'EMBARKED' | 'CANCELLED';
export type SeatStatus = 'available' | 'hold' | 'paid' | 'offline_reserved' | 'selected';
export type TripType = 'ALLER_SIMPLE' | 'ALLER_RETOUR';
export type UserRole = 'USER' | 'OPERATOR_ADMIN' | 'SUPER_ADMIN';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

// ============================================
// FONCTIONS UTILITAIRES - VALIDATIONS
// ============================================

/**
 * 🔄 RÈGLE CRITIQUE: Disponibilité des trajets
 * 
 * Pour un trajet avec plusieurs segments (ex: Ouaga → Koudougou → Bobo):
 * - Un passager qui voyage de Ouaga à Bobo DOIT EMPRUNTER TOUS les segments
 * - La disponibilité réelle = MINIMUM des availableSeats de tous les segments
 * 
 * FORMULE: trip.available_seats = Math.min(...trip.segments.map(s => s.available_seats))
 * 
 * EXEMPLE:
 * Trip: Ouaga → Bobo (365 km)
 * Segment 1: Ouaga → Koudougou, available_seats: 12
 * Segment 2: Koudougou → Bobo, available_seats: 18
 * → RÉSULTAT: trip.available_seats = 12 (le minimum)
 * → RAISON: Seuls 12 sièges sont libres sur le PREMIER segment
 */
export function getAvailableSeatsForTrip(trip: { segments: { available_seats: number }[] }): number {
  if (!trip.segments || trip.segments.length === 0) return 0;
  return Math.min(...trip.segments.map(s => s.available_seats));
}

/**
 * Valide que la capacité d'un trajet respecte la règle du minimum
 * @throws Error si incohérence détectée
 */
export function validateTripCapacity(trip: Trip): boolean {
  const calculatedMin = getAvailableSeatsForTrip(trip);
  const declared = trip.available_seats;
  
  if (calculatedMin !== declared) {
    console.error(
      `❌ INCOHÉRENCE CAPACITÉ: Trip ${trip.trip_id}\n` +
      `   Déclaré: ${declared} places\n` +
      `   Réel (min des segments): ${calculatedMin} places\n` +
      `   CORRECTION: trip.available_seats devrait être ${calculatedMin}`
    );
    return false;
  }
  return true;
}
export type PaymentMethod = 'ORANGE_MONEY' | 'MOOV_MONEY' | 'CARTE_BANCAIRE' | 'CASH';
export type StoryType =
  | 'PROMO'
  | 'PROMOTIONS'
  | 'NEW'
  | 'NEW_ROUTE'
  | 'DESTINATION'
  | 'TIPS'
  | 'PARTNERS'
  | 'ANNOUNCEMENT'
  | 'ACTUALITE'
  | 'ALERTE'
  | 'EVENT'
  | 'ACHIEVEMENT';
export type AdPlacement = 'SEARCH_RESULTS' | 'TICKET_LIST' | 'OPERATOR_PROFILE' | 'HOME_FEED';
export type DeviceType = 'MOBILE_APP' | 'MOBILE_WEB' | 'DESKTOP_WEB' | 'KIOSK';

// Minimal operator policy model so frontend can safely type operator policies
export type PolicyType = 'CANCELLATION' | 'TRANSFER' | 'BAGGAGE' | 'DELAY' | 'OTHER';

export interface OperatorPolicy {
  policy_id: string;
  operator_id?: string;
  title: string;
  description?: string;
  type?: PolicyType;
  created_at?: string;
  updated_at?: string;
}

// ============================================
// INTERFACES UTILISATEUR & AUTH
// ============================================

export interface User {
  user_id: string;
  email: string;
  phone_number: string;
  full_name: string;
  role: UserRole;
  preferred_language?: string;
  profile_image_url?: string;
  created_at: string;
  updated_at: string;
  last_login_at: string;
  is_verified: boolean;
  is_active: boolean;
  device_tokens?: string[];
  push_enabled: boolean;
}

export interface UserSession {
  session_id: string;
  user_id: string;
  device_type: DeviceType;
  device_id?: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  expires_at: string;
  last_active_at: string;
}

// ============================================
// INTERFACES TRANSPORT & VOYAGES
// ============================================

export interface OperatorFull {
  operator_id: string;
  name: string;
  operator_logo: string; // emoji par défaut (ex: ✈️)
  logo_url?: string; // URL de l'image uploadée par l'opérateur dans sa config
  description?: string;
  phone_number?: string;
  email?: string;
  website_url?: string;
  founded_year?: number;
  fleet_size?: number;
  total_trips?: number;
  amenities?: string[];
  policies?: OperatorPolicy[];
  services?: OperatorService[];  // Available services offered by this operator
  baggage_price?: number;  // Default baggage price configured by operator (once)
  // Optional fields for operator primary station and hours (frontend-friendly)
  opening_hours?: string;
  primary_station_id?: string;
  primary_station_name?: string;
  primary_station_city?: string;
  rating: number;
  total_reviews: number;
  is_verified: boolean;
  is_active: boolean;
  has_unread_stories?: boolean;
  stories_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Station {
  id: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  address?: string;
  operator_id?: string;  // Si géré par un opérateur spécifique
  amenities: string[];
  opening_hours?: string;
  contact_phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  vehicle_id: string;
  operator_id: string;
  type: string;
  registration_number: string;
  seat_map_config: SeatMapConfig;
  amenities: string[];
  accessibility_features: string[];
  last_maintenance_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SeatMapConfig {
  rows: number;
  seatsPerRow: number;
  aisleAfter: number;
  totalSeats: number;
  layout: string;  // JSON décrivant la disposition exacte
}

export interface Trip {
  trip_id: string;
  operator_id: string;
  operator_name: string;
  operator_logo?: string;
  vehicle_id: string;
  vehicle_type: string;
  departure_time: string;
  arrival_time: string;
  duration_minutes: number;
  base_price: number;
  currency: string;
  from_stop_id: string;
  to_stop_id: string;
  from_stop_name: string;
  to_stop_name: string;
  segments: Segment[];
  amenities: string[];
  has_live_tracking: boolean;
  available_seats: number;
  total_seats: number;
  is_cancelled: boolean;
  cancellation_reason?: string;
  // PROMOTION FIELDS - Backend sends these, frontend displays strikethrough price + new price
  promotion?: Promotion; // Active promotion for this trip (if any)
  promoted_price?: number; // Discounted price (if promotion active)
  discount_percentage?: number; // For UI display: (base_price - promoted_price) / base_price * 100
  created_at: string;
  updated_at: string;
}

export interface Segment {
  segment_id: string;
  trip_id: string;
  from_stop_id: string;
  to_stop_id: string;
  from_stop_name: string;
  to_stop_name: string;
  departure_time: string;
  arrival_time: string;
  distance_km: number;
  available_seats: number;
  total_seats: number;
  sequence_number: number;
  base_price: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// PROMOTIONS & DISCOUNTS
// ============================================

export interface Promotion {
  promotion_id: string;
  operator_id: string;
  trip_id?: string; // If null, promotion applies to all operator trips
  promotion_name: string;
  description?: string;
  discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT'; // PERCENTAGE = 20% off, FIXED_AMOUNT = -2000 FCFA
  discount_value: number; // 20 for 20%, or 2000 for 2000 FCFA
  start_date: string; // ISO 8601
  end_date: string; // ISO 8601
  max_uses?: number; // Total uses allowed
  uses_count?: number; // Current usage count
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// SERVICES & PRICING
// ============================================

export interface OperatorService {
  service_id: string;
  operator_id: string;
  service_name: string;
  service_type: 'BAGGAGE' | 'FOOD' | 'COMFORT' | 'ENTERTAINMENT' | 'OTHER';
  description?: string;
  price: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// INTERFACES BILLETS & RÉSERVATIONS
// ============================================

export interface Ticket {
  ticket_id: string;
  bundle_id?: string;
  trip_id: string;
  booking_id: string;
  operator_id: string;
  operator_name: string;
  from_stop_id: string;
  to_stop_id: string;
  from_stop_name: string;
  to_stop_name: string;
  departure_time: string;
  arrival_time: string;
  passenger_name: string;
  passenger_phone?: string;
  passenger_email?: string;
  seat_number?: string;
  status: TicketStatus;
  qr_code: string;
  alphanumeric_code: string;
  price: number;
  currency: string;
  payment_method: PaymentMethod;
  payment_id: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  holder_downloaded: boolean;
  holder_downloaded_at?: string;
  holder_presented: boolean;
  holder_presented_at?: string;
  last_sync_at?: string;
  transfer_token?: string;
  transfer_history?: TicketTransfer[];
  can_cancel: boolean;
  can_transfer: boolean;
  cancellation_reason?: string;
  refund_status?: 'PENDING' | 'COMPLETED' | 'REJECTED';
  metadata?: Record<string, any>;
}

export interface TicketTransfer {
  transfer_id: string;
  ticket_id: string;
  from_user_id: string;
  to_user_id: string;
  transfer_time: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  expires_at: string;
}

export interface Booking {
  booking_id: string;
  user_id: string;
  trip_id: string;
  operator_id: string;
  status: 'HOLD' | 'CONFIRMED' | 'CANCELLED';
  hold_expires_at?: string;
  total_amount: number;
  currency: string;
  passengers: BookingPassenger[];
  selected_seats: string[];
  payment_id?: string;
  payment_status?: PaymentStatus;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface BookingPassenger {
  passenger_id: string;
  booking_id: string;
  full_name: string;
  phone_number?: string;
  email?: string;
  seat_number?: string;
  ticket_id?: string;
  is_primary: boolean;
}

export interface Payment {
  payment_id: string;
  booking_id: string;
  user_id: string;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  provider_reference?: string;
  provider_metadata?: Record<string, any>;
  refund_id?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  failed_reason?: string;
}

// ============================================
// INTERFACES PUBLICITÉS & STORIES
// ============================================

export interface Advertisement {
  ad_id: string;
  advertiser_id: string;
  title: string;
  description: string;
  image_url?: string;
  video_url?: string;
  gradient?: string;
  cta_text?: string;
  cta_url?: string;
  placement: AdPlacement;
  target_audience?: {
    locations?: string[];
    age_range?: [number, number];
    interests?: string[];
  };
  start_date: string;
  end_date: string;
  priority: number;
  impressions: number;
  clicks: number;
  budget: number;
  budget_spent: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// OperatorStory is defined later (near mocks) — keep a single canonical definition there.

export interface StoryView {
  view_id: string;
  story_id: string;
  user_id: string;
  viewed_at: string;
  view_duration_seconds: number;
  completed: boolean;
  device_type: DeviceType;
}

// ============================================
// INTERFACES AVIS & ÉVALUATIONS
// ============================================

export interface Review {
  review_id: string;
  trip_id: string;
  operator_id: string;
  user_id: string;
  rating: number; // 1-5 stars
  title?: string;
  comment: string;
  aspects?: {
    cleanliness?: number; // 1-5
    comfort?: number; // 1-5
    timing?: number; // 1-5
    driver_behaviour?: number; // 1-5
    value_for_money?: number; // 1-5
  };
  is_verified_traveler: boolean; // Backend confirms user took this trip
  helpful_count: number;
  unhelpful_count: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  updated_at: string;
}

// ============================================
// INTERFACES NOTIFICATIONS & ANALYTICS
// ============================================

export interface Notification {
  notification_id: string;
  user_id: string;
  type: 'BOOKING_CONFIRMED' | 'TRIP_REMINDER' | 'PRICE_DROP' | 'OPERATOR_UPDATE' | 'PROMO' | 'TRIP_COMPLETED' | 'TRIP_COMPLETED_RATING';
  title: string;
  message: string;
  deep_link?: string;
  image_url?: string;
  is_read: boolean;
  created_at: string;
  expires_at?: string;
  metadata?: {
    trip_id?: string;
    operator_id?: string;
    ticket_id?: string;
    from_stop?: string;
    to_stop?: string;
    [key: string]: any;
  };
}

export interface UserDevice {
  device_id: string;
  user_id: string;
  push_token?: string;
  device_type: DeviceType;
  app_version: string;
  os_version: string;
  last_active: string;
  push_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsEvent {
  event_id: string;
  user_id?: string;
  event_type: string;
  event_data: Record<string, any>;
  device_type: DeviceType;
  session_id?: string;
  created_at: string;
  ip_address?: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
}

export interface VehicleEstimate {
  trip_id: string;
  operator_name: string;
  from_stop: string;
  to_stop: string;
  estimated_departure: string;
  estimated_arrival: string;
  current_latitude?: number;
  current_longitude?: number;
  progress_percent?: number;
  distance_to_user_km?: number;
}

export interface NearbyStation {
  station: Station;
  distance_km: number;
  next_departures: Trip[];
}

// ============================================
// DONNÉES EXEMPLE - STATIONS
// ============================================

export const STATIONS: Station[] = [
  {
    id: 'OUAGA_CENTRE',
    name: 'Gare Routière Centrale',
    city: 'Ouagadougou',
    latitude: 12.3714,
    longitude: -1.5197,
    address: 'Avenue Kwame Nkrumah',
    amenities: [],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'OUAGA_OUEST',
    name: 'Gare Ouest',
    city: 'Ouagadougou',
    latitude: 12.3547,
    longitude: -1.5410,
    amenities: [],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'BOBO_CENTRE',
    name: 'Gare Routière Bobo-Dioulasso',
    city: 'Bobo-Dioulasso',
    latitude: 11.1773,
    longitude: -4.2972,
    address: 'Route de Banfora',
    amenities: [],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'KOUDOUGOU',
    name: 'Gare de Koudougou',
    city: 'Koudougou',
    latitude: 12.2526,
    longitude: -2.3637,
    amenities: [],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'BANFORA',
    name: 'Gare de Banfora',
    city: 'Banfora',
    latitude: 10.6333,
    longitude: -4.7500,
    amenities: [],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'OUAHIGOUYA',
    name: 'Gare de Ouahigouya',
    city: 'Ouahigouya',
    latitude: 13.5828,
    longitude: -2.4214,
    amenities: [],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'FADA',
    name: 'Gare de Fada N\'Gourma',
    city: 'Fada N\'Gourma',
    latitude: 12.0614,
    longitude: 0.3582,
    amenities: [],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

// ============================================
// DONNÉES EXEMPLE - TRAJETS
// ============================================

export const TRIPS: Trip[] = [
  {
    trip_id: 'TRIP_001',
    operator_id: 'AIR_CANADA',
    operator_name: 'Air Canada Bus',
    operator_logo: '✈️',
    vehicle_id: 'VEH_TRIP_001',
    vehicle_type: 'Bus climatisé',
    departure_time: '2025-10-28T07:05:00',
    arrival_time: '2025-10-28T13:05:00',
    duration_minutes: 360,
    base_price: 8500,
    currency: 'XOF',
    from_stop_id: 'OUAGA_CENTRE',
    to_stop_id: 'BOBO_CENTRE',
    from_stop_name: 'Ouagadougou',
    to_stop_name: 'Bobo-Dioulasso',
    segments: [
      {
        segment_id: 'SEG_001_1',
        trip_id: 'TRIP_001',
        sequence_number: 1,
        base_price: 4250,
        from_stop_id: 'OUAGA_CENTRE',
        to_stop_id: 'KOUDOUGOU',
        from_stop_name: 'Ouagadougou',
        to_stop_name: 'Koudougou',
        departure_time: '2025-10-28T07:05:00',
        arrival_time: '2025-10-28T09:15:00',
        distance_km: 95,
        available_seats: 12,
        total_seats: 45,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        segment_id: 'SEG_001_2',
        trip_id: 'TRIP_001',
        sequence_number: 2,
        base_price: 4250,
        from_stop_id: 'KOUDOUGOU',
        to_stop_id: 'BOBO_CENTRE',
        from_stop_name: 'Koudougou',
        to_stop_name: 'Bobo-Dioulasso',
        departure_time: '2025-10-28T09:30:00',
        arrival_time: '2025-10-28T13:05:00',
        distance_km: 275,
        available_seats: 18,
        total_seats: 45,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    amenities: ['WiFi', 'AC', 'USB', 'Toilet'],
    has_live_tracking: true
    ,available_seats: 12,
    total_seats: 45,
    is_cancelled: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    trip_id: 'TRIP_002',
    operator_id: 'SCOOT',
    operator_name: 'Scoot Express',
    operator_logo: '🚌',
    vehicle_id: 'VEH_TRIP_002',
    vehicle_type: 'Mini-bus',
    departure_time: '2025-10-28T09:05:00',
    arrival_time: '2025-10-28T14:55:00',
    duration_minutes: 350,
    base_price: 7000,
    currency: 'XOF',
    from_stop_id: 'OUAGA_CENTRE',
    to_stop_id: 'BOBO_CENTRE',
    from_stop_name: 'Ouagadougou',
    to_stop_name: 'Bobo-Dioulasso',
    segments: [
      {
        segment_id: 'SEG_002_1',
        trip_id: 'TRIP_002',
        sequence_number: 1,
        base_price: 7000,
        from_stop_id: 'OUAGA_CENTRE',
        to_stop_id: 'BOBO_CENTRE',
        from_stop_name: 'Ouagadougou',
        to_stop_name: 'Bobo-Dioulasso',
        departure_time: '2025-10-28T09:05:00',
        arrival_time: '2025-10-28T14:55:00',
        distance_km: 365,
        available_seats: 8,
        total_seats: 30,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    amenities: ['AC', 'USB'],
    has_live_tracking: false
    ,available_seats: 8,
    total_seats: 30,
    is_cancelled: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    trip_id: 'TRIP_002B',
    operator_id: 'RAKIETA',
    operator_name: 'Rakieta Transport',
    operator_logo: '🚐',
    vehicle_id: 'VEH_TRIP_002B',
    vehicle_type: 'Bus VIP',
    departure_time: '2025-10-28T11:00:00',
    arrival_time: '2025-10-28T16:45:00',
    duration_minutes: 345,
    base_price: 10000,
    currency: 'XOF',
    from_stop_id: 'OUAGA_CENTRE',
    to_stop_id: 'BOBO_CENTRE',
    from_stop_name: 'Ouagadougou',
    to_stop_name: 'Bobo-Dioulasso',
    segments: [
      {
        segment_id: 'SEG_002B_1',
        trip_id: 'TRIP_002B',
        sequence_number: 1,
        base_price: 10000,
        from_stop_id: 'OUAGA_CENTRE',
        to_stop_id: 'BOBO_CENTRE',
        from_stop_name: 'Ouagadougou',
        to_stop_name: 'Bobo-Dioulasso',
        departure_time: '2025-10-28T11:00:00',
        arrival_time: '2025-10-28T16:45:00',
        distance_km: 365,
        available_seats: 22,
        total_seats: 35,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    amenities: ['WiFi', 'AC', 'USB', 'Toilet', 'Snacks'],
    has_live_tracking: true
    ,available_seats: 22,
    total_seats: 35,
    is_cancelled: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  // Trajets retour Bobo → Ouaga
  {
    trip_id: 'TRIP_003',
    operator_id: 'AIR_CANADA',
    operator_name: 'Air Canada Bus',
    operator_logo: '✈️',
    vehicle_id: 'VEH_TRIP_003',
    vehicle_type: 'Bus climatisé',
    departure_time: '2025-10-29T08:00:00',
    arrival_time: '2025-10-29T14:00:00',
    duration_minutes: 360,
    base_price: 8500,
    currency: 'XOF',
    from_stop_id: 'BOBO_CENTRE',
    to_stop_id: 'OUAGA_CENTRE',
    from_stop_name: 'Bobo-Dioulasso',
    to_stop_name: 'Ouagadougou',
    segments: [
      {
        segment_id: 'SEG_003_1',
        trip_id: 'TRIP_003',
        sequence_number: 1,
        base_price: 4250,
        from_stop_id: 'BOBO_CENTRE',
        to_stop_id: 'KOUDOUGOU',
        from_stop_name: 'Bobo-Dioulasso',
        to_stop_name: 'Koudougou',
        departure_time: '2025-10-29T08:00:00',
        arrival_time: '2025-10-29T11:30:00',
        distance_km: 275,
        available_seats: 16,
        total_seats: 45,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        segment_id: 'SEG_003_2',
        trip_id: 'TRIP_003',
        sequence_number: 2,
        base_price: 4250,
        from_stop_id: 'KOUDOUGOU',
        to_stop_id: 'OUAGA_CENTRE',
        from_stop_name: 'Koudougou',
        to_stop_name: 'Ouagadougou',
        departure_time: '2025-10-29T11:45:00',
        arrival_time: '2025-10-29T14:00:00',
        distance_km: 95,
        available_seats: 14,
        total_seats: 45,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    amenities: ['WiFi', 'AC', 'USB', 'Toilet'],
    has_live_tracking: true
    ,available_seats: 14,
    total_seats: 45,
    is_cancelled: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    trip_id: 'TRIP_004',
    operator_id: 'AIR_CANADA',
    operator_name: 'Air Canada Bus',
    operator_logo: '✈️',
    vehicle_id: 'VEH_TRIP_004',
    vehicle_type: 'Bus climatisé',
    departure_time: '2025-10-29T15:00:00',
    arrival_time: '2025-10-29T21:00:00',
    duration_minutes: 360,
    base_price: 8500,
    currency: 'XOF',
    from_stop_id: 'BOBO_CENTRE',
    to_stop_id: 'OUAGA_CENTRE',
    from_stop_name: 'Bobo-Dioulasso',
    to_stop_name: 'Ouagadougou',
    segments: [
      {
        segment_id: 'SEG_004_1',
        trip_id: 'TRIP_004',
        sequence_number: 1,
        base_price: 8500,
        from_stop_id: 'BOBO_CENTRE',
        to_stop_id: 'OUAGA_CENTRE',
        from_stop_name: 'Bobo-Dioulasso',
        to_stop_name: 'Ouagadougou',
        departure_time: '2025-10-29T15:00:00',
        arrival_time: '2025-10-29T21:00:00',
        distance_km: 365,
        available_seats: 20,
        total_seats: 45,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    amenities: ['WiFi', 'AC', 'USB', 'Toilet'],
    has_live_tracking: true
    ,available_seats: 20,
    total_seats: 45,
    is_cancelled: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    trip_id: 'TRIP_005',
    operator_id: 'SCOOT',
    operator_name: 'Scoot Express',
    operator_logo: '🚌',
    vehicle_id: 'VEH_TRIP_005',
    vehicle_type: 'Mini-bus',
    departure_time: '2025-10-29T10:00:00',
    arrival_time: '2025-10-29T15:50:00',
    duration_minutes: 350,
    base_price: 7000,
    currency: 'XOF',
    from_stop_id: 'BOBO_CENTRE',
    to_stop_id: 'OUAGA_CENTRE',
    from_stop_name: 'Bobo-Dioulasso',
    to_stop_name: 'Ouagadougou',
    segments: [
      {
        segment_id: 'SEG_005_1',
        trip_id: 'TRIP_005',
        sequence_number: 1,
        base_price: 7000,
        from_stop_id: 'BOBO_CENTRE',
        to_stop_id: 'OUAGA_CENTRE',
        from_stop_name: 'Bobo-Dioulasso',
        to_stop_name: 'Ouagadougou',
        departure_time: '2025-10-29T10:00:00',
        arrival_time: '2025-10-29T15:50:00',
        distance_km: 365,
        available_seats: 10,
        total_seats: 30,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    amenities: ['AC', 'USB'],
    has_live_tracking: false
    ,available_seats: 10,
    total_seats: 30,
    is_cancelled: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    trip_id: 'TRIP_006',
    operator_id: 'RAKIETA',
    operator_name: 'Rakieta Transport',
    operator_logo: '🚐',
    vehicle_id: 'VEH_TRIP_006',
    vehicle_type: 'Bus VIP',
    departure_time: '2025-10-29T14:30:00',
    arrival_time: '2025-10-29T20:15:00',
    duration_minutes: 345,
    base_price: 10000,
    currency: 'XOF',
    from_stop_id: 'BOBO_CENTRE',
    to_stop_id: 'OUAGA_CENTRE',
    from_stop_name: 'Bobo-Dioulasso',
    to_stop_name: 'Ouagadougou',
    segments: [
      {
        segment_id: 'SEG_006_1',
        trip_id: 'TRIP_006',
        sequence_number: 1,
        base_price: 10000,
        from_stop_id: 'BOBO_CENTRE',
        to_stop_id: 'OUAGA_CENTRE',
        from_stop_name: 'Bobo-Dioulasso',
        to_stop_name: 'Ouagadougou',
        departure_time: '2025-10-29T14:30:00',
        arrival_time: '2025-10-29T20:15:00',
        distance_km: 365,
        available_seats: 15,
        total_seats: 35,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    amenities: ['WiFi', 'AC', 'USB', 'Toilet', 'Snacks'],
    has_live_tracking: true
    ,available_seats: 15,
    total_seats: 35,
    is_cancelled: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// ============================================
// DONNÉES EXEMPLE - BILLETS
// ============================================

export const MOCK_TICKETS: Ticket[] = [
  // ====== BILLET ACTIF (PAID) - Peut être annulé et téléchargé ======
  {
    ticket_id: 'AC7H851940',
    trip_id: 'TRIP_001',
    booking_id: 'BKG_AC7H851940',
    operator_id: 'AIR_CANADA',
    operator_name: 'Air Canada Bus',
    from_stop_id: 'OUAGA_CENTRE',
    from_stop_name: 'Ouagadougou',
    to_stop_id: 'BOBO_CENTRE',
    to_stop_name: 'Bobo-Dioulasso',
    departure_time: '2025-12-05T07:05:00', // Future date
    arrival_time: '2025-12-05T13:05:00',
    passenger_name: 'NAPON Yahasine',
    passenger_phone: '+22670123456',
    passenger_email: 'napon@example.com',
    seat_number: 'A12',
    status: 'PAID',
    qr_code: 'QR_AC7H851940',
    alphanumeric_code: 'AC7H851940',
    price: 8500,
    currency: 'XOF',
    payment_method: 'ORANGE_MONEY',
    payment_id: 'PAY_AC7H851940',
    created_at: '2025-10-20T10:30:00',
    updated_at: '2025-10-20T10:30:00',
    holder_downloaded: false,
    holder_presented: false,
    last_sync_at: '2025-10-20T10:30:00',
    can_cancel: true,
    can_transfer: true
  },

  // ====== BILLET EMBARQUÉ (EMBARKED) - Affiche carte de suivi, pas d'annulation ======
  {
    ticket_id: 'SC9K1234AB',
    trip_id: 'TRIP_002',
    booking_id: 'BKG_SC9K1234AB',
    operator_id: 'SCOOT',
    operator_name: 'Scoot Express',
    from_stop_id: 'OUAGA_CENTRE',
    from_stop_name: 'Ouagadougou',
    to_stop_id: 'BOBO_CENTRE',
    to_stop_name: 'Bobo-Dioulasso',
    departure_time: '2025-12-02T09:05:00', // Today or recent past
    arrival_time: '2025-12-02T14:55:00',
    passenger_name: 'NAPON Yahasine',
    passenger_phone: '+22670123456',
    passenger_email: 'napon@example.com',
    seat_number: 'B05',
    status: 'EMBARKED',
    qr_code: 'QR_SC9K1234AB',
    alphanumeric_code: 'SC9K1234AB',
    price: 7000,
    currency: 'XOF',
    payment_method: 'MOOV_MONEY',
    payment_id: 'PAY_SC9K1234AB',
    created_at: '2025-10-18T14:20:00',
    updated_at: '2025-10-18T14:20:00',
    holder_downloaded: true,
    holder_presented: true,
    last_sync_at: '2025-10-18T14:20:00',
    can_cancel: false,
    can_transfer: false
  },

  // ====== BILLET ANNULÉ (CANCELLED) - Lecture seule, aucune action ======
  {
    ticket_id: 'RK3L9876CD',
    trip_id: 'TRIP_003',
    booking_id: 'BKG_RK3L9876CD',
    operator_id: 'RAKIETA',
    operator_name: 'Rakieta Transport',
    from_stop_id: 'OUAGA_CENTRE',
    from_stop_name: 'Ouagadougou',
    to_stop_id: 'BOBO_CENTRE',
    to_stop_name: 'Bobo-Dioulasso',
    departure_time: '2025-11-25T10:30:00', // Past date
    arrival_time: '2025-11-25T16:30:00',
    passenger_name: 'NAPON Yahasine',
    passenger_phone: '+22670123456',
    passenger_email: 'napon@example.com',
    seat_number: 'C08',
    status: 'CANCELLED',
    qr_code: 'QR_RK3L9876CD',
    alphanumeric_code: 'RK3L9876CD',
    price: 6500,
    currency: 'XOF',
    payment_method: 'CARTE_BANCAIRE',
    payment_id: 'PAY_RK3L9876CD',
    created_at: '2025-10-15T09:00:00',
    updated_at: '2025-10-22T14:15:00',
    cancellation_reason: 'Annulation client - Changement de dates',
    refund_status: 'COMPLETED',
    holder_downloaded: false,
    holder_presented: false,
    last_sync_at: '2025-10-22T14:15:00',
    can_cancel: false,
    can_transfer: false
  },

  // ====== BILLET EXPIRÉ (EXPIRED - PAID status mais date passée) - Lecture seule ======
  {
    ticket_id: 'TS5M5432EF',
    trip_id: 'TRIP_004',
    booking_id: 'BKG_TS5M5432EF',
    operator_id: 'TSR',
    operator_name: 'TSR Voyages',
    from_stop_id: 'BOBO_CENTRE',
    from_stop_name: 'Bobo-Dioulasso',
    to_stop_id: 'OUAGA_CENTRE',
    to_stop_name: 'Ouagadougou',
    departure_time: '2025-11-15T08:00:00', // Past date (expired)
    arrival_time: '2025-11-15T14:00:00',
    passenger_name: 'NAPON Yahasine',
    passenger_phone: '+22670123456',
    passenger_email: 'napon@example.com',
    seat_number: 'D10',
    status: 'PAID', // Status is PAID but trip date has passed
    qr_code: 'QR_TS5M5432EF',
    alphanumeric_code: 'TS5M5432EF',
    price: 7500,
    currency: 'XOF',
    payment_method: 'ORANGE_MONEY',
    payment_id: 'PAY_TS5M5432EF',
    created_at: '2025-10-10T11:30:00',
    updated_at: '2025-10-10T11:30:00',
    holder_downloaded: false,
    holder_presented: false,
    last_sync_at: '2025-10-10T11:30:00',
    can_cancel: false,
    can_transfer: false
  }
];

// ============================================
// DONNÉES EXEMPLE - VÉHICULES À PROXIMITÉ
// ============================================

export const NEARBY_VEHICLES: VehicleEstimate[] = [
  {
    trip_id: 'TRIP_003',
    operator_name: 'Air Canada Bus',
    from_stop: 'Bobo-Dioulasso',
    to_stop: 'Ouagadougou',
    estimated_departure: '2025-10-27T14:30:00',
    estimated_arrival: '2025-10-27T20:15:00',
    current_latitude: 12.3714,
    current_longitude: -1.5197,
    progress_percent: 45,
    distance_to_user_km: 0.8
  }
];

// ============================================
// DONNÉES EXEMPLE - GARES À PROXIMITÉ
// ============================================

export const NEARBY_STATIONS_DATA: NearbyStation[] = [
  {
    station: STATIONS[0],
    distance_km: 0.8,
    next_departures: [TRIPS[0], TRIPS[1]]
  },
  {
    station: STATIONS[1],
    distance_km: 3.2,
    next_departures: []
  }
];

// ============================================
// OPÉRATEURS DE TRANSPORT
// ============================================

// Keep a simple alias for legacy UI code. Prefer `OperatorFull` for canonical model.
export type Operator = OperatorFull;

export interface OperatorStory {
  id: string;
  operator_id: string;
  type: 'PROMOTIONS' | 'ACTUALITE' | 'ALERTE' | 'NEW_ROUTE' | 'ANNOUNCEMENT' | 'EVENT' | 'ACHIEVEMENT';
  media_type: 'image' | 'video' | 'gradient';
  media_url?: string; // ✅ BACKEND: URL de l'image/vidéo
  gradient?: string;
  title: string;
  subtitle?: string;
  description?: string;
  emoji?: string;
  cta_text?: string; // Call to action
  cta_link?: string;
  duration_seconds?: number; // Durée d'affichage (défaut 5s)
  created_at: string;
  expires_at: string;
  is_viewed: boolean; // ✅ BACKEND: Tracked per user
}

export const OPERATORS: OperatorFull[] = [
  {
    operator_id: 'AIR_CANADA',
    name: 'Air Canada Bus',
    operator_logo: '🚌',
    rating: 4.8,
    total_reviews: 820,
    total_trips: 120,
    fleet_size: 25,
    description: 'Leader du transport premium au Burkina Faso avec 15 ans d\'expérience.',
    amenities: ['WiFi', 'AC', 'USB', 'Toilet', 'Snacks'],
    phone_number: '+22670123456',
    email: 'contact@aircanadabus.bf',
    has_unread_stories: true,
    stories_count: 3,
    is_verified: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    operator_id: 'SCOOT',
    name: 'Scoot Express',
    operator_logo: '🚌',
    rating: 4.5,
    total_reviews: 420,
    total_trips: 95,
    fleet_size: 18,
    description: 'Transport rapide et économique pour tous vos déplacements.',
    amenities: ['AC', 'USB'],
    phone_number: '+22670234567',
    email: 'info@scootexpress.bf',
    has_unread_stories: false,
    stories_count: 2,
    is_verified: false,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    operator_id: 'RAKIETA',
    name: 'Rakieta Transport',
    operator_logo: '🚐',
    rating: 4.7,
    total_reviews: 610,
    total_trips: 110,
    fleet_size: 22,
    description: 'Confort et sécurité garantis depuis 1995.',
    amenities: ['WiFi', 'AC', 'USB', 'Toilet'],
    phone_number: '+22670345678',
    email: 'contact@rakieta.bf',
    has_unread_stories: true,
    stories_count: 2,
    is_verified: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    operator_id: 'TSR',
    name: 'TSR Voyages',
    operator_logo: '🚍',
    rating: 4.6,
    total_reviews: 380,
    total_trips: 88,
    fleet_size: 20,
    description: 'Votre partenaire de confiance pour voyager en toute sérénité.',
    amenities: ['AC', 'USB', 'Snacks'],
    phone_number: '+22670456789',
    email: 'info@tsrvoyages.bf',
    has_unread_stories: false,
    stories_count: 1,
    is_verified: false,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    operator_id: 'STAF',
    name: 'STAF Burkina',
    operator_logo: '🚎',
    rating: 4.4,
    total_reviews: 260,
    total_trips: 75,
    fleet_size: 16,
    description: 'Transport fiable et accessible pour tous.',
    amenities: ['AC'],
    phone_number: '+22670567890',
    email: 'contact@stafburkina.bf',
    has_unread_stories: true,
    stories_count: 1,
    is_verified: false,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// ============================================
// STORIES DES COMPAGNIES
// ============================================

export const OPERATOR_STORIES: Record<string, OperatorStory[]> = {
  'AIR_CANADA': [
    {
      id: 'AC_STORY_1',
      operator_id: 'AIR_CANADA',
      type: 'PROMOTIONS',
      media_type: 'gradient',
      gradient: 'from-blue-600 via-cyan-500 to-teal-600',
      title: 'Réduction Hiver',
      subtitle: 'Jusqu\'à -15% cette semaine',
      description: 'Voyagez à petit prix avec nos tarifs spéciaux d\'hiver. Offre limitée !',
      emoji: '❄️',
      cta_text: 'Profiter',
      cta_link: '#',
      duration_seconds: 5,
      created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      is_viewed: false,
    },
    {
      id: 'AC_STORY_2',
      operator_id: 'AIR_CANADA',
      type: 'ANNOUNCEMENT',
      media_type: 'gradient',
      gradient: 'from-emerald-600 via-green-500 to-lime-600',
      title: 'WiFi Ultra Rapide',
      subtitle: 'Sur tous nos bus',
      description: 'Connectez-vous gratuitement et travaillez confortablement pendant votre trajet.',
      emoji: '📡',
      cta_text: 'En savoir plus',
      cta_link: '#',
      duration_seconds: 5,
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      is_viewed: false,
    },
  ],
  'SCOOT': [
    {
      id: 'SCOOT_STORY_1',
      operator_id: 'SCOOT',
      type: 'PROMOTIONS',
      media_type: 'gradient',
      gradient: 'from-orange-600 via-yellow-500 to-amber-600',
      title: 'Tarifs étudiants -25%',
      subtitle: 'Valable toute l\'année',
      description: 'Étudiants, profitez de réductions exceptionnelles sur tous vos trajets. Présentez votre carte !',
      emoji: '🎓',
      cta_text: 'S\'inscrire',
      duration_seconds: 5,
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      is_viewed: false,
    },
  ],
  'RAKIETA': [
    {
      id: 'RAKIETA_STORY_1',
      operator_id: 'RAKIETA',
      type: 'EVENT',
      media_type: 'gradient',
      gradient: 'from-rose-600 via-red-500 to-orange-600',
      title: 'Promo de fin d\'année',
      subtitle: 'Jusqu\'à 30% de réduction',
      description: 'Célébrez avec nous ! Réductions massives sur tous les trajets jusqu\'au 31 décembre.',
      emoji: '🎁',
      cta_text: 'Réserver maintenant',
      duration_seconds: 5,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      is_viewed: false,
    },
  ],
  'TSR': [
    {
      id: 'TSR_STORY_1',
      operator_id: 'TSR',
      type: 'NEW_ROUTE',
      media_type: 'gradient',
      gradient: 'from-violet-600 via-purple-500 to-fuchsia-600',
      title: 'Nouvelle ligne Ouaga-Fada',
      subtitle: 'Départs quotidiens',
      description: 'Connectez-vous avec notre nouvelle route directe vers Fada N\'Gourma. Confort et sécurité garantis !',
      emoji: '🛣️',
      cta_text: 'Découvrir',
      duration_seconds: 5,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      is_viewed: false,
    },
  ],
  'STAF': [
    {
      id: 'STAF_STORY_1',
      operator_id: 'STAF',
      type: 'PROMOTIONS',
      media_type: 'gradient',
      gradient: 'from-cyan-600 via-blue-500 to-indigo-600',
      title: 'Cashback 5% Orange Money',
      subtitle: 'Sur chaque trajet',
      description: 'Payez avec Orange Money et obtenez 5% de cashback instantané sur votre prochain voyage !',
      emoji: '💰',
      cta_text: 'Payer maintenant',
      duration_seconds: 5,
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      is_viewed: false,
    },
  ],
};

// ============================================
// TRAJETS POPULAIRES
// ============================================

export const POPULAR_ROUTES = [
  { from: 'Ouaga', to: 'Bobo', from_id: 'OUAGA_CENTRE', to_id: 'BOBO_CENTRE' },
  { from: 'Ouaga', to: 'Koudougou', from_id: 'OUAGA_CENTRE', to_id: 'KOUDOUGOU' },
  { from: 'Bobo', to: 'Banfora', from_id: 'BOBO_CENTRE', to_id: 'BANFORA' },
];

// ============================================
// CONFIGURATION PLAN DE SIÈGES
// ============================================

export const SEAT_MAP_CONFIG = {
  rows: 11,
  seatsPerRow: 4,
  aisleAfter: 2, // Allée après le 2ème siège
  totalSeats: 44
};

export const MOCK_SEAT_STATUSES: { [key: string]: SeatStatus } = {
  'A1': 'paid',
  'A2': 'paid',
  'B1': 'available',
  'B2': 'hold',
  'C1': 'available',
  'C2': 'available',
  'D1': 'paid',
  'D2': 'available',
  // ... autres sièges disponibles par défaut
};

// ============================================
// VALIDATION DES DONNÉES DE DÉMARRAGE
// ============================================

/**
 * Valide tous les trips mocks au démarrage
 * Affiche les warnings si des incohérences sont détectées
 */
export function validateAllTrips(): void {
  console.group('🔍 Validation de la capacité des trajets');
  let validCount = 0;
  let invalidCount = 0;
  
  TRIPS.forEach(trip => {
    if (validateTripCapacity(trip)) {
      validCount++;
    } else {
      invalidCount++;
    }
  });
  
  console.log(`✅ ${validCount} trajets valides`);
  if (invalidCount > 0) {
    console.warn(`⚠️ ${invalidCount} trajectes avec incohérences`);
  }
  console.groupEnd();
}

// Exécuter la validation au chargement du module
if (typeof window !== 'undefined') {
  // Validation en dev/prod pour debugging
  // Peut être désactivée via localStorage si besoin
  if (localStorage?.getItem('validateTripsOnLoad') !== 'false') {
    setTimeout(() => validateAllTrips(), 0);
  }
}
