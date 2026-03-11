/**
 * Hook réutilisable pour la supervision des trajets
 * Backend-ready: Gère le loading, erreurs, cache, et appels API
 * Version 1.0
 * 
 * USAGE:
 * ```tsx
 * const { summaries, globalStats, loading, error } = useTrips();
 * ```
 */

import { useState, useEffect, useRef } from 'react';
import { tripService } from '../services/tripService';
import type { CompanyTripSummary, TripGlobalStats } from '../services/tripService';
import { useAdminApp } from '../context/AdminAppContext';

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export interface UseTripsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // En millisecondes
  loadGlobalStats?: boolean; // Charger aussi les stats globales
}

export interface UseTripsReturn {
  // Données
  summaries: CompanyTripSummary[];
  globalStats: TripGlobalStats | null;
  
  // État
  loading: boolean;
  error: string | null;
  
  // Actions
  refresh: () => Promise<void>;
  
  // Méta
  lastUpdated: Date | null;
}

/**
 * Hook principal pour récupérer et gérer les résumés de trajets
 */
export function useTrips(
  options: UseTripsOptions = {}
): UseTripsReturn {
  const {
    autoRefresh = false,
    refreshInterval = 60000, // 1 minute (les trajets changent en temps réel)
    loadGlobalStats = true,
  } = options;

  const { transportCompanies } = useAdminApp();
  
  const [summaries, setSummaries] = useState<CompanyTripSummary[]>([]);
  const [globalStats, setGlobalStats] = useState<TripGlobalStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const loadedRef = useRef(false);

  /**
   * Récupère les données depuis le service
   */
  const fetchTrips = async () => {
    // Ne pas charger si pas de données de base
    if (!transportCompanies || transportCompanies.length === 0) {
      setSummaries([]);
      setGlobalStats(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Charger résumés par société
      const summariesData = await tripService.getCompanyTripSummaries(transportCompanies);
      setSummaries(summariesData);

      // Charger stats globales si demandé
      if (loadGlobalStats) {
        const statsData = await tripService.getGlobalTripStats(transportCompanies);
        setGlobalStats(statsData);
      }

      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      console.error('❌ [useTrips] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Charge les données au montage
   */
  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      fetchTrips();
    }
  }, []); // ✅ Stable - charge une seule fois

  /**
   * Recharge quand les données de base changent
   */
  useEffect(() => {
    if (loadedRef.current && transportCompanies) {
      fetchTrips();
    }
  }, [transportCompanies?.length, loadGlobalStats]);

  /**
   * Auto-refresh si activé
   */
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchTrips();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  return {
    summaries,
    globalStats,
    loading,
    error,
    refresh: fetchTrips,
    lastUpdated,
  };
}

// ============================================================================
// HOOKS SPÉCIALISÉS
// ============================================================================

/**
 * Hook pour récupérer uniquement les statistiques globales
 */
export function useTripGlobalStats() {
  const { transportCompanies } = useAdminApp();
  const [stats, setStats] = useState<TripGlobalStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!transportCompanies || transportCompanies.length === 0) {
      setStats(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    tripService
      .getGlobalTripStats(transportCompanies)
      .then(result => {
        setStats(result);
        setLoading(false);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        setLoading(false);
      });
  }, [transportCompanies?.length]);

  return { stats, loading, error };
}

/**
 * Hook pour récupérer le résumé d'une société spécifique
 */
export function useCompanyTrips(companyId?: string) {
  const { transportCompanies } = useAdminApp();
  const [summary, setSummary] = useState<CompanyTripSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId || !transportCompanies) {
      setSummary(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    tripService
      .getCompanyTripSummary(companyId, transportCompanies)
      .then(result => {
        setSummary(result);
        setLoading(false);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        setLoading(false);
      });
  }, [companyId, transportCompanies?.length]);

  return { summary, loading, error };
}