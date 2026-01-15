/**
 * Hook personnalisé pour gérer les appels API avec loading et erreurs
 * 
 * Utilisation :
 * ```tsx
 * const { execute, loading, error } = useApi(() => ticketService.create(data));
 * 
 * const handleSubmit = async () => {
 *   try {
 *     const result = await execute();
 *     toast.success('Opération réussie');
 *   } catch (err) {
 *     toast.error(error || 'Une erreur est survenue');
 *   }
 * };
 * ```
 */

import { useState, useCallback } from 'react';
import { logger } from '../utils/logger';

export interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: () => Promise<T>;
  reset: () => void;
}

export function useApi<T>(
  apiFunction: () => Promise<T>
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (): Promise<T> => {
    setLoading(true);
    setError(null);

    try {
      logger.debug('🚀 Exécution API call');
      const result = await apiFunction();
      setData(result);
      logger.debug('✅ API call réussie');
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      logger.error('❌ Erreur API call', { error: errorMessage });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
}

/**
 * Hook pour charger des données automatiquement au montage
 * 
 * Utilisation :
 * ```tsx
 * const { data: tickets, loading, error, refetch } = useAsyncData(() => ticketService.list());
 * ```
 */
export function useAsyncData<T>(
  apiFunction: () => Promise<T>,
  deps: React.DependencyList = []
): UseApiResult<T> & { refetch: () => Promise<void> } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiFunction();
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      logger.error('❌ Erreur chargement données', { error: errorMessage });
    } finally {
      setLoading(false);
    }
  }, deps);

  // Charger au montage
  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const execute = useCallback(async (): Promise<T> => {
    await fetchData();
    if (data === null) {
      throw new Error('Aucune donnée disponible');
    }
    return data;
  }, [fetchData, data]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    execute,
    reset,
    refetch,
  };
}

// Import React pour useEffect
import * as React from 'react';
