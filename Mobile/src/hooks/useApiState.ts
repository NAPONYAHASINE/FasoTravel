/**
 * useApiState Hook - TransportBF Mobile
 * 
 * Hook réutilisable pour gérer:
 * - Fetching de données
 * - Loading state
 * - Error handling
 * - localStorage fallback
 * - Dual-mode (dev/prod)
 * 
 * ✅ Pattern identique à Societe
 */

import { useState, useEffect, useRef } from 'react';
import { storageService } from '../services/storage/localStorage.service';
import { isDevelopment } from '../services/config';

interface UseApiStateOptions<T> {
  /** Retourner mock data si disponible */
  mockData?: T | (() => T);
  /** Forcer le mode dev */
  forceDevMode?: boolean;
  /** Cache TTL en ms */
  cacheTTL?: number;
  /** Skip le fetching initial */
  skip?: boolean;
  /** Logger les erreurs */
  debug?: boolean;
}

/**
 * Hook pour récupérer et gérer l'état d'une ressource API
 * 
 * @param cacheKey Clé pour le localStorage
 * @param fetcher Fonction qui récupère les données
 * @param initialValue Valeur initiale
 * @param options Options supplémentaires
 * 
 * @returns [data, setData, isLoading, error, refetch]
 */
export function useApiState<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  initialValue: T | (() => T),
  options?: UseApiStateOptions<T>
): [T, (value: T) => void, boolean, Error | null, () => Promise<void>] {
  const isDevMode = options?.forceDevMode ?? isDevelopment();
  const shouldUseMockData = isDevMode || options?.mockData !== undefined;

  // État
  const [data, setData] = useState<T>(() => {
    // 1. Essayer le localStorage
    const cached = storageService.get<T>(cacheKey);
    if (cached) return cached;

    // 2. Sinon, utiliser initialValue
    if (typeof initialValue === 'function') {
      return (initialValue as () => T)();
    }
    return initialValue;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Ref pour éviter fetch multiple au mount
  const hasFetched = useRef(false);
  const isMounted = useRef(true);

  // Effect: Fetcher les données
  useEffect(() => {
    isMounted.current = true;

    if (options?.skip || hasFetched.current) {
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let fetchedData: T;

        if (shouldUseMockData && options?.mockData) {
          // Utiliser mock data
          fetchedData =
            typeof options.mockData === 'function'
              ? (options.mockData as () => T)()
              : options.mockData;

          if (options?.debug) {
            console.log(`📦 [${cacheKey}] Using mock data`, fetchedData);
          }
        } else {
          // Fetcher depuis API
          fetchedData = await fetcher();

          if (options?.debug) {
            console.log(`✅ [${cacheKey}] Fetched from API`, fetchedData);
          }
        }

        if (!isMounted.current) return;

        setData(fetchedData);
        storageService.set(cacheKey, fetchedData, options?.cacheTTL);
      } catch (err) {
        if (!isMounted.current) return;

        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);

        if (options?.debug) {
          console.error(`❌ [${cacheKey}] Error:`, error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    hasFetched.current = true;
    fetchData();

    return () => {
      isMounted.current = false;
    };
  }, [cacheKey, fetcher, shouldUseMockData, options?.mockData, options?.cacheTTL, options?.debug, options?.skip]);

  // Fonction pour refetch manuellement
  const refetch = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const fetchedData = await fetcher();

      if (!isMounted.current) return;

      setData(fetchedData);
      storageService.set(cacheKey, fetchedData, options?.cacheTTL);

      if (options?.debug) {
        console.log(`🔄 [${cacheKey}] Refetched`, fetchedData);
      }
    } catch (err) {
      if (!isMounted.current) return;

      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);

      if (options?.debug) {
        console.error(`❌ [${cacheKey}] Refetch error:`, error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return [data, setData, isLoading, error, refetch];
}

/**
 * Hook plus simple pour juste fetcher une ressource unique
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  dependencies: any[] = [],
  options?: UseApiStateOptions<T>
): { data: T | null; isLoading: boolean; error: Error | null; refetch: () => Promise<void> } {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await fetcher();

        if (!isMounted.current) return;

        setData(result);
      } catch (err) {
        if (!isMounted.current) return;

        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);

        if (options?.debug) {
          console.error('❌ useApi error:', error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted.current = false;
    };
  }, dependencies);

  const refetch = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await fetcher();

      if (!isMounted.current) return;

      setData(result);
    } catch (err) {
      if (!isMounted.current) return;

      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return { data, isLoading, error, refetch };
}
