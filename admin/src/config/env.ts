/**
 * CONFIGURATION ENVIRONNEMENT - Point unique de configuration
 * Toutes les variables d'environnement de l'application
 * 
 * PHASE 5 AMÉLIORATIONS:
 * - Détection automatique de l'environnement (dev/staging/prod)
 * - Validation des variables critiques
 * - Configuration par environnement
 * - Logs et monitoring configurables
 */

// Safe access to import.meta.env (may be undefined in some environments)
const metaEnv: Record<string, string | undefined> = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env as any : {};

// Détection de l'environnement
const NODE_ENV = metaEnv.MODE || 'development';
const IS_DEV = NODE_ENV === 'development';
const IS_STAGING = NODE_ENV === 'staging';
// En production réelle, VITE_API_BASE_URL DOIT être configuré.
// Si absent, on reste en mode dev/mock même si NODE_ENV === 'production'
// (cas Figma Make ou environnements de preview sans backend).
const HAS_BACKEND = !!metaEnv.VITE_API_BASE_URL;
const IS_PROD = NODE_ENV === 'production' && HAS_BACKEND;

// Validation des variables critiques
function validateEnv() {
  const warnings: string[] = [];

  if (NODE_ENV === 'production' && !HAS_BACKEND) {
    warnings.push('VITE_API_BASE_URL absent — mode MOCK activé automatiquement');
  }

  if (warnings.length > 0) {
    console.info('[ENV]', warnings.join(', '));
  }
}

// Valider au chargement
validateEnv();

export const ENV = {
  // Environment Detection
  NODE_ENV,
  IS_DEV,
  IS_STAGING,
  IS_PROD,
  
  // API Configuration
  API_BASE_URL: metaEnv.VITE_API_BASE_URL || 'http://localhost:3000/api',
  API_TIMEOUT: Number(metaEnv.VITE_API_TIMEOUT) || 30000, // 30 secondes
  API_RETRY_ATTEMPTS: Number(metaEnv.VITE_API_RETRY_ATTEMPTS) || 3,
  API_RETRY_DELAY: Number(metaEnv.VITE_API_RETRY_DELAY) || 1000, // 1 seconde
  
  // Authentication
  AUTH_TOKEN_KEY: 'fasotravel_admin_token',
  AUTH_REFRESH_TOKEN_KEY: 'fasotravel_admin_refresh_token',
  AUTH_TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 heures
  
  // Feature Flags
  ENABLE_OFFLINE_MODE: metaEnv.VITE_ENABLE_OFFLINE_MODE === 'true',
  ENABLE_MOCK_DATA: metaEnv.VITE_ENABLE_MOCK_DATA !== 'false', // Activé par défaut en dev
  ENABLE_ANALYTICS: metaEnv.VITE_ENABLE_ANALYTICS === 'true' || IS_PROD,
  ENABLE_ERROR_REPORTING: metaEnv.VITE_ENABLE_ERROR_REPORTING === 'true' || IS_PROD,
  ENABLE_PERFORMANCE_MONITORING: metaEnv.VITE_ENABLE_PERFORMANCE_MONITORING === 'true' || IS_DEV,
  
  // App Info
  APP_NAME: 'FasoTravel Admin',
  APP_VERSION: metaEnv.VITE_APP_VERSION || '1.0.0',
  APP_BUILD: metaEnv.VITE_APP_BUILD || 'dev',
  
  // Pagination
  DEFAULT_PAGE_SIZE: Number(metaEnv.VITE_DEFAULT_PAGE_SIZE) || 20,
  MAX_PAGE_SIZE: Number(metaEnv.VITE_MAX_PAGE_SIZE) || 100,
  
  // Cache
  CACHE_DURATION: Number(metaEnv.VITE_CACHE_DURATION) || 5 * 60 * 1000, // 5 minutes
  CACHE_MAX_SIZE: Number(metaEnv.VITE_CACHE_MAX_SIZE) || 50 * 1024 * 1024, // 50 MB
  
  // Logging
  LOG_LEVEL: (metaEnv.VITE_LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || (IS_DEV ? 'debug' : 'error'),
  ENABLE_CONSOLE_LOGS: metaEnv.VITE_ENABLE_CONSOLE_LOGS !== 'false' || IS_DEV,
  
  // External Services (optionnel)
  SENTRY_DSN: metaEnv.VITE_SENTRY_DSN,
  GOOGLE_ANALYTICS_ID: metaEnv.VITE_GOOGLE_ANALYTICS_ID,
  
  // Rate Limiting
  RATE_LIMIT_REQUESTS: Number(metaEnv.VITE_RATE_LIMIT_REQUESTS) || 100,
  RATE_LIMIT_WINDOW: Number(metaEnv.VITE_RATE_LIMIT_WINDOW) || 60000, // 1 minute
} as const;

export type Environment = typeof ENV;

// Logger configuré selon l'environnement
export const logger = {
  debug: (...args: any[]) => {
    if (ENV.ENABLE_CONSOLE_LOGS && ENV.LOG_LEVEL === 'debug') {
      console.log('[DEBUG]', ...args);
    }
  },
  info: (...args: any[]) => {
    if (ENV.ENABLE_CONSOLE_LOGS && ['debug', 'info'].includes(ENV.LOG_LEVEL)) {
      console.info('[INFO]', ...args);
    }
  },
  warn: (...args: any[]) => {
    if (ENV.ENABLE_CONSOLE_LOGS && ['debug', 'info', 'warn'].includes(ENV.LOG_LEVEL)) {
      console.warn('[WARN]', ...args);
    }
  },
  error: (...args: any[]) => {
    if (ENV.ENABLE_CONSOLE_LOGS) {
      console.error('[ERROR]', ...args);
    }
  },
};

// Afficher la configuration au démarrage (dev seulement)
if (IS_DEV) {
  console.log('[ENV] Configuration:', {
    environment: NODE_ENV,
    apiBaseUrl: ENV.API_BASE_URL,
    mockData: ENV.ENABLE_MOCK_DATA,
    version: ENV.APP_VERSION,
  });
}