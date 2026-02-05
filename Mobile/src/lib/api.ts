/**
 * API Service Layer - TransportBF
 * 
 * Ce fichier centralise toutes les communications avec le backend.
 * Remplacez BASE_URL par votre vraie URL API ou connectez à Supabase.
 * 
 * ARCHITECTURE:
 * - Mode DEV: utilise des données mockées (fallback)
 * - Mode PROD: fait des vraies requêtes HTTP au backend
 * 
 * ENDPOINTS BACKEND REQUIS:
 * - GET /api/stories/active - Récupère les stories actives
 * - POST /api/stories (admin) - Créer une nouvelle story
 * - GET /api/stations - Liste toutes les stations
 * - GET /api/stations/nearby?lat=&lon=&radius= - Stations à proximité
 * - GET /api/trips - Rechercher des trajets
 * - GET /api/trips/:id - Détails d'un trajet
 * - POST /api/bookings/hold - Créer une réservation HOLD (TTL 10min)
 * - POST /api/bookings/confirm - Confirmer et payer une réservation
 * - GET /api/tickets - Mes billets
 * - POST /api/tickets/:id/transfer - Transférer un billet
 * - DELETE /api/tickets/:id - Annuler un billet
 * - GET /api/operators - Liste des opérateurs
 * - POST /api/auth/login - Connexion
 * - POST /api/auth/register - Inscription
 */

// Configuration
const _meta: any = typeof import.meta !== 'undefined' ? (import.meta as any) : {};
const isDevelopment = (_meta.env && _meta.env.MODE === 'development') || true; // Toujours en dev pour l'instant
const BASE_URL = (_meta.env && _meta.env.VITE_API_URL) || 'http://localhost:3000/api';

// Import canonical types from models to avoid duplicate/contradictory interfaces
import type { Ticket as ModelTicket } from '../data/models';

// Types
export interface Story {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  emoji?: string;
  gradient: string;
  category: 'PROMO' | 'NEW' | 'DESTINATION' | 'TIPS' | 'PARTNERS' | 'ANNOUNCEMENT';
  link_url?: string;
  is_active: boolean;
  priority: number;
  created_by: string;
  created_at: string;
  expires_at?: string;
}

export interface Station {
  id: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  address?: string;
  is_active: boolean;
}

export interface NearbyStation {
  station: Station;
  distance_km: number;
  next_departures: Trip[];
}

export interface Trip {
  trip_id: string;
  operator_id: string;
  operator_name: string;
  operator_logo?: string;
  vehicle_type: string;
  departure_time: string;
  arrival_time: string;
  duration_minutes: number;
  base_price: number;
  from_stop_id: string;
  to_stop_id: string;
  from_stop_name: string;
  to_stop_name: string;
  segments: Segment[];
  amenities: string[];
  has_live_tracking: boolean;
  available_seats: number;
  total_seats: number;
}

export interface Segment {
  segment_id: string;
  from_stop_id: string;
  to_stop_id: string;
  from_stop_name: string;
  to_stop_name: string;
  departure_time: string;
  arrival_time: string;
  distance_km: number;
  available_seats: number;
  total_seats: number;
}

export interface Ticket {
  ticket_id: string;
  bundle_id?: string;
  trip_id: string;
  operator_name: string;
  from_stop_name: string;
  to_stop_name: string;
  departure_time: string;
  arrival_time: string;
  passenger_name: string;
  seat_number?: string;
  status: 'AVAILABLE' | 'HOLD' | 'PAID' | 'EMBARKED' | 'CANCELLED';
  qr_code: string;
  alphanumeric_code: string;
  price: number;
  created_at: string;
  holder_downloaded: boolean;
  transfer_token?: string;
  can_cancel: boolean;
  can_transfer: boolean;
  hold_expires_at?: string;
}

/**
 * Correction : importer l'interface Operator depuis models.ts pour garantir la cohérence du typage
 * Supprimer la redéfinition locale de l'interface Operator
 */
import type { Operator } from '../data/models';

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

export interface PopularRoute {
  id: string;
  from: string;
  to: string;
  from_id: string;
  to_id: string;
  trip_count: number;
  avg_price: number;
}

// ============================================
// STORIES API
// ============================================

/**
 * Récupère les stories actives
 * Ces stories sont créées par les administrateurs dans le backend
 */
export async function getActiveStories(): Promise<Story[]> {
  if (isDevelopment) {
    // Mock data pour le développement
    return [
      {
        id: 'story_1',
        title: 'Promotions',
        description: '🎁 Profitez de -20% sur tous les trajets ce week-end !',
        emoji: '🎉',
        gradient: 'from-red-500 to-amber-500',
        category: 'PROMO',
        is_active: true,
        priority: 1,
        created_by: 'admin',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'story_2',
        title: 'Nouveautés',
        description: '✨ Découvrez nos nouvelles destinations',
        emoji: '✨',
        gradient: 'from-amber-500 to-green-500',
        category: 'NEW',
        is_active: true,
        priority: 2,
        created_by: 'admin',
        created_at: new Date().toISOString()
      },
      {
        id: 'story_3',
        title: 'Destinations',
        description: '🏖️ Explorez les plus belles destinations du Burkina Faso',
        emoji: '🌍',
        gradient: 'from-amber-500 to-orange-500',
        category: 'DESTINATION',
        is_active: true,
        priority: 3,
        created_by: 'admin',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'story_4',
        title: 'Annonces',
        description: '📢 Informations importantes sur nos services',
        emoji: '📣',
        gradient: 'from-orange-500 to-red-500',
        category: 'ANNOUNCEMENT',
        is_active: true,
        priority: 4,
        created_by: 'admin',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  const response = await fetch(`${BASE_URL}/stories/active`);
  if (!response.ok) throw new Error('Failed to fetch stories');
  return response.json();
}

/**
 * Créer une nouvelle story (admin only)
 * Nécessite authentification admin
 */
export async function createStory(story: Omit<Story, 'id' | 'created_at'>): Promise<Story> {
  const response = await fetch(`${BASE_URL}/stories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Ajouter le token d'authentification ici
      // 'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(story)
  });
  
  if (!response.ok) throw new Error('Failed to create story');
  return response.json();
}

// ============================================
// STATIONS API
// ============================================

/**
 * Récupère toutes les stations
 */
export async function getStations(): Promise<Station[]> {
  if (isDevelopment) {
    // Mock data - remplacer par vraies données de votre DB
    return [
      {
        id: 'OUAGA_CENTRE',
        name: 'Gare Routière Centrale',
        city: 'Ouagadougou',
        latitude: 12.3714,
        longitude: -1.5197,
        address: 'Avenue Kwame Nkrumah',
        is_active: true
      },
      {
        id: 'BOBO_CENTRE',
        name: 'Gare Routière Bobo-Dioulasso',
        city: 'Bobo-Dioulasso',
        latitude: 11.1773,
        longitude: -4.2972,
        address: 'Route de Banfora',
        is_active: true
      },
      {
        id: 'KOUDOUGOU',
        name: 'Gare de Koudougou',
        city: 'Koudougou',
        latitude: 12.2526,
        longitude: -2.3637,
        is_active: true
      },
      {
        id: 'BANFORA',
        name: 'Gare de Banfora',
        city: 'Banfora',
        latitude: 10.6333,
        longitude: -4.7500,
        is_active: true
      },
      {
        id: 'OUAHIGOUYA',
        name: 'Gare de Ouahigouya',
        city: 'Ouahigouya',
        latitude: 13.5828,
        longitude: -2.4214,
        is_active: true
      }
    ];
  }

  const response = await fetch(`${BASE_URL}/stations`);
  if (!response.ok) throw new Error('Failed to fetch stations');
  return response.json();
}

/**
 * Récupère les stations à proximité
 * @param latitude - Latitude de l'utilisateur
 * @param longitude - Longitude de l'utilisateur
 * @param radius - Rayon de recherche en km (défaut: 5)
 */
export async function getNearbyStations(
  latitude: number,
  longitude: number,
  radius: number = 5
): Promise<NearbyStation[]> {
  if (isDevelopment) {
    // Mock data avec calcul de distance simplifié
    const stations = await getStations();
    const trips = await getTrips({});
    
    return stations.map(station => {
      // Calcul de distance simplifié (Haversine approximation)
      const R = 6371; // Rayon de la Terre en km
      const dLat = (station.latitude - latitude) * Math.PI / 180;
      const dLon = (station.longitude - longitude) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(latitude * Math.PI / 180) * Math.cos(station.latitude * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;

      return {
        station,
        distance_km: Math.round(distance * 10) / 10,
        next_departures: trips.filter(t => t.from_stop_id === station.id).slice(0, 3)
      };
    }).filter(s => s.distance_km <= radius).sort((a, b) => a.distance_km - b.distance_km);
  }

  const response = await fetch(
    `${BASE_URL}/stations/nearby?lat=${latitude}&lon=${longitude}&radius=${radius}`
  );
  if (!response.ok) throw new Error('Failed to fetch nearby stations');
  return response.json();
}

// ============================================
// TRIPS API
// ============================================

export interface TripSearchParams {
  from_stop_id?: string;
  to_stop_id?: string;
  date?: string;
  operator_id?: string;
  min_seats?: number;
}

/**
 * Recherche des trajets
 * DELEGATED TO: tripService.searchTrips()
 */
export async function getTrips(params: TripSearchParams): Promise<Trip[]> {
  const { tripService } = await import('../services/api/trip.service');
  const serviceParams = {
    fromStationId: params.from_stop_id,
    toStationId: params.to_stop_id,
    departureDate: params.date,
    numPassengers: params.min_seats
  };
  const results = await tripService.searchTrips(serviceParams);
  // Map back to snake_case for API compatibility
  return results.map(trip => ({
    trip_id: trip.id,
    operator_id: trip.operatorId,
    operator_name: trip.operatorName,
    operator_logo: trip.operatorLogo,
    vehicle_type: trip.vehicleType,
    departure_time: trip.departureTime,
    arrival_time: trip.arrivalTime,
    duration_minutes: trip.durationMinutes,
    base_price: trip.basePrice,
    from_stop_id: trip.fromStationId,
    to_stop_id: trip.toStationId,
    from_stop_name: trip.fromStationName,
    to_stop_name: trip.toStationName,
    segments: trip.segments.map(seg => ({
      segment_id: seg.id,
      from_stop_id: seg.fromStationId,
      to_stop_id: seg.toStationId,
      from_stop_name: seg.fromStationName,
      to_stop_name: seg.toStationName,
      departure_time: seg.departureTime,
      arrival_time: seg.arrivalTime,
      distance_km: seg.distanceKm,
      available_seats: seg.availableSeats,
      total_seats: seg.totalSeats
    })),
    amenities: trip.amenities,
    has_live_tracking: trip.hasLiveTracking,
    available_seats: trip.availableSeats,
    total_seats: trip.totalSeats
  }));
}

/**
 * Récupère un trajet par ID
 * DELEGATED TO: tripService.getTripById()
 */
export async function getTripById(tripId: string): Promise<Trip> {
  const { tripService } = await import('../services/api/trip.service');
  const result = await tripService.getTripById(tripId);
  // Map back to snake_case for API compatibility
  return {
    trip_id: result.id,
    operator_id: result.operatorId,
    operator_name: result.operatorName,
    operator_logo: result.operatorLogo,
    vehicle_type: result.vehicleType,
    departure_time: result.departureTime,
    arrival_time: result.arrivalTime,
    duration_minutes: result.durationMinutes,
    base_price: result.basePrice,
    from_stop_id: result.fromStationId,
    to_stop_id: result.toStationId,
    from_stop_name: result.fromStationName,
    to_stop_name: result.toStationName,
    segments: result.segments.map(seg => ({
      segment_id: seg.id,
      from_stop_id: seg.fromStationId,
      to_stop_id: seg.toStationId,
      from_stop_name: seg.fromStationName,
      to_stop_name: seg.toStationName,
      departure_time: seg.departureTime,
      arrival_time: seg.arrivalTime,
      distance_km: seg.distanceKm,
      available_seats: seg.availableSeats,
      total_seats: seg.totalSeats
    })),
    amenities: result.amenities,
    has_live_tracking: result.hasLiveTracking,
    available_seats: result.availableSeats,
    total_seats: result.totalSeats
  };
}

// ============================================
// BOOKINGS API
// ============================================

export interface CreateHoldBookingParams {
  trip_id: string;
  seat_numbers: string[];
  passenger_name: string;
  passenger_email?: string;
  passenger_phone: string;
}

/**
 * Créer une réservation en statut HOLD (TTL 10 minutes)
 */
export async function createHoldBooking(params: CreateHoldBookingParams): Promise<ModelTicket> {
  const response = await fetch(`${BASE_URL}/bookings/hold`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // 'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(params)
  });

  if (!response.ok) throw new Error('Failed to create hold booking');
  return response.json();
}

export interface ConfirmBookingParams {
  ticket_id: string;
  payment_method: 'ORANGE_MONEY' | 'MOOV_MONEY' | 'CARD';
  payment_details: {
    phone_number?: string;
    card_token?: string;
  };
}

/**
 * Confirmer et payer une réservation HOLD
 */
export async function confirmBooking(params: ConfirmBookingParams): Promise<ModelTicket> {
  const response = await fetch(`${BASE_URL}/bookings/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // 'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(params)
  });

  if (!response.ok) throw new Error('Failed to confirm booking');
  return response.json();
}

// ============================================
// TICKETS API
// ============================================

/**
 * Récupère tous les billets de l'utilisateur
 * DELEGATED TO: ticketService.getMyTickets()
 */
export async function getMyTickets(): Promise<ModelTicket[]> {
  const { ticketService } = await import('../services/api/ticket.service');
  const results = await ticketService.getMyTickets();
  // Map back to snake_case for API compatibility
  return results.map(ticket => ({
    ticket_id: ticket.id,
    trip_id: ticket.tripId,
    operator_id: '', // Not in service Ticket type
    operator_name: '', // Not in service Ticket type
    from_stop_id: '', // Not in service Ticket type
    from_stop_name: '', // Not in service Ticket type
    to_stop_id: '', // Not in service Ticket type
    to_stop_name: '', // Not in service Ticket type
    departure_time: ticket.embarkationTime || '',
    arrival_time: ticket.embarkationTime || '', // Use same as departure
    passenger_name: ticket.passengerName,
    passenger_phone: ticket.passengerPhone,
    passenger_email: '', // Not in service Ticket type
    seat_number: ticket.seatNumber,
    status: ticket.status as any,
    qr_code: ticket.qrCode || '',
    alphanumeric_code: ticket.id,
    price: ticket.price,
    currency: 'XOF',
    payment_method: ticket.paymentMethod,
    payment_id: '',
    booking_id: '',
    created_at: ticket.createdAt,
    updated_at: ticket.updatedAt,
    holder_downloaded: false,
    holder_presented: false,
    last_sync_at: new Date().toISOString(),
    can_cancel: false,
    can_transfer: false
  } as any));
}

// transferTicket et cancelTicket sont définis plus bas dans la section TICKET ACTIONS API

// ============================================
// OPERATORS API
// ============================================

/**
 * Enrichit les opérateurs avec le nombre réel de stories valides
 * Calcule dynamiquement stories_count et has_unread_stories
 */
async function enrichOperatorsWithStories(operators: any[]): Promise<any[]> {
  const { OPERATOR_STORIES } = await import('../data/models');
  const now = new Date();

  return operators.map(operator => {
    const operatorStories = OPERATOR_STORIES[operator.operator_id] || [];
    
    // Filter only non-expired stories
    const validStories = operatorStories.filter(story => 
      new Date(story.expires_at) > now
    );
    
    // Check if there are unread stories
    const hasUnread = validStories.some(story => !story.is_viewed);

    return {
      ...operator,
      stories_count: validStories.length,
      has_unread_stories: hasUnread,
    };
  });
}

/**
 * Récupère tous les opérateurs actifs
 * ✅ BACKEND: GET /operators
 */
export async function getOperators(): Promise<Operator[]> {
  if (isDevelopment) {
    await new Promise(resolve => setTimeout(resolve, 300));
    let operators = (await import('../data/models')).OPERATORS;
    // Enrich with real story counts
    operators = await enrichOperatorsWithStories(operators);
    return operators;
  }

  const response = await fetch(`${BASE_URL}/operators`);
  if (!response.ok) throw new Error('Failed to fetch operators');
  return response.json();
}

/**
 * Récupère un opérateur par son ID
 * ✅ BACKEND: GET /operators/{operator_id}
 */
export async function getOperatorById(operatorId: string): Promise<Operator> {
  if (isDevelopment) {
    await new Promise(resolve => setTimeout(resolve, 300));
  const operators = (await import('../data/models')).OPERATORS;
  const operator = operators.find(op => op.operator_id === operatorId);
    if (!operator) throw new Error('Operator not found');
    return operator;
  }

  const response = await fetch(`${BASE_URL}/operators/${operatorId}`);
  if (!response.ok) throw new Error('Failed to fetch operator');
  return response.json();
}

/**
 * Récupère les stories d'un opérateur
 * ✅ BACKEND: GET /operators/{operator_id}/stories
 * Returns only active (non-expired) stories
 */
export async function getOperatorStories(operatorId: string): Promise<OperatorStory[]> {
  if (isDevelopment) {
    await new Promise(resolve => setTimeout(resolve, 400));
    const stories = (await import('../data/models')).OPERATOR_STORIES;
    const operatorStories = stories[operatorId] || [];
    
    // Filter only non-expired stories
    const now = new Date();
    console.log(`🔍 Fetching stories for ${operatorId}`);
    console.log(`   Total stories available: ${operatorStories.length}`);
    console.log(`   Current time: ${now.toISOString()}`);
    
    const validStories = operatorStories.filter(story => {
      const expiresAt = new Date(story.expires_at);
      const isValid = expiresAt > now;
      console.log(`   Story "${story.title}": expires_at=${story.expires_at}, valid=${isValid}`);
      return isValid;
    });
    
    console.log(`   ✅ Valid stories: ${validStories.length}`);
    return validStories;
  }

  const response = await fetch(`${BASE_URL}/operators/${operatorId}/stories`);
  if (!response.ok) throw new Error('Failed to fetch operator stories');
  return response.json();
}

/**
 * Marque une story comme vue
 * ✅ BACKEND: POST /operators/{operator_id}/stories/{story_id}/view
 */
export async function markStoryAsViewed(operatorId: string, storyId: string): Promise<void> {
  if (isDevelopment) {
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log(`Story ${storyId} marked as viewed for operator ${operatorId}`);
    return;
  }

  const response = await fetch(`${BASE_URL}/operators/${operatorId}/stories/${storyId}/view`, {
    method: 'POST'
  });
  if (!response.ok) throw new Error('Failed to mark story as viewed');
}

// ============================================
// POPULAR ROUTES API
// ============================================

/**
 * Récupère les routes populaires
 * Ces routes sont calculées automatiquement par le backend
 * basées sur le nombre de réservations
 */
export async function getPopularRoutes(): Promise<PopularRoute[]> {
  if (isDevelopment) {
    // Mock data - les routes les plus populaires
    return [
      {
        id: 'route_1',
        from: 'Ouaga',
        to: 'Bobo',
        from_id: 'OUAGA_CENTRE',
        to_id: 'BOBO_CENTRE',
        trip_count: 45,
        avg_price: 8000
      },
      {
        id: 'route_2',
        from: 'Ouaga',
        to: 'Koudougou',
        from_id: 'OUAGA_CENTRE',
        to_id: 'KOUDOUGOU',
        trip_count: 32,
        avg_price: 3500
      },
      {
        id: 'route_3',
        from: 'Bobo',
        to: 'Banfora',
        from_id: 'BOBO_CENTRE',
        to_id: 'BANFORA',
        trip_count: 28,
        avg_price: 2500
      },
      {
        id: 'route_4',
        from: 'Ouaga',
        to: 'Ouahigouya',
        from_id: 'OUAGA_CENTRE',
        to_id: 'OUAHIGOUYA',
        trip_count: 22,
        avg_price: 4500
      },
      {
        id: 'route_5',
        from: 'Ouaga',
        to: 'Fada',
        from_id: 'OUAGA_CENTRE',
        to_id: 'FADA',
        trip_count: 18,
        avg_price: 5500
      },
      {
        id: 'route_6',
        from: 'Bobo',
        to: 'Ouaga',
        from_id: 'BOBO_CENTRE',
        to_id: 'OUAGA_CENTRE',
        trip_count: 42,
        avg_price: 8000
      }
    ];
  }

  const response = await fetch(`${BASE_URL}/routes/popular`);
  if (!response.ok) throw new Error('Failed to fetch popular routes');
  return response.json();
}

// ============================================
// TICKET ACTIONS API
// ============================================

/**
 * Récupère un billet par ID
 * DELEGATED TO: ticketService.getTicketById()
 */
export async function getTicketById(ticketId: string): Promise<ModelTicket> {
  const { ticketService } = await import('../services/api/ticket.service');
  const result = await ticketService.getTicketById(ticketId);
  // Map back to snake_case for API compatibility
  return {
    ticket_id: result.id,
    trip_id: result.tripId,
    operator_id: '', // Not in service Ticket type
    operator_name: '', // Not in service Ticket type
    from_stop_id: '', // Not in service Ticket type
    from_stop_name: '', // Not in service Ticket type
    to_stop_id: '', // Not in service Ticket type
    to_stop_name: '', // Not in service Ticket type
    departure_time: result.embarkationTime || '',
    arrival_time: result.embarkationTime || '', // Use same as departure
    passenger_name: result.passengerName,
    passenger_phone: result.passengerPhone,
    passenger_email: '', // Not in service Ticket type
    seat_number: result.seatNumber,
    status: result.status as any,
    qr_code: result.qrCode || '',
    alphanumeric_code: result.id,
    price: result.price,
    currency: 'XOF',
    payment_method: result.paymentMethod,
    payment_id: '',
    booking_id: '',
    created_at: result.createdAt,
    updated_at: result.updatedAt,
    holder_downloaded: false,
    holder_presented: false,
    last_sync_at: new Date().toISOString(),
    can_cancel: false,
    can_transfer: false
  } as any;
}

/**
 * Télécharge un billet PDF
 */
export async function downloadTicket(ticketId: string): Promise<{ pdf_url: string }> {
  if (isDevelopment) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      pdf_url: `https://transportbf.app/tickets/${ticketId}.pdf`
    };
  }

  const response = await fetch(`${BASE_URL}/tickets/${ticketId}/download`, {
    method: 'POST'
  });
  if (!response.ok) throw new Error('Failed to download ticket');
  return response.json();
}

/**
 * Transfère un billet
 */
export async function transferTicket(
  ticketId: string, 
  recipientPhone: string
): Promise<{ transfer_code: string; expires_at: string }> {
  if (isDevelopment) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      transfer_code: `TRF_${Date.now()}`,
      expires_at: new Date(Date.now() + 3600000).toISOString()
    };
  }

  const response = await fetch(`${BASE_URL}/tickets/${ticketId}/transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipient_phone: recipientPhone })
  });
  if (!response.ok) throw new Error('Failed to transfer ticket');
  return response.json();
}

/**
 * Annule un billet
 */
export async function cancelTicket(ticketId: string): Promise<{ refund_amount: number }> {
  if (isDevelopment) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      refund_amount: 10000
    };
  }

  const response = await fetch(`${BASE_URL}/tickets/${ticketId}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Failed to cancel ticket');
  return response.json();
}

// ============================================
// USER PROFILE API
// ============================================

/**
 * Récupère le profil utilisateur
 */
export async function getUserProfile(): Promise<{
  user_id: string;
  name: string;
  email: string;
  phone: string;
  language: string;
  geo_consent: boolean;
  push_consent: boolean;
}> {
  if (isDevelopment) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      user_id: 'usr_001',
      name: 'NAPON Yahasine',
      email: 'yahasine@transportbf.bf',
      phone: '+226 70 12 34 56',
      language: 'fr',
      geo_consent: true,
      push_consent: true
    };
  }

  const response = await fetch(`${BASE_URL}/users/me`);
  if (!response.ok) throw new Error('Failed to fetch user profile');
  return response.json();
}

/**
 * Met à jour le profil utilisateur
 */
export async function updateUserProfile(data: {
  language?: string;
  geo_consent?: boolean;
  push_consent?: boolean;
}): Promise<void> {
  if (isDevelopment) {
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log('Update user profile:', data);
    return;
  }

  const response = await fetch(`${BASE_URL}/users/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to update user profile');
}

/**
 * Exporte les données utilisateur (GDPR)
 */
export async function exportUserData(): Promise<{ download_url: string }> {
  if (isDevelopment) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      download_url: 'https://transportbf.app/exports/user_001.json'
    };
  }

  const response = await fetch(`${BASE_URL}/users/me/export`);
  if (!response.ok) throw new Error('Failed to export user data');
    // Ajout d'un return pour toutes les branches
    return response.json();
}

// ============================================
// AUTH API
// ============================================

/**
 * Connexion utilisateur
 */
export async function login(credentials: {
  phone?: string;
  email?: string;
  password: string;
}): Promise<{
  user: { name: string; email: string; phone: string };
  token: string;
}> {
  if (isDevelopment) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simple validation
    if (credentials.password.length < 6) {
      throw new Error('Mot de passe incorrect');
    }
    
    return {
      user: {
        name: 'NAPON Yahasine',
        email: credentials.email || 'yahasine@transportbf.bf',
        phone: credentials.phone || '+226 70 12 34 56'
      },
      token: 'mock_jwt_token_' + Date.now()
    };
  }

  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }
  
  return response.json();
}

/**
 * Inscription utilisateur
 */
export async function register(data: {
  name: string;
  phone: string;
  email?: string;
  password: string;
}): Promise<{
  user: { name: string; email: string; phone: string };
  token: string;
}> {
  if (isDevelopment) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      user: {
        name: data.name,
        email: data.email || '',
        phone: data.phone
      },
      token: 'mock_jwt_token_' + Date.now()
    };
  }

  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Registration failed');
  }
  
  return response.json();
}

/**
 * Déconnexion utilisateur
 */
export async function logout(): Promise<void> {
  if (isDevelopment) {
    await new Promise(resolve => setTimeout(resolve, 200));
    console.log('Logout');
    return;
  }

  const response = await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST'
  });
  if (!response.ok) throw new Error('Logout failed');
}

// ============================================
// SUPPORT API
// ============================================

/**
 * Envoie un message au support
 */
export async function sendSupportMessage(data: {
  email: string;
  message: string;
  ticket_id?: string;
}): Promise<{ support_ticket_id: string }> {
  if (isDevelopment) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      support_ticket_id: 'sup_' + Date.now()
    };
  }

  const response = await fetch(`${BASE_URL}/support/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to send support message');
  return response.json();
}

// ============================================
// LIVE TRACKING API
// ============================================

export interface VehicleLocation {
  trip_id: string;
  vehicle_id: string;
  latitude: number;
  longitude: number;
  speed_kmh: number;
  bearing: number;
  last_updated: string;
  current_stop?: string;
  next_stop?: string;
  estimated_arrival?: string;
}

/**
 * Récupère la position en temps réel d'un véhicule
 */
export async function getVehicleLocation(tripId: string): Promise<VehicleLocation | null> {
  if (isDevelopment) {
    // Simulate live tracking with random position
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Mock position between Ouaga and Bobo
    const mockLat = 12.3714 + (Math.random() - 0.5) * 2;
    const mockLng = -1.5197 - (Math.random() * 3);
    
    return {
      trip_id: tripId,
      vehicle_id: 'VEH_001',
      latitude: mockLat,
      longitude: mockLng,
      speed_kmh: 75 + Math.random() * 30,
      bearing: 270, // Direction ouest
      last_updated: new Date().toISOString(),
      current_stop: 'Koudougou',
      next_stop: 'Bobo-Dioulasso',
      estimated_arrival: new Date(Date.now() + 7200000).toISOString()
    };
  }

  const response = await fetch(`${BASE_URL}/trips/${tripId}/location`);
  if (!response.ok) return null;
  return response.json();
}

// ============================================
// NEARBY PAGE API (Incidents & Location Sharing)
// ============================================

export interface IncidentReportParams {
  trip_id: string;
  description: string;
  latitude: number | undefined;
  longitude: number | undefined;
  timestamp: string;
}

export interface IncidentReportResponse {
  incident_id: string;
  status: 'created' | 'pending' | 'acknowledged';
  created_at: string;
  message: string;
}

/**
 * Signaler un incident pendant un trajet en cours
 * 
 * BACKEND ENDPOINT: POST /api/incidents
 * 
 * Validation backend:
 * - Vérifier que l'utilisateur a un ticket EMBARKED pour ce trip_id
 * - Vérifier que trip_id correspond à un trajet en cours
 * - Stocker incident avec géolocalisation
 * - Notifier le driver et opérateur
 * 
 * @param params Détails de l'incident (trip_id, description, lat/lon, timestamp)
 * @returns Réponse confirming incident creation
 */
export async function reportIncident(params: IncidentReportParams): Promise<IncidentReportResponse> {
  if (isDevelopment) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('[MOCK] Incident Report:', {
      ...params,
      mock: true
    });
    
    return {
      incident_id: `INCIDENT_${Date.now()}`,
      status: 'created',
      created_at: new Date().toISOString(),
      message: '[DEV MODE] Incident enregistré localement. Endpoint: POST /api/incidents'
    };
  }

  const response = await fetch(`${BASE_URL}/incidents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to report incident');
  }

  return response.json();
}

export interface LocationShareParams {
  trip_id: string;
  latitude: number | undefined;
  longitude: number | undefined;
  timestamp: string;
}

export interface LocationShareResponse {
  share_id: string;
  status: 'shared' | 'acknowledged';
  driver_notified: boolean;
  created_at: string;
  message: string;
}

/**
 * Partager sa position actuelle avec le driver
 * 
 * BACKEND ENDPOINT: POST /api/share-location
 * 
 * Validation backend:
 * - Vérifier que l'utilisateur a un ticket EMBARKED pour ce trip_id
 * - Vérifier que trip progress >= 70% (près de la destination)
 * - Envoyer notification WebSocket au driver
 * - Stocker share location record avec TTL (pour privacy)
 * 
 * @param params Paramètres de partage (trip_id, lat/lon, timestamp)
 * @returns Réponse confirming location share
 */
export async function shareLocation(params: LocationShareParams): Promise<LocationShareResponse> {
  if (isDevelopment) {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    console.log('[MOCK] Location Share:', {
      ...params,
      mock: true
    });
    
    return {
      share_id: `SHARE_${Date.now()}`,
      status: 'shared',
      driver_notified: true,
      created_at: new Date().toISOString(),
      message: '[DEV MODE] Position partagée localement. Endpoint: POST /api/share-location'
    };
  }

  const response = await fetch(`${BASE_URL}/share-location`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to share location');
  }

  return response.json();
}
