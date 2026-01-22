/**
 * Services Root Index - Central Export Point
 * 
 * Tous les services, configurations et types
 * Point d'entrée unique pour tous les imports
 */

// Configuration
export { isDevelopment, isProduction } from './config';
export { API_ENDPOINTS, STORAGE_CONFIG, FEATURE_FLAGS } from './config';
export { buildApiUrl, getAuthToken, setAuthToken, clearAuthToken } from './config';

// Types
export * from './types';

// Storage
export { storageService } from './storage/localStorage.service';

// API Services (via subpackage)
export * from './api';
