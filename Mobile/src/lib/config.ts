/**
 * Configuration de l'application TransportBF
 * 
 * Ce fichier centralise toutes les configurations :
 * - URLs d'API
 * - Environnement (dev/prod)
 * - Constantes globales
 */

// Détecter l'environnement
export const isDevelopment = import.meta.env?.MODE === 'development';
export const isProduction = import.meta.env?.MODE === 'production';

// URL de base de l'API backend
// En dev: utilise le proxy Vite ou localhost
// En prod: utilise l'URL de production depuis les variables d'environnement
export const API_BASE_URL = import.meta.env?.VITE_API_URL || 
  (isDevelopment ? 'http://localhost:3000' : '');

/**
 * Configuration des endpoints API
 */
export const API_ENDPOINTS = {
  // Publicités
  ads: {
    active: `${API_BASE_URL}/api/ads/active`,
    impression: (adId: string) => `${API_BASE_URL}/api/ads/${adId}/impression`,
    click: (adId: string) => `${API_BASE_URL}/api/ads/${adId}/click`,
    conversion: (adId: string) => `${API_BASE_URL}/api/ads/${adId}/conversion`,
  },
  
  // Stories des opérateurs
  stories: {
    list: (operatorId: string) => `${API_BASE_URL}/api/operators/${operatorId}/stories`,
    view: (operatorId: string, storyId: string) => 
      `${API_BASE_URL}/api/operators/${operatorId}/stories/${storyId}/view`,
  },
  
  // Trajets
  trips: {
    search: `${API_BASE_URL}/api/trips`,
    detail: (tripId: string) => `${API_BASE_URL}/api/trips/${tripId}`,
  },
  
  // Réservations
  bookings: {
    create: `${API_BASE_URL}/api/bookings`,
    detail: (bookingId: string) => `${API_BASE_URL}/api/bookings/${bookingId}`,
    cancel: (bookingId: string) => `${API_BASE_URL}/api/bookings/${bookingId}/cancel`,
    transfer: (bookingId: string) => `${API_BASE_URL}/api/bookings/${bookingId}/transfer`,
  },
  
  // Utilisateurs
  users: {
    login: `${API_BASE_URL}/api/auth/login`,
    register: `${API_BASE_URL}/api/auth/register`,
    profile: `${API_BASE_URL}/api/users/profile`,
  },
  
  // Gares
  stations: {
    list: `${API_BASE_URL}/api/stations`,
    nearby: `${API_BASE_URL}/api/stations/nearby`,
  },
  
  // Opérateurs
  operators: {
    list: `${API_BASE_URL}/api/operators`,
    detail: (operatorId: string) => `${API_BASE_URL}/api/operators/${operatorId}`,
  },
  
  // Paiements
  payments: {
    create: `${API_BASE_URL}/api/payments`,
    verify: (paymentId: string) => `${API_BASE_URL}/api/payments/${paymentId}/verify`,
  },
  
  // Admin (protégé)
  admin: {
    ads: {
      list: `${API_BASE_URL}/api/admin/ads`,
      create: `${API_BASE_URL}/api/admin/ads`,
      update: (adId: string) => `${API_BASE_URL}/api/admin/ads/${adId}`,
      delete: (adId: string) => `${API_BASE_URL}/api/admin/ads/${adId}`,
      analytics: `${API_BASE_URL}/api/admin/ads/analytics/overview`,
      adAnalytics: (adId: string) => `${API_BASE_URL}/api/admin/ads/${adId}/analytics`,
    },
    stories: {
      create: (operatorId: string) => `${API_BASE_URL}/api/admin/operators/${operatorId}/stories`,
      delete: (operatorId: string, storyId: string) => 
        `${API_BASE_URL}/api/admin/operators/${operatorId}/stories/${storyId}`,
    },
  },
};

/**
 * Configuration du système de publicités
 */
export const ADS_CONFIG = {
  // Fréquence minimum entre 2 publicités (en millisecondes)
  MIN_FREQUENCY: 5 * 60 * 1000, // 5 minutes par défaut
  
  // Délai avant affichage de la publicité (en millisecondes)
  DISPLAY_DELAY: 2000, // 2 secondes
  
  // Pages où les publicités sont activées
  ENABLED_PAGES: ['home', 'search-results', 'tickets', 'operators', 'nearby'] as const,
  
  // Utiliser les données mock en mode dev ?
  USE_MOCK_IN_DEV: true,
};

/**
 * Configuration du système de stories
 */
export const STORIES_CONFIG = {
  // Durée d'affichage d'une story (en millisecondes)
  DISPLAY_DURATION: 5000, // 5 secondes
  
  // Durée de vie d'une story (en heures)
  STORY_LIFETIME: 24, // 24 heures
};

/**
 * Configuration de la géolocalisation
 */
export const GEOLOCATION_CONFIG = {
  // Rayon de recherche par défaut (en mètres)
  DEFAULT_RADIUS: 5000, // 5 km
  
  // Timeout pour obtenir la position (en millisecondes)
  TIMEOUT: 10000, // 10 secondes
  
  // Précision maximale souhaitée (en mètres)
  MAXIMUM_AGE: 60000, // 1 minute
};

/**
 * Configuration des réservations
 */
export const BOOKING_CONFIG = {
  // Durée du système HOLD/TTL (en minutes)
  HOLD_DURATION: 10,
  
  // Délai minimum avant départ pour annulation (en heures)
  MIN_CANCEL_TIME: 1,
  
  // Nombre maximum de passagers par réservation
  MAX_PASSENGERS: 9,
};

/**
 * Configuration des paiements
 */
export const PAYMENT_CONFIG = {
  // Providers disponibles
  PROVIDERS: ['orange-money', 'moov-money', 'card'] as const,
  
  // Montant minimum (en FCFA)
  MIN_AMOUNT: 1000,
  
  // Montant maximum (en FCFA)
  MAX_AMOUNT: 500000,
};

/**
 * Configuration de l'internationalisation
 */
export const I18N_CONFIG = {
  // Langues supportées
  SUPPORTED_LANGUAGES: ['fr', 'en', 'mo'] as const,
  
  // Langue par défaut
  DEFAULT_LANGUAGE: 'fr' as const,
  
  // Clé de stockage dans localStorage
  STORAGE_KEY: 'app-language',
};

/**
 * Helper pour construire une URL avec query params
 */
export function buildUrl(baseUrl: string, params?: Record<string, any>): string {
  if (!params || Object.keys(params).length === 0) {
    return baseUrl;
  }
  
  const queryString = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Helper pour vérifier si on est en mode mock
 */
export function shouldUseMock(): boolean {
  return isDevelopment && ADS_CONFIG.USE_MOCK_IN_DEV;
}

/**
 * Helper pour obtenir les headers par défaut
 */
export function getDefaultHeaders(includeAuth: boolean = false): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (includeAuth) {
    const token = localStorage.getItem('auth-token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
}

/**
 * Export des types
 */
export type Language = typeof I18N_CONFIG.SUPPORTED_LANGUAGES[number];
export type PaymentProvider = typeof PAYMENT_CONFIG.PROVIDERS[number];
export type AdEnabledPage = typeof ADS_CONFIG.ENABLED_PAGES[number];
