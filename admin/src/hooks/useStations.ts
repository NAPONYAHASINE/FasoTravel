/**
 * Hook réutilisable pour la gestion des gares/stations
 * Backend-ready: Gère le loading, erreurs, cache, et appels API
 * Version 1.0
 * 
 * USAGE:
 * ```tsx
 * const { stationStats, globalStats, loading, error } = useStations();
 * ```
 */

import { useState, useEffect, useRef } from 'react';
import { stationService } from '../services/stationService';
import type { StationStats, GlobalStationStats } from '../services/stationService';
import { useAdminApp } from '../context/AdminAppContext';

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export interface UseStationsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // En millisecondes
  loadGlobalStats?: boolean; // Charger aussi les stats globales
}

export interface UseStationsReturn {
  // Données
  stationStats: StationStats[];
  globalStats: GlobalStationStats | null;
  
  // État
  loading: boolean;
  error: string | null;
  
  // Actions
  refresh: () => Promise<void>;
  
  // Méta
  lastUpdated: Date | null;
}

/**
 * Hook principal pour récupérer et gérer les statistiques des gares
 */
export function useStations(
  options: UseStationsOptions = {}
): UseStationsReturn {
  const {
    autoRefresh = false,
    refreshInterval = 60000, // 1 minute (les ventes changent fréquemment)
    loadGlobalStats = true,
  } = options;

  const { stations } = useAdminApp();
  
  const [stationStats, setStationStats] = useState<StationStats[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const loadedRef = useRef(false);

  /**
   * Récupère les données depuis le service
   */
  const fetchStations = async () => {
    // Ne pas charger si pas de données de base
    if (!stations || stations.length === 0) {
      setStationStats([]);
      setGlobalStats(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Charger stats par gare
      const statsData = await stationService.getAllStationStats(stations);
      setStationStats(statsData);

      // Charger stats globales si demandé
      if (loadGlobalStats) {
        const globalData = await stationService.getGlobalStationStats(stations);
        setGlobalStats(globalData);
      }

      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      console.error('❌ [useStations] Error:', err);
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
      fetchStations();
    }
  }, []); // ✅ Stable - charge une seule fois

  /**
   * Recharge quand les données de base changent
   */
  useEffect(() => {
    if (loadedRef.current && stations) {
      fetchStations();
    }
  }, [stations?.length, loadGlobalStats]);

  /**
   * Auto-refresh si activé
   */
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchStations();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  return {
    stationStats,
    globalStats,
    loading,
    error,
    refresh: fetchStations,
    lastUpdated,
  };
}

// ============================================================================
// HOOKS SPÉCIALISÉS
// ============================================================================

/**
 * Hook pour récupérer uniquement les statistiques globales
 */
export function useGlobalStationStats() {
  const { stations } = useAdminApp();
  const [stats, setStats] = useState<GlobalStationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!stations || stations.length === 0) {
      setStats(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    stationService
      .getGlobalStationStats(stations)
      .then(result => {
        setStats(result);
        setLoading(false);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        setLoading(false);
      });
  }, [stations?.length]);

  return { stats, loading, error };
}

/**
 * Hook pour récupérer les stats d'une gare spécifique
 */
export function useStationDetail(stationId?: string) {
  const { stations } = useAdminApp();
  const [stats, setStats] = useState<StationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!stationId || !stations) {
      setStats(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    stationService
      .getStationStats(stationId, stations)
      .then(result => {
        setStats(result);
        setLoading(false);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        setLoading(false);
      });
  }, [stationId, stations?.length]);

  return { stats, loading, error };
}

/**
 * Hook helper pour obtenir les stats d'une gare à partir de la liste
 */
export function useStationStatsMap() {
  const { stationStats } = useStations();
  
  // Crée un Map pour un accès rapide par station_id
  const statsMap = new Map<string, StationStats>();
  stationStats.forEach(stat => {
    statsMap.set(stat.station_id, stat);
  });
  
  return statsMap;
}