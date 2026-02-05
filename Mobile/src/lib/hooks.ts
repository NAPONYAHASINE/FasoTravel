/**
 * Custom React Hooks - TransportBF
 * 
 * Hooks réutilisables pour interagir avec le backend
 * Utilise React Query pattern pour le cache et la gestion d'état
 */

import { useState, useEffect } from 'react';
import * as api from './api';
import type {
  SeatStatus,
  NearbyStation,
  Trip as ModelTrip,
  Ticket as ModelTicket,
  Operator as ModelOperator,
  OperatorStory as ModelOperatorStory,
  VehicleEstimate as ModelVehicleEstimate
} from '../data/models';
import type { VehicleLocation } from '../services/types';
import { liveLocationService } from '../services/api/liveLocation.service';
import { saveTicketMeta, getAllTicketMeta, setLastSync, purgeOldTicketMeta } from './offlineTickets';

// ============================================
// STORIES HOOKS
// ============================================

export function useStories() {
  const [stories, setStories] = useState<api.Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStories() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await api.getActiveStories();
        setStories(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stories');
        console.error('Error fetching stories:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStories();
  }, []);

  return { stories, isLoading, error };
}

// ============================================
// STATIONS HOOKS
// ============================================

export function useStations() {
  const [stations, setStations] = useState<api.Station[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStations() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await api.getStations();
        setStations(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stations');
        console.error('Error fetching stations:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStations();
  }, []);

  return { stations, isLoading, error };
}

export function useNearbyStations(
  latitude: number | null,
  longitude: number | null,
  radius: number = 5
) {
  const [nearbyStations, setNearbyStations] = useState<NearbyStation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (latitude === null || longitude === null) {
      setNearbyStations([]);
      return;
    }

    async function fetchNearbyStations() {
      try {
        setIsLoading(true);
        setError(null);
  const data = await api.getNearbyStations(latitude!, longitude!, radius);
  setNearbyStations(data as unknown as NearbyStation[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load nearby stations');
        console.error('Error fetching nearby stations:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchNearbyStations();
  }, [latitude, longitude, radius]);

  return { nearbyStations, isLoading, error };
}

// ============================================
// TRIPS HOOKS
// ============================================

export function useTrips(searchParams: api.TripSearchParams) {
  const [trips, setTrips] = useState<ModelTrip[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrips() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await api.getTrips(searchParams);
  setTrips(data as unknown as ModelTrip[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load trips');
        console.error('Error fetching trips:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTrips();
  }, [JSON.stringify(searchParams)]);

  return { trips, isLoading, error };
}

export function useTripById(tripId: string | null) {
  const [trip, setTrip] = useState<ModelTrip | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId) {
      setTrip(null);
      return;
    }

    async function fetchTrip() {
      try {
        setIsLoading(true);
        setError(null);
  const data = await api.getTripById(tripId!);
  setTrip(data as unknown as ModelTrip);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load trip');
        console.error('Error fetching trip:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTrip();
  }, [tripId]);

  return { trip, isLoading, error };
}

/**
 * Hook pour rechercher des trajets retour (inverse du trajet aller)
 * Utilisé pour les réservations aller-retour
 */
export function useReturnTrips(
  fromStopId: string | null,
  toStopId: string | null,
  departureDate: string | null
) {
  const [trips, setTrips] = useState<ModelTrip[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fromStopId || !toStopId || !departureDate) {
      setTrips([]);
      return;
    }

    async function fetchReturnTrips() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await api.getTrips({
          from_stop_id: fromStopId ?? undefined,
          to_stop_id: toStopId ?? undefined,
          date: departureDate ?? undefined
        });
  setTrips(data as unknown as ModelTrip[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load return trips');
        console.error('Error fetching return trips:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchReturnTrips();
  }, [fromStopId, toStopId, departureDate]);

  return { trips, isLoading, error };
}

/**
 * Hook pour récupérer le plan de sièges d'un trajet
 * ✅ BACKEND READY: Retourne layout + occupied_seats
 */
export function useSeats(tripId: string) {
  const [seats, setSeats] = useState<{ [key: string]: SeatStatus }>({});
  const [layout, setLayout] = useState<{
    rows: number;
    columns: number;
    aisle_after_column?: number;
    seat_labels?: string[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSeats() {
      try {
        setIsLoading(true);
        setError(null);
        
        // TODO: Remplacer par vraie API GET /trips/:tripId/seats
        // const response = await fetch(`/api/trips/${tripId}/seats`);
        // const data = await response.json();
        // setLayout(data.layout);
        // setSeats(data.occupied_seats);
        
        // MOCK DATA en attendant backend
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock seat statuses (hardcodé pour l'instant)
        const mockSeats: { [key: string]: SeatStatus } = {
          'A1': 'paid',
          'A2': 'paid',
          'B3': 'hold',
          'C5': 'offline_reserved',
          'D7': 'paid'
        };
        
        setSeats(mockSeats);
        // Layout null = utilise props legacy dans SeatMap
        setLayout(null);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load seats');
        console.error('Error fetching seats:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSeats();
  }, [tripId]);

  return { seats, layout, isLoading, error };
}

// ============================================
// TICKETS HOOKS
// ============================================

export function useMyTickets() {
  const [tickets, setTickets] = useState<ModelTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(() => !navigator.onLine);

  const refetch = async () => {
    setIsLoading(true);
    setError(null);

    // If explicitly offline, return cached tickets immediately
    if (!navigator.onLine) {
      try {
        const cached = await getAllTicketMeta();
        if (cached.length) {
    setTickets(cached as unknown as ModelTicket[]);
          setIsOffline(true);
          setError(null);
        } else {
          setError('No cached tickets available offline');
        }
      } catch (e) {
        console.error('Failed to read cached tickets:', e);
        setError(e instanceof Error ? e.message : 'Failed to load cached tickets');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      const data = await api.getMyTickets();
      setTickets(data);
      setIsOffline(false);

      // Save metadata for offline use (best-effort)
      try {
        await Promise.all(data.map(t => saveTicketMeta(t)));
        // update last sync timestamp
        try {
          const nowIso = new Date().toISOString();
          setLastSync(nowIso);
          // purge old metadata (best-effort)
            try {
            await purgeOldTicketMeta(30);
          } catch (purgeErr) {
            console.warn('Failed to purge old ticket metadata:', purgeErr);
          }
        } catch (e) {
          /* ignore */
        }
      } catch (saveErr) {
        console.warn('Failed to save ticket metadata to IndexedDB:', saveErr);
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tickets');

      // Fallback to cached metadata if available
      try {
        const cached = await getAllTicketMeta();
        if (cached.length) {
          setTickets(cached as unknown as ModelTicket[]);
          setIsOffline(true);
          setError(null);
        }
      } catch (cacheErr) {
        console.error('Failed to load cached tickets after fetch error:', cacheErr);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, []);

  return { tickets, isLoading, error, refetch, isOffline };
}

// ============================================
// OPERATORS HOOKS
// ============================================

export function useOperators() {
  const [operators, setOperators] = useState<ModelOperator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOperators() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await api.getOperators();
        setOperators(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load operators');
        console.error('Error fetching operators:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOperators();
  }, []);

  return { operators, isLoading, error };
}

export function useOperatorById(operatorId: string | null) {
  const [operator, setOperator] = useState<ModelOperator | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!operatorId) {
      setOperator(null);
      return;
    }

    async function fetchOperator() {
      try {
        setIsLoading(true);
        setError(null);
  const data = await api.getOperatorById(operatorId!);
        setOperator(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load operator');
        console.error('Error fetching operator:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOperator();
  }, [operatorId]);

  return { operator, isLoading, error };
}

/**
 * Hook pour récupérer les stories d'un opérateur
 * ✅ BACKEND READY: GET /operators/{operator_id}/stories
 */
export function useOperatorStories(operatorId: string | null) {
  const [stories, setStories] = useState<api.OperatorStory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    if (!operatorId) {
      setStories([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
  const data = await api.getOperatorStories(operatorId!);
      setStories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load operator stories');
      console.error('Error fetching operator stories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, [operatorId]);

  return { stories, isLoading, error, refetch };
}

// ============================================
// BOOKING ACTIONS
// ============================================

/**
 * Hook pour créer une réservation HOLD
 */
export function useCreateHoldBooking() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createHold = async (params: api.CreateHoldBookingParams): Promise<api.Ticket | null> => {
    try {
      setIsLoading(true);
      setError(null);
      const ticket = await api.createHoldBooking(params);
      return ticket;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
      console.error('Error creating hold booking:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { createHold, isLoading, error };
}

/**
 * Hook pour confirmer un paiement
 */
export function useConfirmBooking() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async (params: api.ConfirmBookingParams): Promise<api.Ticket | null> => {
    try {
      setIsLoading(true);
      setError(null);
      const ticket = await api.confirmBooking(params);
      return ticket;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm booking');
      console.error('Error confirming booking:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { confirm, isLoading, error };
}

/**
 * Hook pour transférer un billet
 */
export function useTransferTicket() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transfer = async (ticketId: string, recipientEmail: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      await api.transferTicket(ticketId, recipientEmail);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to transfer ticket');
      console.error('Error transferring ticket:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { transfer, isLoading, error };
}

/**
 * Hook pour annuler un billet
 */
export function useCancelTicket() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancel = async (ticketId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      await api.cancelTicket(ticketId);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel ticket');
      console.error('Error cancelling ticket:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { cancel, isLoading, error };
}

// ============================================
// POPULAR ROUTES HOOKS
// ============================================

export function usePopularRoutes() {
  const [routes, setRoutes] = useState<api.PopularRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRoutes() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await api.getPopularRoutes();
        setRoutes(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load popular routes');
        console.error('Error fetching popular routes:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRoutes();
  }, []);

  return { routes, isLoading, error };
}

// ============================================
// TICKET HOOKS
// ============================================

/**
 * Hook pour récupérer un billet par ID
 */
export function useTicketById(ticketId: string | null) {
  const [ticket, setTicket] = useState<ModelTicket | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticketId) {
      setTicket(null);
      return;
    }

    async function fetchTicket() {
      try {
        setIsLoading(true);
        setError(null);
  const data = await api.getTicketById(ticketId!);
        setTicket(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load ticket');
      } finally {
        setIsLoading(false);
      }
    }

    fetchTicket();
  }, [ticketId]);

  return { ticket, isLoading, error };
}

// ============================================
// USER PROFILE HOOKS
// ============================================

/**
 * Hook pour récupérer le profil utilisateur
 */
export function useUserProfile() {
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getUserProfile();
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, []);

  return { profile, isLoading, error, refetch };
}

// ============================================
// LIVE TRACKING HOOKS
// ============================================

/**
 * Hook pour le suivi en temps réel d'un véhicule
 * 
 * Utilise liveLocationService avec WebSocket (prod) ou polling (dev)
 * S'abonne automatiquement quand tripId est fourni
 * 
 * @param tripId ID du trajet (null = désabonné)
 * @param enabled Permet de désactiver temporairement
 */
export function useVehicleLiveTracking(tripId: string | null, enabled: boolean = true) {
  const [location, setLocation] = useState<VehicleLocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId || !enabled) {
      setLocation(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    // S'abonner aux mises à jour du car
    const unsubscribe = liveLocationService.onCarLocationUpdate(
      tripId,
      (vehicleLocation: VehicleLocation) => {
        setLocation(vehicleLocation);
        setIsLoading(false);
      }
    );

    // Cleanup: se désabonner
    return () => {
      unsubscribe();
      setLocation(null);
    };
  }, [tripId, enabled]);

  return { location, isLoading, error };
}

/**
 * Hook pour émettre la position du passager
 * 
 * Envoie périodiquement la position si les conditions sont réunies:
 * - Billet valide (EMBARKED)
 * - Trip status = 'boarding' ou 'in_progress'
 * - À moins de 5 km du trajet
 * 
 * @param ticketId ID du billet (null = désactivé)
 * @param tripId ID du trajet
 * @param tripStatus Status du trip ('boarding' | 'in_progress' | autre)
 * @param userLocation Position GPS de l'utilisateur
 */
export function useEmitLocation(
  ticketId: string | null,
  tripId: string | null,
  tripStatus: string | null,
  userLocation: { lat: number; lon: number } | null
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Vérifications préalables
    if (!ticketId || !tripId || !tripStatus || !userLocation) {
      return;
    }

    // Intervalle d'émission: toutes les 3 minutes (180 sec)
    const EMIT_INTERVAL = 3 * 60 * 1000;

    const emitLocation = async () => {
      setIsLoading(true);
      setError(null);

      try {
        await liveLocationService.emitLocationUpdate({
          ticketId,
          tripId,
          userId: 'USER_001', // TODO: obtenir de l'auth context
          tripStatus: tripStatus as 'boarding' | 'in_progress' | 'cancelled' | 'completed',
          userLatitude: userLocation.lat,
          userLongitude: userLocation.lon
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to emit location';
        setError(message);
        console.error('Error emitting location:', err);
      } finally {
        setIsLoading(false);
      }
    };

    // Émettre immédiatement
    emitLocation();

    // Puis périodiquement
    const interval = setInterval(emitLocation, EMIT_INTERVAL);

    return () => clearInterval(interval);
  }, [ticketId, tripId, tripStatus, userLocation]);

  return { isLoading, error };
}

// ============================================
// PAYMENT METHODS HOOKS
// ============================================

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'mobile_money' | 'card' | 'cash';
  provider: string; // 'orange', 'moov', 'visa', etc.
  logo: string; // URL or emoji
  enabled: boolean;
  min_amount?: number;
  max_amount?: number;
  fees_percentage?: number;
}

/**
 * Hook pour récupérer les moyens de paiement disponibles
 * ✅ BACKEND READY: GET /payment-methods
 */
export function usePaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPaymentMethods() {
      try {
        setIsLoading(true);
        setError(null);
        
        // TODO: Remplacer par vraie API GET /payment-methods
        // const response = await fetch('/api/payment-methods');
        // const data = await response.json();
        // setMethods(data);
        
        // MOCK DATA en attendant backend
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const mockMethods: PaymentMethod[] = [
          {
            id: 'orange_money',
            name: 'Orange Money',
            type: 'mobile_money',
            provider: 'orange',
            logo: '🟠',
            enabled: true,
            min_amount: 100,
            max_amount: 1000000,
            fees_percentage: 1.5
          },
          {
            id: 'moov_money',
            name: 'Moov Money',
            type: 'mobile_money',
            provider: 'moov',
            logo: '🔵',
            enabled: true,
            min_amount: 100,
            max_amount: 1000000,
            fees_percentage: 1.5
          },
          {
            id: 'credit_card',
            name: 'Carte Bancaire',
            type: 'card',
            provider: 'visa',
            logo: '💳',
            enabled: true,
            min_amount: 500,
            fees_percentage: 2.5
          }
        ];
        
        setMethods(mockMethods);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load payment methods');
        console.error('Error fetching payment methods:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPaymentMethods();
  }, []);

  return { methods, isLoading, error };
}

// ============================================
// STORY CATEGORIES HOOKS (ADMIN)
// ============================================

export interface StoryCategory {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  description: string;
  is_default: boolean;
  created_at: string;
}

/**
 * Hook pour récupérer les catégories de stories
 * Utilisé par les admin pour créer de nouvelles stories
 * ✅ BACKEND READY: GET /story-categories
 */
export function useStoryCategories() {
  const [categories, setCategories] = useState<StoryCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // TODO: Remplacer par vraie API GET /story-categories
      // const response = await fetch('/api/story-categories');
      // const data = await response.json();
      // setCategories(data);
      
      // MOCK DATA en attendant backend
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const mockCategories: StoryCategory[] = [
        {
          id: 'promo',
          name: 'Promotions',
          slug: 'PROMO',
          emoji: '🎁',
          description: 'Offres promotionnelles',
          is_default: true,
          created_at: new Date().toISOString()
        },
        {
          id: 'new',
          name: 'Nouveautés',
          slug: 'NEW',
          emoji: '✨',
          description: 'Nouvelles routes et services',
          is_default: true,
          created_at: new Date().toISOString()
        },
        {
          id: 'destination',
          name: 'Destinations',
          slug: 'DESTINATION',
          emoji: '🏖️',
          description: 'Découvrez le Burkina Faso',
          is_default: true,
          created_at: new Date().toISOString()
        },
        {
          id: 'tips',
          name: 'Conseils',
          slug: 'TIPS',
          emoji: '💡',
          description: 'Conseils pour voyager',
          is_default: true,
          created_at: new Date().toISOString()
        }
      ];
      
      setCategories(mockCategories);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
      console.error('Error fetching story categories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, []);

  return { categories, isLoading, error, refetch };
}

/**
 * Hook pour créer une nouvelle catégorie de story (ADMIN ONLY)
 * ✅ BACKEND READY: POST /story-categories
 */
export function useCreateStoryCategory() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCategory = async (params: {
    name: string;
    slug: string;
    emoji: string;
    description: string;
  }): Promise<StoryCategory | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // TODO: Remplacer par vraie API POST /story-categories
      // const response = await fetch('/api/story-categories', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(params)
      // });
      // const data = await response.json();
      // return data;
      
      // MOCK RESPONSE
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newCategory: StoryCategory = {
        id: `cat_${Date.now()}`,
        name: params.name,
        slug: params.slug,
        emoji: params.emoji,
        description: params.description,
        is_default: false,
        created_at: new Date().toISOString()
      };
      
      return newCategory;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category');
      console.error('Error creating story category:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { createCategory, isLoading, error };
}

/**
 * Hook pour publier une nouvelle story (ADMIN ONLY)
 * ✅ BACKEND READY: POST /stories
 */
export function usePublishStory() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const publishStory = async (params: {
    title: string;
    description: string;
    emoji: string;
    category_id: string;
    gradient_from: string;
    gradient_to: string;
    expires_at?: string;
  }): Promise<api.Story | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // TODO: Remplacer par vraie API POST /stories
      // const response = await fetch('/api/stories', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(params)
      // });
      // const data = await response.json();
      // return data;
      
      // MOCK RESPONSE
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newStory: api.Story = {
        id: `story_${Date.now()}`,
        title: params.title,
        description: params.description,
        emoji: params.emoji,
        category: 'NEW', // Will be mapped from category_id
        gradient: `from-${params.gradient_from}-400 to-${params.gradient_to}-600`,
        is_active: true,
        priority: 0,
        created_by: 'admin',
        created_at: new Date().toISOString()
      };
      
      return newStory;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish story');
      console.error('Error publishing story:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { publishStory, isLoading, error };
}

// ============================================
// NOTIFICATIONS HOOKS
// ============================================

/**
 * Hook pour obtenir le nombre de notifications non-lues
 * Écoute les changements de localStorage mises à jour par NotificationsPage
 */
export function useUnreadNotificationCount() {
  const [unreadCount, setUnreadCount] = useState(() => {
    const stored = localStorage.getItem('notificationsUnreadCount');
    return stored ? parseInt(stored, 10) : 0;
  });

  useEffect(() => {
    // Listener pour détecter les changements dans NotificationsPage
    const handleStorageChange = () => {
      const stored = localStorage.getItem('notificationsUnreadCount');
      setUnreadCount(stored ? parseInt(stored, 10) : 0);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return { unreadCount };
}

// ============================================
// NEARBY PAGE HOOKS (Incidents & Location)
// ============================================

/**
 * Hook pour signaler un incident pendant un trajet en cours
 * 
 * USAGE:
 * ```
 * const { reportIncident, isLoading, error } = useReportIncident();
 * 
 * const handleReport = async () => {
 *   const result = await reportIncident({
 *     trip_id: embarkedTicket.trip_id,
 *     description: 'Accident sur la route',
 *     latitude: vehicleLocation.current_latitude,
 *     longitude: vehicleLocation.current_longitude,
 *     timestamp: new Date().toISOString()
 *   });
 *   if (result) console.log('Incident créé:', result.incident_id);
 * };
 * ```
 */
export function useReportIncident() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reportIncident = async (
    params: api.IncidentReportParams
  ): Promise<api.IncidentReportResponse | null> => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await api.reportIncident(params);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to report incident';
      setError(message);
      console.error('Error reporting incident:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { reportIncident, isLoading, error };
}

/**
 * Hook pour partager sa position avec le driver
 * 
 * USAGE:
 * ```
 * const { shareLocation, isLoading, error } = useShareLocation();
 * 
 * const handleShare = async () => {
 *   const result = await shareLocation({
 *     trip_id: embarkedTicket.trip_id,
 *     latitude: vehicleLocation.current_latitude,
 *     longitude: vehicleLocation.current_longitude,
 *     timestamp: new Date().toISOString()
 *   });
 *   if (result) console.log('Position partagée');
 * };
 * ```
 */
export function useShareLocation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shareLocation = async (
    params: api.LocationShareParams
  ): Promise<api.LocationShareResponse | null> => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await api.shareLocation(params);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to share location';
      setError(message);
      console.error('Error sharing location:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { shareLocation, isLoading, error };
}
