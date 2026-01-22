import { useState, useEffect } from 'react';
import { storageService } from '../services/storage/localStorage.service';
import { logger } from '../utils/logger';

/**
 * Hook personnalisé pour gérer l'état avec persistance automatique dans localStorage
 * 
 * @param key - Clé de stockage localStorage
 * @param initialValue - Valeur initiale ou fonction qui retourne la valeur initiale
 * @param options - Options de configuration
 * @returns [state, setState] - Tuple identique à useState
 * 
 * @example
 * // Avec valeur initiale simple
 * const [trips, setTrips] = usePersistedState('trips', []);
 * 
 * // Avec fonction d'initialisation
 * const [trips, setTrips] = usePersistedState('trips', () => [...mockTrips]);
 * 
 * // Avec logging désactivé
 * const [trips, setTrips] = usePersistedState('trips', [], { silent: true });
 */
export function usePersistedState<T>(
  key: string,
  initialValue: T | (() => T),
  options: { silent?: boolean; skipEmptyArrays?: boolean } = {}
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const { silent = false, skipEmptyArrays = false } = options;

  // ✅ Charger depuis localStorage au démarrage (une seule fois)
  const [state, setState] = useState<T>(() => {
    const saved = (storageService.get as any)(key) as T;
    
    if (saved !== null && saved !== undefined) {
      // Vérifier si c'est un tableau vide (si l'option est activée)
      if (skipEmptyArrays && Array.isArray(saved) && saved.length === 0) {
        const value = typeof initialValue === 'function' 
          ? (initialValue as () => T)() 
          : initialValue;
        
        if (!silent) {
          logger.info(`usePersistedState: ${key} - localStorage vide, utilisation de la valeur initiale`);
        }
        
        return value;
      }
      
      if (!silent) {
        const count = Array.isArray(saved) ? saved.length : 'données';
        logger.info(`usePersistedState: ${key} - ${count} chargé(es) depuis localStorage`);
      }
      
      return saved;
    }
    
    // Aucune donnée sauvegardée, utiliser la valeur initiale
    const value = typeof initialValue === 'function' 
      ? (initialValue as () => T)() 
      : initialValue;
    
    if (!silent) {
      logger.info(`usePersistedState: ${key} - Initialisation avec valeur par défaut`);
    }
    
    return value;
  });

  // ✅ Sauvegarder dans localStorage à chaque changement
  useEffect(() => {
    // Option pour skip les tableaux vides
    if (skipEmptyArrays && Array.isArray(state) && state.length === 0) {
      return;
    }
    
    (storageService.set as any)(key, state);
    
    if (!silent) {
      const count = Array.isArray(state) ? state.length : 'données';
      logger.info(`usePersistedState: ${key} - ${count} sauvegardé(es) dans localStorage`);
    }
  }, [key, state, silent, skipEmptyArrays]);

  return [state, setState];
}
