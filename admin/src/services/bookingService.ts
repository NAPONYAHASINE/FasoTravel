/**
 * Service Réservations FasoTravel Admin
 * Backend-ready: Mock service qui peut être facilement remplacé par de vrais appels API
 * Version 3.0 - ARCHITECTURE BACKEND-READY 100% CONFORME
 * 
 * RESPONSABILITÉS:
 * - Fournir l'interface entre le frontend et le backend
 * - En mode MOCK: utilise les données de /lib/adminMockData.ts
 * - En mode PRODUCTION: effectue de vrais appels API
 * - ZÉRO génération de données dans ce service
 * 
 * STATUTS DES BILLETS (LOGIQUE MÉTIER):
 * 
 * - ACTIF: Billet payé et valide, date de départ PAS ENCORE PASSÉE
 *   → Le billet est utilisable, le passager peut encore embarquer
 * 
 * - EMBARQUÉ: Passager ACTUELLEMENT dans le car (voyage en cours)
 *   → Le passager a scanné son billet et est monté dans le véhicule
 *   → Statut temporaire pendant le trajet
 * 
 * - EXPIRÉ: Date de départ PASSÉE (trajet terminé)
 *   → Inclut les passagers qui ont voyagé (anciens EMBARQUÉ)
 *   → Inclut les passagers qui ne sont jamais venus embarquer
 *   → Statut automatique basé sur la date
 * 
 * - ANNULÉ: Billet annulé (remboursement possible)
 *   → Annulé manuellement avant le départ
 */

import { AppConfig } from '../config/app.config';
import { apiService } from './apiService';
import { 
  MOCK_BOOKINGS, 
  MOCK_BOOKING_STATS,
  type Booking,
  type BookingStats,
  type BookingStatus 
} from '../lib/adminMockData';

// ============================================================================
// RE-EXPORT TYPES (pour compatibilité)
// ============================================================================

export type { Booking, BookingStats, BookingStatus };

// ============================================================================
// CACHE EN MÉMOIRE
// ============================================================================

let cachedBookings: Booking[] | null = null;
let cachedStats: BookingStats | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60000; // 1 minute

// ============================================================================
// SERVICE API
// ============================================================================

class BookingService {
  /**
   * Récupère toutes les réservations
   * Mode MOCK: Retourne MOCK_BOOKINGS
   * Mode PRODUCTION: Appel GET /api/admin/bookings
   */
  async getAllBookings(): Promise<Booking[]> {
    // ✅ CACHE: Seulement si on a déjà des données et que le cache n'est pas expiré
    const now = Date.now();
    if (cachedBookings && cachedBookings.length > 0 && (now - cacheTimestamp < CACHE_DURATION)) {
      console.log('[BookingService] 📦 Utilisation du cache');
      return cachedBookings;
    }

    if (AppConfig.isMock) {
      // ✅ MODE MOCK: Utilise les données centralisées
      console.log('[BookingService] 📦 Mode MOCK - Chargement depuis /lib/adminMockData.ts');
      console.log(`[BookingService] ✅ ${MOCK_BOOKINGS.length} réservations chargées`);
      cachedBookings = MOCK_BOOKINGS;
      cacheTimestamp = now;
      return MOCK_BOOKINGS;
    }

    // ✅ MODE PRODUCTION: Appel API réel
    console.log('[BookingService] 🌐 Mode PRODUCTION - Appel API /admin/bookings');
    const response = await apiService.get<Booking[]>('/admin/bookings');
    cachedBookings = response.data!;
    cacheTimestamp = now;
    return response.data!;
  }

  /**
   * Récupère les statistiques des réservations
   * Mode MOCK: Retourne MOCK_BOOKING_STATS
   * Mode PRODUCTION: Appel GET /api/admin/bookings/stats
   */
  async getBookingStats(): Promise<BookingStats> {
    // ✅ CACHE: Seulement si on a déjà des données et que le cache n'est pas expiré
    const now = Date.now();
    if (cachedStats && (now - cacheTimestamp < CACHE_DURATION)) {
      console.log('[BookingService] 📦 Utilisation du cache stats');
      return cachedStats;
    }

    if (AppConfig.isMock) {
      // ✅ MODE MOCK: Utilise les données centralisées
      console.log('[BookingService] 📦 Mode MOCK - Stats depuis /lib/adminMockData.ts');
      console.log('[BookingService] ✅ Stats chargées:', MOCK_BOOKING_STATS);
      cachedStats = MOCK_BOOKING_STATS;
      return MOCK_BOOKING_STATS;
    }

    // ✅ MODE PRODUCTION: Appel API réel
    console.log('[BookingService] 🌐 Mode PRODUCTION - Appel API /admin/bookings/stats');
    const response = await apiService.get<BookingStats>('/admin/bookings/stats');
    cachedStats = response.data!;
    return response.data!;
  }

  /**
   * Récupère une réservation par ID
   * Mode MOCK: Recherche dans MOCK_BOOKINGS
   * Mode PRODUCTION: Appel GET /api/admin/bookings/:id
   */
  async getBookingById(bookingId: string): Promise<Booking | null> {
    if (AppConfig.isMock) {
      const booking = MOCK_BOOKINGS.find(b => b.booking_id === bookingId);
      return booking || null;
    }

    const response = await apiService.get<Booking>(`/admin/bookings/${bookingId}`);
    return response.data ?? null;
  }

  /**
   * Invalide le cache (utile après création/modification)
   */
  clearCache(): void {
    cachedBookings = null;
    cachedStats = null;
    cacheTimestamp = 0;
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const bookingService = new BookingService();
export default bookingService;