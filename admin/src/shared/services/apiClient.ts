/**
 * @file apiClient.ts
 * @description Central HTTP client for FasoTravel system
 * 
 * This is the SINGLE SOURCE for all HTTP communication.
 * Both Mobile and Societe apps must use this client.
 * 
 * Features:
 * - Automatic token injection
 * - Token refresh on 401
 * - Retry logic with exponential backoff
 * - Centralized error handling
 * - Request/response logging
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// ============= ERROR CLASS =============

export class ApiError extends Error {
  constructor(
    public code: string,
    public message: string,
    public status?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ============= CONFIGURATION =============

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const REQUEST_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;

// Storage keys (aligned with shared/constants/storage.ts)
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// ============= API CLIENT CLASS =============

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  // ============= INTERCEPTORS =============

  private setupInterceptors(): void {
    // REQUEST INTERCEPTOR - Auto-inject token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Log request in development
        if (import.meta.env.DEV) {
          console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data);
        }

        return config;
      },
      (error) => {
        console.error('[API Request Error]', error);
        return Promise.reject(error);
      }
    );

    // RESPONSE INTERCEPTOR - Handle errors and token refresh
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log response in development
        if (import.meta.env.DEV) {
          console.log(`[API Response] ${response.config.url}`, response.data);
        }

        // Return data directly
        return response.data;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Handle 401 Unauthorized - Try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Wait for token refresh to complete
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                resolve(this.client(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = this.getRefreshToken();
            
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            // Call refresh endpoint
            const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
              refreshToken
            });

            const { token: newToken, refreshToken: newRefreshToken } = response.data.data;

            // Store new tokens
            this.setToken(newToken);
            if (newRefreshToken) {
              this.setRefreshToken(newRefreshToken);
            }

            // Notify all waiting requests
            this.refreshSubscribers.forEach(callback => callback(newToken));
            this.refreshSubscribers = [];

            // Retry original request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return this.client(originalRequest);

          } catch (refreshError) {
            // Refresh failed - logout user
            this.clearAuth();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Transform error to ApiError
        throw this.handleError(error);
      }
    );
  }

  // ============= HTTP METHODS =============

  async get<T = any>(url: string, config?: any): Promise<T> {
    return this.retry(() => this.client.get<any, T>(url, config));
  }

  async post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.retry(() => this.client.post<any, T>(url, data, config));
  }

  async put<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.retry(() => this.client.put<any, T>(url, data, config));
  }

  async patch<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.retry(() => this.client.patch<any, T>(url, data, config));
  }

  async delete<T = any>(url: string, config?: any): Promise<T> {
    return this.retry(() => this.client.delete<any, T>(url, config));
  }

  // ============= RETRY LOGIC =============

  private async retry<T>(
    fn: () => Promise<T>,
    attempt = 1
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      const shouldRetry = 
        attempt < MAX_RETRIES &&
        this.isRetryableError(error);

      if (shouldRetry) {
        // Exponential backoff: 2^attempt seconds
        const delay = Math.pow(2, attempt) * 1000;
        
        if (import.meta.env.DEV) {
          console.log(`[API Retry] Attempt ${attempt + 1} after ${delay}ms`);
        }

        await this.sleep(delay);
        return this.retry(fn, attempt + 1);
      }

      throw error;
    }
  }

  private isRetryableError(error: any): boolean {
    // Don't retry if no response (network error)
    if (!error?.response?.status) {
      return true;
    }

    const status = error.response.status;

    // Retry on:
    // - 5xx (server errors)
    // - 408 (request timeout)
    // - 429 (too many requests)
    return status >= 500 || status === 408 || status === 429;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============= ERROR HANDLING =============

  private handleError(error: AxiosError): ApiError {
    const status = error.response?.status;
    const data = error.response?.data as any;

    let code = 'UNKNOWN_ERROR';
    let message = 'Une erreur inconnue est survenue';
    let details = null;

    // Network errors
    if (error.code === 'ECONNABORTED') {
      code = 'TIMEOUT';
      message = 'Délai d\'attente dépassé - vérifiez votre connexion';
    } else if (error.code === 'ERR_NETWORK') {
      code = 'NETWORK_ERROR';
      message = 'Erreur réseau - vérifiez votre connexion Internet';
    } else if (error.code === 'ENOTFOUND') {
      code = 'NETWORK_ERROR';
      message = 'Serveur introuvable - vérifiez votre connexion';
    }
    // HTTP errors
    else if (status === 400) {
      code = 'VALIDATION_ERROR';
      message = data?.message || 'Données invalides';
      details = data?.errors;
    } else if (status === 401) {
      code = 'UNAUTHORIZED';
      message = 'Authentification requise - veuillez vous reconnecter';
    } else if (status === 403) {
      code = 'FORBIDDEN';
      message = 'Accès refusé - permissions insuffisantes';
    } else if (status === 404) {
      code = 'NOT_FOUND';
      message = data?.message || 'Ressource introuvable';
    } else if (status === 409) {
      code = 'CONFLICT';
      message = data?.message || 'Conflit de données';
      details = data?.details;
    } else if (status === 422) {
      code = 'UNPROCESSABLE_ENTITY';
      message = data?.message || 'Validation échouée';
      details = data?.errors;
    } else if (status === 429) {
      code = 'RATE_LIMITED';
      message = 'Trop de requêtes - veuillez patienter';
    } else if (status && status >= 500) {
      code = 'SERVER_ERROR';
      message = 'Erreur serveur - veuillez réessayer plus tard';
    }

    // Log error in development
    if (import.meta.env.DEV) {
      console.error(`[API Error] ${code}:`, {
        message,
        status,
        details,
        url: error.config?.url,
        method: error.config?.method
      });
    }

    return new ApiError(code, message, status, details);
  }

  // ============= TOKEN MANAGEMENT =============

  private getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  private setRefreshToken(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }

  private clearAuth(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  // ============= PUBLIC UTILITIES =============

  /**
   * Set authentication tokens manually
   */
  public setAuthTokens(token: string, refreshToken?: string): void {
    this.setToken(token);
    if (refreshToken) {
      this.setRefreshToken(refreshToken);
    }
  }

  /**
   * Clear all authentication data
   */
  public logout(): void {
    this.clearAuth();
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Get current API base URL
   */
  public getBaseURL(): string {
    return API_BASE_URL;
  }
}

// ============= SINGLETON EXPORT =============

export const apiClient = new ApiClient();
