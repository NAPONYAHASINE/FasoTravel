/**
 * Service API Centralisé - Backend Ready
 * Point d'entrée unique pour tous les appels API
 * Gère l'authentification, les erreurs, le cache, et les retry
 */

import { AppConfig } from '../config/app.config';
import {
  STORAGE_AUTH_TOKEN,
  STORAGE_REFRESH_TOKEN,
  clearAuthStorage,
} from '../shared/constants/storage';

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  refreshTokenEndpoint: '/auth/refresh-token',
};

// ============================================================================
// TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  details?: any;
}

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, any>;
  timeout?: number;
  cache?: boolean;
  retry?: boolean;
}

// ============================================================================
// CACHE SIMPLE (en mémoire)
// ============================================================================

class SimpleCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clear(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

// ============================================================================
// SERVICE API
// ============================================================================

class ApiService {
  private cache = new SimpleCache();
  private authToken: string | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<string | null> | null = null;

  /**
   * Vérifie si on est en mode mock (via AppConfig)
   */
  get isMockMode(): boolean {
    return AppConfig.isMock;
  }

  /**
   * Définit le token d'authentification
   */
  setAuthToken(token: string | null): void {
    this.authToken = token;
    if (token) {
      localStorage.setItem(STORAGE_AUTH_TOKEN, token);
    } else {
      localStorage.removeItem(STORAGE_AUTH_TOKEN);
    }
  }

  /**
   * Récupère le token d'authentification
   */
  getAuthToken(): string | null {
    if (!this.authToken) {
      this.authToken = localStorage.getItem(STORAGE_AUTH_TOKEN);
    }
    return this.authToken;
  }

  /**
   * Définit le refresh token
   */
  setRefreshToken(token: string | null): void {
    if (token) {
      localStorage.setItem(STORAGE_REFRESH_TOKEN, token);
    } else {
      localStorage.removeItem(STORAGE_REFRESH_TOKEN);
    }
  }

  /**
   * Récupère le refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_REFRESH_TOKEN);
  }

  /**
   * Gère le rafraîchissement du token avec déduplication
   */
  private async handleTokenRefresh(): Promise<string | null> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this._doRefreshToken();

    try {
      return await this.refreshPromise;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async _doRefreshToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.handleAuthFailure();
      return null;
    }

    try {
      const url = new URL(`${API_CONFIG.baseURL}${API_CONFIG.refreshTokenEndpoint}`);
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        this.handleAuthFailure();
        return null;
      }

      const data = await response.json();
      const newToken = data.data?.token || data.token;
      const newRefreshToken = data.data?.refreshToken || data.refreshToken;

      if (newToken) {
        this.setAuthToken(newToken);
        if (newRefreshToken) {
          this.setRefreshToken(newRefreshToken);
        }
        return newToken;
      }

      this.handleAuthFailure();
      return null;
    } catch {
      this.handleAuthFailure();
      return null;
    }
  }

  /**
   * Gère l'échec d'authentification (token expiré, refresh échoué)
   */
  private handleAuthFailure(): void {
    this.authToken = null;
    clearAuthStorage();
    window.location.href = '/login';
  }

  /**
   * Construit l'URL avec query params
   */
  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(`${API_CONFIG.baseURL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }

  /**
   * Construit les headers de la requête
   */
  private buildHeaders(customHeaders?: Record<string, string>): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Gère les erreurs API
   */
  private handleError(error: any): ApiError {
    if (error.name === 'AbortError') {
      return {
        message: 'La requête a expiré',
        statusCode: 408,
      };
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        message: 'Erreur de connexion au serveur',
        statusCode: 0,
      };
    }

    return {
      message: error.message || 'Une erreur est survenue',
      statusCode: error.statusCode || 500,
      details: error.details,
    };
  }

  /**
   * Simule un délai réseau (pour mock)
   */
  private async simulateDelay(ms: number = 300): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Méthode principale de requête
   */
  async request<T = any>(
    endpoint: string,
    config: RequestConfig = {},
    _isRetryAfterRefresh = false,
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers,
      body,
      params,
      timeout = API_CONFIG.timeout,
      cache = false,
      retry = true,
    } = config;

    // Gestion du cache
    const cacheKey = `${method}:${endpoint}:${JSON.stringify(params || {})}`;
    if (cache && method === 'GET') {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return { success: true, data: cached };
      }
    }

    // MODE MOCK: les services appelants DOIVENT gérer le mock AVANT d'appeler apiService.
    // Si ce code est atteint en mock, c'est que le service n'a pas son propre mock branch.
    if (this.isMockMode) {
      await this.simulateDelay(200);
      console.warn(`[apiService] ⚠️ Mock fallback pour ${method} ${endpoint} — le service appelant devrait gérer le mock.`);
      return {
        success: false,
        data: undefined as unknown as T,
        message: `Mock: aucune donnée pour ${endpoint}. Ajoutez un mock branch dans le service.`,
      };
    }

    // MODE RÉEL: appel API
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const url = this.buildUrl(endpoint, params);
      const requestHeaders = this.buildHeaders(headers);

      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // 401 Interception: try token refresh once
      if (response.status === 401 && !_isRetryAfterRefresh) {
        const newToken = await this.handleTokenRefresh();
        if (newToken) {
          return this.request<T>(endpoint, config, true);
        }
        return {
          success: false,
          error: 'Authentification requise',
          statusCode: 401,
        };
      }

      const data = await response.json();

      if (!response.ok) {
        throw {
          message: data.message || 'Erreur serveur',
          statusCode: response.status,
          details: data.details,
        };
      }

      // Mise en cache
      if (cache && method === 'GET') {
        this.cache.set(cacheKey, data.data);
      }

      return {
        success: true,
        data: data.data,
        message: data.message,
        statusCode: response.status,
      };
    } catch (error: any) {
      const apiError = this.handleError(error);

      // Retry logic
      if (retry && config.retry !== false && apiError.statusCode >= 500) {
        console.warn(`Retrying request to ${endpoint}...`);
        await this.simulateDelay(API_CONFIG.retryDelay);
        return this.request<T>(endpoint, { ...config, retry: false });
      }

      return {
        success: false,
        error: apiError.message,
        statusCode: apiError.statusCode,
      };
    }
  }

  /**
   * Raccourcis pour les méthodes HTTP
   */
  async get<T = any>(endpoint: string, params?: Record<string, any>, cache = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', params, cache });
  }

  async post<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body });
  }

  async put<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body });
  }

  async patch<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PATCH', body });
  }

  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * 🔥 Upload de fichier (FormData)
   * Spécialement pour l'upload d'images, logos, etc.
   */
  async uploadFile<T = any>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    try {
      // En mode Mock, retourner une erreur indiquant qu'on ne peut pas vraiment uploader
      if (this.isMockMode) {
        throw new Error('uploadFile ne devrait pas être appelé en mode Mock. Utilisez la conversion base64 à la place.');
      }

      const url = this.buildUrl(endpoint);
      const token = this.getAuthToken();
      
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      // NE PAS définir Content-Type, le navigateur le fera automatiquement avec la boundary

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          message: errorData.message || `Erreur HTTP ${response.status}`,
          statusCode: response.status,
          details: errorData,
        };
      }

      const data = await response.json();

      return {
        success: true,
        data: data.data || data,
        message: data.message,
        statusCode: response.status,
      };
    } catch (error: any) {
      const apiError = this.handleError(error);
      return {
        success: false,
        error: apiError.message,
        statusCode: apiError.statusCode,
      };
    }
  }

  /**
   * Invalide le cache
   */
  clearCache(pattern?: string): void {
    this.cache.clear(pattern);
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

/**
 * Instance singleton du service API
 * 
 * Usage:
 * - En développement: apiService.setMockMode(true)
 * - En production: apiService.setMockMode(false)
 */
export const apiService = new ApiService();

export { ApiService };