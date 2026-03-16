/**
 * Configuration centralisée - TransportBF Mobile
 * Source unique de vérité pour les paramètres d'environnement
 * ✅ Coordinée avec Societe
 */

import { isDevelopment as _isDev } from '../shared/config/deployment';
import { storageService } from './storage/localStorage.service';
import { STORAGE_AUTH_TOKEN } from '../shared/constants/storage';

// ============================================
// ENVIRONMENT (ré-exporté depuis deployment.ts)
// ============================================

export const isDevelopment = _isDev;

export const isProduction = () => !isDevelopment();

// ============================================
// API CONFIGURATION
// ============================================

const _meta: any = typeof import.meta !== 'undefined' ? (import.meta as any) : {};

export const API_CONFIG = {
  /** Base URL de l'API backend */
  baseUrl: (_meta.env && _meta.env.VITE_API_URL) || 'http://localhost:3000/api',
  
  /** Timeout des requêtes en ms */
  requestTimeout: 30000,
  
  /** Nombre de retries en cas d'erreur */
  maxRetries: 3,
  
  /** Délai avant retry en ms */
  retryDelay: 1000,
  
  /** Headers par défaut */
  defaultHeaders: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// ============================================
// STORAGE CONFIGURATION
// ============================================

export const STORAGE_CONFIG = {
  /** Préfixe pour les clés localStorage (vide pour cohérence avec admin + shared constants) */
  prefix: '',
  
  /** TTL par défaut (ms) - 7 jours */
  defaultTTL: 7 * 24 * 60 * 60 * 1000,
};

// ============================================
// FEATURE FLAGS
// ============================================

export const FEATURE_FLAGS = {
  /** Utiliser mock data même en prod */
  forceMockData: false,
  
  /** Mode debug console */
  debugMode: isDevelopment(),
  
  /** Log toutes les requêtes API */
  logRequests: isDevelopment(),
};

// ============================================
// ENDPOINTS - CENTRALISÉ
// ============================================

export const API_ENDPOINTS = {
  // Auth
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    me: '/auth/me',
    refresh: '/auth/refresh-token',
    verifyOtp: '/auth/verify-otp',
    resendOtp: '/auth/resend-otp',
  },
  
  // Trips & Search
  trips: {
    list: '/trips',
    search: '/trips/search',
    detail: (id: string) => `/trips/${id}`,
    seats: (id: string) => `/trips/${id}/seats`,
    nearby: '/trips/nearby',
  },
  
  // Bookings
  bookings: {
    list: '/bookings',
    create: '/bookings',
    detail: (id: string) => `/bookings/${id}`,
    confirm: (id: string) => `/bookings/${id}/confirm`,
    cancel: (id: string) => `/bookings/${id}/cancel`,
  },
  
  // Tickets
  tickets: {
    list: '/tickets',
    detail: (id: string) => `/tickets/${id}`,
    validate: (id: string) => `/tickets/${id}/validate`,
    transfer: (id: string) => `/tickets/${id}/transfer`,
    download: (id: string) => `/tickets/${id}/download`,
    cancel: (id: string) => `/tickets/${id}/cancel`,
  },
  
  // Payments
  payments: {
    create: '/payments',
    detail: (id: string) => `/payments/${id}`,
    methods: '/payment-methods',
    webhook: '/payments/webhook',
  },
  
  // Operators
  operators: {
    list: '/operators',
    detail: (id: string) => `/operators/${id}`,
    services: (id: string) => `/operators/${id}/services`,
    stories: (id: string) => `/operators/${id}/stories`,
    reviews: (id: string) => `/operators/${id}/reviews`,
  },
  
  // Stations
  stations: {
    list: '/stations',
    detail: (id: string) => `/stations/${id}`,
    nearby: '/stations/nearby',
  },
  
  // Stories
  stories: {
    list: '/stories',
    active: '/stories/active',
    create: '/stories',
    markViewed: '/stories/mark-viewed',
    byOperator: (operatorId: string) => `/operators/${operatorId}/stories`,
    viewed: '/stories/viewed',
  },
  
  // Reviews
  reviews: {
    byOperator: (operatorId: string) => `/operators/${operatorId}/reviews`,
    create: '/reviews',
    update: (id: string) => `/reviews/${id}`,
    delete: (id: string) => `/reviews/${id}`,
    myReviews: '/reviews/my-reviews',
  },
  
  // User
  user: {
    profile: '/user/profile',
    update: '/user/profile',
    export: '/user/export',
    delete: '/user/delete',
  },
  
  // Support
  support: {
    messages: '/support/messages',
    incidents: '/support/incidents',
    sendMessage: '/support/messages',
    myMessages: '/support/messages/my-messages',
    reportIncident: '/support/incidents',
    myIncidents: '/support/incidents/my-incidents',
    incidentDetail: (id: string) => `/support/incidents/${id}`,
    closeIncident: (id: string) => `/support/incidents/${id}/close`,
  },
  
  // Vehicle tracking
  vehicle: {
    location: (tripId: string) => `/vehicle/trips/${tripId}/location`,
  },
} as const;

// ============================================
// HELPERS
// ============================================

export function buildApiUrl(endpoint: string): string {
  const base = API_CONFIG.baseUrl;
  if (endpoint.startsWith('http')) return endpoint;
  if (endpoint.startsWith('/')) return `${base}${endpoint}`;
  return `${base}/${endpoint}`;
}

export function getAuthToken(): string | null {
  return storageService.get<string>(STORAGE_AUTH_TOKEN) || null;
}

export function setAuthToken(token: string): void {
  storageService.set(STORAGE_AUTH_TOKEN, token);
}

export function clearAuthToken(): void {
  storageService.remove(STORAGE_AUTH_TOKEN);
}
