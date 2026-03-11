/**
 * Hook réutilisable pour la gestion des réservations
 * Backend-ready: Gère le loading, erreurs, cache, et appels API
 * Version 3.0 - Compatible React 18 StrictMode
 * 
 * ⚠️ RAPPEL: RÉSERVATIONS ≠ BILLETS
 * Réservations: EN_ATTENTE, CONFIRMÉ, TERMINÉ, ANNULÉ
 * Billets: ACTIF, EMBARQUÉ, EXPIRÉ, ANNULÉ
 * 
 * USAGE:
 * ```tsx
 * const { bookings, stats, loading, error, refresh } = useBookings();
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { bookingService } from '../services/bookingService';
import type { Booking, BookingStats } from '../services/bookingService';

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export interface UseBookingsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  loadStats?: boolean;
}

export interface UseBookingsReturn {
  bookings: Booking[];
  stats: BookingStats | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

/**
 * Hook principal pour récupérer et gérer les réservations
 */
export function useBookings(
  options: UseBookingsOptions = {}
): UseBookingsReturn {
  const {
    autoRefresh = false,
    refreshInterval = 30000,
    loadStats = true,
  } = options;
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchBookings = useCallback(async () => {
    setError(null);

    try {
      const bookingsData = await bookingService.getAllBookings();
      setBookings(bookingsData || []);

      if (loadStats) {
        const statsData = await bookingService.getBookingStats();
        setStats(statsData);
      }

      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      console.error('❌ [useBookings] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [loadStats]);

  /**
   * Charge les données au montage - Compatible React 18 StrictMode
   */
  useEffect(() => {
    let cancelled = false;
    
    const load = async () => {
      setError(null);
      
      try {
        const bookingsData = await bookingService.getAllBookings();
        if (!cancelled) setBookings(bookingsData || []);
        
        if (loadStats) {
          const statsData = await bookingService.getBookingStats();
          if (!cancelled) setStats(statsData);
        }
        
        if (!cancelled) {
          setLastUpdated(new Date());
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erreur inconnue');
          setLoading(false);
        }
      }
    };
    
    load();
    return () => { cancelled = true; };
  }, [loadStats]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchBookings, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchBookings]);

  return {
    bookings,
    stats,
    loading,
    error,
    refresh: fetchBookings,
    lastUpdated,
  };
}

/**
 * Hook pour récupérer uniquement les statistiques de réservations
 */
export function useBookingStats() {
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    
    bookingService
      .getBookingStats()
      .then(result => {
        if (!cancelled) {
          setStats(result);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erreur inconnue');
          setLoading(false);
        }
      });
    
    return () => { cancelled = true; };
  }, []);

  return { stats, loading, error };
}