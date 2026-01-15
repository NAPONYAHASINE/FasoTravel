/**
 * Configuration centrale de l'application TransportBF
 * 
 * MODE 'local' : Utilise localStorage pour la persistance (développement)
 * MODE 'api' : Utilise votre backend NestJS (production)
 * 
 * Pour changer de mode : modifier VITE_STORAGE_MODE dans .env
 */

// Helper pour accéder aux variables d'environnement de manière sûre
const getEnvVar = (key: string, defaultValue: string): string => {
  try {
    return import.meta.env?.[key] || defaultValue;
  } catch {
    return defaultValue;
  }
};

export const API_CONFIG = {
  // Mode de stockage : 'local' (localStorage) ou 'api' (backend NestJS)
  mode: getEnvVar('VITE_STORAGE_MODE', 'local') as 'local' | 'api',
  
  // URL de base de votre API NestJS
  baseUrl: getEnvVar('VITE_API_URL', 'http://localhost:3000/api'),
  
  // Timeout des requêtes HTTP (en ms)
  timeout: 10000,
  
  // Préfixe pour les clés localStorage
  storagePrefix: 'transportbf_',
};

/**
 * Vérifie si l'application est en mode local (localStorage)
 */
export const isLocalMode = () => API_CONFIG.mode === 'local';

/**
 * Vérifie si l'application est en mode API (backend)
 */
export const isApiMode = () => API_CONFIG.mode === 'api';

/**
 * Configuration des endpoints API
 */
export const API_ENDPOINTS = {
  // Authentification
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    logout: '/auth/logout',
    me: '/auth/me',
    resetPassword: '/auth/reset-password',
  },
  
  // Managers
  managers: '/managers',
  
  // Caissiers
  cashiers: '/cashiers',
  
  // Routes
  routes: '/routes',
  
  // Gares (Stations)
  stations: '/stations',
  
  // Horaires récurrents
  scheduleTemplates: '/schedule-templates',
  
  // Départs (Trips)
  trips: '/trips',
  tripsGenerate: '/trips/generate-from-templates',
  
  // Billets (Tickets)
  tickets: '/tickets',
  ticketCancel: (id: string) => `/tickets/${id}/cancel`,
  ticketRefund: (id: string) => `/tickets/${id}/refund`,
  
  // Tarification
  priceSegments: '/price-segments',
  priceHistory: '/price-history',
  
  // Stories
  stories: '/stories',
  storiesUpload: '/stories/upload',
  
  // Transactions caisse
  cashTransactions: '/cash-transactions',
};

/**
 * Configuration des headers par défaut
 */
export const getDefaultHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Ajouter le token d'authentification si disponible (seulement côté client)
  if (typeof window !== 'undefined') {
    try {
      const token = localStorage.getItem(`${API_CONFIG.storagePrefix}auth_token`);
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      // Ignorer les erreurs d'accès au localStorage
    }
  }
  
  return headers;
};

/**
 * Helper pour construire une URL complète
 */
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.baseUrl}${endpoint}`;
};
