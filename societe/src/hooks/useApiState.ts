import { useState, useEffect, useCallback, useRef } from 'react';
import { isLocalMode } from '../services/config';
import { storageService } from '../services/storage/localStorage.service';
import { logger } from '../utils/logger';

/**
 * Hook personnalisé pour gérer l'état avec persistance intelligente
 * 
 * MODE LOCAL : Utilise localStorage (développement)
 * MODE API : Utilise les services API avec cache en mémoire (production)
 * 
 * @param key - Clé de stockage localStorage
 * @param fetchFn - Fonction pour récupérer les données depuis l'API
 * @param initialValue - Valeur initiale ou fonction qui retourne la valeur initiale
 * @param options - Options de configuration
 * 
 * @example
 * // Utilisation dans DataContext
 * const [trips, setTrips, { loading, error, refetch }] = useApiState(
 *   'trips',
 *   () => tripService.list(),
 *   []
 * );
 */
export function useApiState<T>(
  key: string,
  fetchFn: (() => Promise<T>) | null,
  initialValue: T | (() => T),
  options: { 
    silent?: boolean; 
    skipEmptyArrays?: boolean;
    autoFetch?: boolean;
  } = {}
): [
  T,
  React.Dispatch<React.SetStateAction<T>>,
  {
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
  }
] {
  const { silent = false, skipEmptyArrays = false, autoFetch = true } = options;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isMounted = useRef(true);

  // ✅ Initialiser l'état
  const [state, setState] = useState<T>(() => {
    // En mode local, charger depuis localStorage
    if (isLocalMode()) {
      const saved = (storageService.get as any)(key) as T;
      
      if (saved !== null && saved !== undefined) {
        // Vérifier si c'est un tableau vide (si l'option est activée)
        if (skipEmptyArrays && Array.isArray(saved) && saved.length === 0) {
          const value = typeof initialValue === 'function' 
            ? (initialValue as () => T)() 
            : initialValue;
          
          if (!silent) {
            logger.info(`useApiState: ${key} - localStorage vide, utilisation valeur initiale`);
          }
          
          return value;
        }
        
        if (!silent) {
          const count = Array.isArray(saved) ? saved.length : 'données';
          logger.info(`useApiState: ${key} - ${count} chargé(es) depuis localStorage`);
        }
        
        return saved;
      }
    }
    
    // Sinon, utiliser la valeur initiale
    const value = typeof initialValue === 'function' 
      ? (initialValue as () => T)() 
      : initialValue;
    
    if (!silent) {
      logger.info(`useApiState: ${key} - Initialisation avec valeur par défaut`);
    }
    
    return value;
  });

  // ✅ Fonction pour récupérer les données depuis l'API
  const refetch = useCallback(async () => {
    // Si pas de fonction fetch ou en mode local, skip
    if (!fetchFn || isLocalMode()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchFn();
      
      if (isMounted.current) {
        setState(data);
        
        if (!silent) {
          const count = Array.isArray(data) ? data.length : 'données';
          logger.info(`useApiState: ${key} - ${count} chargé(es) depuis API`);
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur inconnue');
      
      if (isMounted.current) {
        setError(error);
        logger.error(`useApiState: ${key} - Erreur chargement API`, error);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [fetchFn, key, silent]);

  // ✅ Auto-fetch au montage (seulement en mode API)
  useEffect(() => {
    if (autoFetch && !isLocalMode() && fetchFn) {
      refetch();
    }
  }, [autoFetch, fetchFn, refetch]);

  // ✅ Sauvegarder dans localStorage en mode local
  useEffect(() => {
    if (isLocalMode()) {
      // Option pour skip les tableaux vides
      if (skipEmptyArrays && Array.isArray(state) && state.length === 0) {
        return;
      }
      
      (storageService.set as any)(key, state);
      
      if (!silent) {
        const count = Array.isArray(state) ? state.length : 'données';
        logger.info(`useApiState: ${key} - ${count} sauvegardé(es) dans localStorage`);
      }
    }
  }, [key, state, silent, skipEmptyArrays]);

  // ✅ Cleanup au démontage
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  return [state, setState, { loading, error, refetch }];
}
