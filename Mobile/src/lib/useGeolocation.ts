/**
 * useGeolocation Hook
 * Hook personnalisé pour gérer la géolocalisation de manière centralisée
 * Utilisé par NearbyPage et StationsNearbyPage
 * 
 * DEV NOTES:
 * - Gère les permissions, les erreurs et les fallbacks
 * - Event: geolocation_permission_granted, geolocation_permission_denied
 * - Consent explicite requis (RGPD/privacy)
 */

import { useState, useCallback, useEffect } from 'react';

export interface GeolocationState {
  hasPermission: boolean | null;
  userPosition: { lat: number; lon: number } | null;
  isLoading: boolean;
  errorMessage: string | null;
  isGeolocationBlocked: boolean;
}

export interface GeolocationActions {
  requestLocationPermission: () => void;
  useDefaultLocation: (lat: number, lon: number) => void;
  checkGeolocationAvailability: () => boolean;
}

export function useGeolocation(): [GeolocationState, GeolocationActions] {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [userPosition, setUserPosition] = useState<{ lat: number; lon: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGeolocationBlocked, setIsGeolocationBlocked] = useState(false);

  const GEO_CONSENT_KEY = 'ft_geo_consent_v1';

  const saveConsent = (consent: { type: 'granted' | 'default' | 'denied'; ts: number; position?: { lat: number; lon: number } }) => {
    try {
      localStorage.setItem(GEO_CONSENT_KEY, JSON.stringify(consent));
    } catch (e) {
      // ignore storage errors
    }
  };

  const loadConsent = () => {
    try {
      const raw = localStorage.getItem(GEO_CONSENT_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as { type: 'granted' | 'default' | 'denied'; ts: number; position?: { lat: number; lon: number } };
    } catch (e) {
      return null;
    }
  };

  /**
   * Vérifie si la géolocalisation est disponible
   */
  const checkGeolocationAvailability = useCallback(() => {
    if (typeof window !== 'undefined') {
      const isSecure = window.isSecureContext;
      const hasGeolocation = 'geolocation' in navigator;
      
      // Check for permissions policy blocking
      try {
        // @ts-ignore - permissions.query may not be fully typed
        if (navigator.permissions && navigator.permissions.query) {
          navigator.permissions.query({ name: 'geolocation' }).then((result) => {
            if (result.state === 'denied') {
              console.log('[Geolocation] Permission denied by browser settings');
            }
          }).catch(() => {
            // Permissions API not available or query failed, continue normally
          });
        }
      } catch (e) {
        // Permissions API not supported, continue normally
      }
      
      if (!isSecure || !hasGeolocation) {
        setIsGeolocationBlocked(true);
        console.log('[Geolocation] Blocked - Secure context:', isSecure, 'Has API:', hasGeolocation);
        return false;
      }
      return true;
    }
    return false;
  }, []);

  /**
   * Demande la permission de géolocalisation
   */
  const requestLocationPermission = useCallback(() => {
    setIsLoading(true);
    setErrorMessage(null);
    
    if (!('geolocation' in navigator)) {
      setErrorMessage('La géolocalisation n\'est pas supportée par votre navigateur');
      setIsLoading(false);
      setHasPermission(false);
      setIsGeolocationBlocked(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setHasPermission(true);
        setUserPosition({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
        setIsLoading(false);
        setErrorMessage(null);
        // Persist consent
        saveConsent({ type: 'granted', ts: Date.now(), position: { lat: position.coords.latitude, lon: position.coords.longitude } });
        // Event tracking
        console.log('[Geolocation] ✓ Permission granted', {
          lat: position.coords.latitude.toFixed(4),
          lon: position.coords.longitude.toFixed(4)
        });
      },
      (error) => {
        setHasPermission(false);
        setIsLoading(false);
        
        // Handle different error types
        let logLevel: 'log' | 'warn' | 'error' = 'log';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            // Check if it's a permissions policy issue
              if (error.message && error.message.includes('permissions policy')) {
              setErrorMessage('La géolocalisation est désactivée sur cette page. Utilisez la localisation par défaut ci-dessous pour continuer.');
              setIsGeolocationBlocked(true);
              logLevel = 'log'; // Expected error, just info
              console.log('[Geolocation] ℹ️ Blocked by permissions policy (expected in some environments)');
              // Persist denied state
              saveConsent({ type: 'denied', ts: Date.now() });
            } else {
              setErrorMessage('Accès à la localisation refusé. Veuillez autoriser l\'accès dans les paramètres de votre navigateur, ou utilisez la localisation par défaut.');
              logLevel = 'log'; // User choice, not an error
              console.log('[Geolocation] ℹ️ Permission denied by user');
              saveConsent({ type: 'denied', ts: Date.now() });
            }
            break;
          case error.POSITION_UNAVAILABLE:
            setErrorMessage('Position indisponible. Vérifiez que vos services de localisation sont activés, ou utilisez la localisation par défaut.');
            logLevel = 'warn';
            console.warn('[Geolocation] ⚠️ Position unavailable');
            break;
          case error.TIMEOUT:
            setErrorMessage('Délai d\'attente dépassé. Utilisez la localisation par défaut pour continuer.');
            logLevel = 'warn';
            console.warn('[Geolocation] ⚠️ Timeout');
            break;
          default:
            setErrorMessage('Une erreur s\'est produite lors de la récupération de votre position. Utilisez la localisation par défaut.');
            logLevel = 'error';
            console.error('[Geolocation] ❌ Unexpected error:', error.message);
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  }, []);

  /**
   * Utilise une position par défaut (Ouagadougou ou autre ville)
   */
  const useDefaultLocation = useCallback((lat: number, lon: number) => {
    setUserPosition({ lat, lon });
    setHasPermission(true);
    setErrorMessage(null);
    // Persist that user chose a default location (so we don't re-prompt on next visit)
    saveConsent({ type: 'default', ts: Date.now(), position: { lat, lon } });
    console.log('[Geolocation] ✓ Using default location', { lat: lat.toFixed(4), lon: lon.toFixed(4) });
  }, []);

  // Initialize from stored consent (avoid prompting repeatedly)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const consent = loadConsent();
    if (!consent) return;

    if (consent.type === 'granted') {
      setHasPermission(true);
      if (consent.position) setUserPosition(consent.position);

      // If browser permissions API says granted, refresh position silently
      try {
        // @ts-ignore
        if (navigator.permissions && navigator.permissions.query) {
          navigator.permissions.query({ name: 'geolocation' }).then((res) => {
            if (res.state === 'granted') {
              navigator.geolocation.getCurrentPosition((position) => {
                setUserPosition({ lat: position.coords.latitude, lon: position.coords.longitude });
                saveConsent({ type: 'granted', ts: Date.now(), position: { lat: position.coords.latitude, lon: position.coords.longitude } });
              }, () => {
                // ignore
              });
            }
          }).catch(() => {
            // ignore
          });
        }
      } catch (e) {
        // ignore
      }
    } else if (consent.type === 'default') {
      setHasPermission(true);
      if (consent.position) setUserPosition(consent.position);
    } else if (consent.type === 'denied') {
      setHasPermission(false);
    }
  }, []);

  return [
    {
      hasPermission,
      userPosition,
      isLoading,
      errorMessage,
      isGeolocationBlocked
    },
    {
      requestLocationPermission,
      useDefaultLocation,
      checkGeolocationAvailability
    }
  ];
}
