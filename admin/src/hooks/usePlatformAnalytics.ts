/**
 * Hook réutilisable pour les analytics plateforme (non-financières)
 * Backend-ready: Gère le loading, erreurs, cache, et appels API
 * Version 1.0
 * 
 * USAGE:
 * ```tsx
 * const { weeklyRegistrations, stationActivities, loading, error } = usePlatformAnalytics();
 * ```
 */

import { useState, useEffect } from 'react';
import { platformAnalyticsService } from '../services/platformAnalyticsService';
import type {
  PlatformGrowthMetrics,
  WeeklyRegistration,
  StationActivity,
} from '../services/platformAnalyticsService';
import { useAdminApp } from '../context/AdminAppContext';

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export interface UsePlatformAnalyticsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // En millisecondes
}

export interface UsePlatformAnalyticsReturn {
  // Données
  weeklyRegistrations: WeeklyRegistration[];
  stationActivities: StationActivity[];
  metrics: PlatformGrowthMetrics | null;
  
  // État
  loading: boolean;
  error: string | null;
  
  // Actions
  refresh: () => Promise<void>;
  
  // Méta
  lastUpdated: Date | null;
}

/**
 * Hook principal pour récupérer et gérer les analytics plateforme
 */
export function usePlatformAnalytics(
  options: UsePlatformAnalyticsOptions = {}
): UsePlatformAnalyticsReturn {
  const {
    autoRefresh = false,
    refreshInterval = 60000, // 1 minute
  } = options;

  const { transportCompanies, passengers, stations } = useAdminApp();
  
  const [metrics, setMetrics] = useState<PlatformGrowthMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  /**
   * Récupère les métriques depuis le service
   */
  const fetchMetrics = async () => {
    // Ne pas recharger si pas de données de base
    if (!transportCompanies || !passengers || !stations) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await platformAnalyticsService.getPlatformGrowthMetrics(
        transportCompanies,
        passengers,
        stations
      );

      setMetrics(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      console.error('❌ [usePlatformAnalytics] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Charge les données au montage ET quand les données changent
   */
  useEffect(() => {
    fetchMetrics();
  }, [transportCompanies, passengers, stations]); // 🔥 FIX: Un seul useEffect

  /**
   * Auto-refresh si activé
   */
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchMetrics();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  return {
    weeklyRegistrations: metrics?.weeklyRegistrations || [],
    stationActivities: metrics?.stationActivities || [],
    metrics,
    loading,
    error,
    refresh: fetchMetrics,
    lastUpdated,
  };
}

// ============================================================================
// HOOKS SPÉCIALISÉS
// ============================================================================

/**
 * Hook pour récupérer uniquement les inscriptions hebdomadaires
 */
export function useWeeklyRegistrations() {
  const { transportCompanies, passengers } = useAdminApp();
  const [data, setData] = useState<WeeklyRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!transportCompanies || !passengers) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    platformAnalyticsService
      .getWeeklyRegistrations(transportCompanies, passengers)
      .then(result => {
        setData(result);
        setLoading(false);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        setLoading(false);
      });
  }, [transportCompanies?.length, passengers?.length]);

  return { data, loading, error };
}

/**
 * Hook pour récupérer uniquement l'activité des stations
 */
export function useStationActivities() {
  const { stations } = useAdminApp();
  const [data, setData] = useState<StationActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!stations) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    platformAnalyticsService
      .getStationActivities(stations)
      .then(result => {
        setData(result);
        setLoading(false);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        setLoading(false);
      });
  }, [stations?.length]);

  return { data, loading, error };
}