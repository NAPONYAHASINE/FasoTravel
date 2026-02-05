/**
 * HTTP API Client - TransportBF Societe
 * 
 * Gère:
 * - GET, POST, PUT, PATCH, DELETE
 * - Bearer token automatique
 * - Timeout avec AbortController
 * - Retry logic avec backoff exponentiel
 * - Gestion d'erreurs HTTP
 */

import { buildApiUrl, getDefaultHeaders, API_CONFIG } from '../config';
import { logger } from '../../utils/logger';

export interface ApiClientOptions extends RequestInit {
  retry?: number;
  timeout?: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiClientConfig {
  baseUrl: string;
  timeout?: number;
  maxRetries?: number;
  getToken?: () => string | null;
  getHeaders?: () => Record<string, string>;
  logger?: {
    error: (msg: string, data?: any) => void;
    warn: (msg: string, data?: any) => void;
    debug: (msg: string, data?: any) => void;
  };
}

class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private maxRetries: number;
  private getToken: () => string | null;
  private getHeaders: () => Record<string, string>;
  private logger: ApiClientConfig['logger'];

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl;
    this.timeout = config.timeout || 30000;
    this.maxRetries = config.maxRetries || 3;
    this.getToken = config.getToken || (() => null);
    this.getHeaders = config.getHeaders || (() => ({}));
    this.logger = config.logger || {
      error: () => {},
      warn: () => {},
      debug: () => {},
    };
  }

  /**
   * GET request
   */
  async get<T = unknown>(url: string, options?: ApiClientOptions): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post<T = unknown>(url: string, data?: unknown, options?: ApiClientOptions): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T = unknown>(url: string, data?: unknown, options?: ApiClientOptions): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T = unknown>(url: string, data?: unknown, options?: ApiClientOptions): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = unknown>(url: string, options?: ApiClientOptions): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'DELETE',
    });
  }

  /**
   * Core request logic avec retry et timeout
   */
  private async request<T>(
    url: string,
    options: ApiClientOptions = {}
  ): Promise<T> {
    const { retry = 0, timeout = this.timeout, ...fetchOptions } = options;
    let lastError: Error | null = null;

    const maxAttempts = this.maxRetries + 1;
    const attemptNumber = maxAttempts - (retry || 0);

    try {
      // Créer AbortController pour le timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const fullUrl = buildApiUrl(url);
      const headers = this.buildHeaders(fetchOptions.headers as Record<string, string> | undefined);

      this.logger.debug?.(`📤 ${fetchOptions.method || 'GET'} ${url} (tentative ${attemptNumber}/${maxAttempts})`);

      const response = await fetch(fullUrl, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Gestion des erreurs HTTP
      if (!response.ok) {
        this.handleErrorResponse(response);
      }

      // Succès - parser la réponse
      const contentType = response.headers.get('content-type');
      const data = contentType?.includes('application/json') 
        ? await response.json()
        : (await response.text() as unknown);

      this.logger.debug?.(`✅ ${fetchOptions.method || 'GET'} ${url} (${response.status})`);
      return data as T;
    } catch (error: any) {
      // Gestion timeout
      if (error.name === 'AbortError') {
        this.logger.error?.(`⏱️ Timeout API`, { url, timeout, attempt: attemptNumber });
        lastError = new ApiError('Délai d\'attente dépassé', 408);
      } else {
        lastError = error instanceof Error ? error : new Error(String(error));
      }

      // Retry logic
      if (retry < this.maxRetries && this.shouldRetry(lastError)) {
        const delay = 1000 * Math.pow(2, maxAttempts - retry - 2);
        this.logger.warn?.(`🔄 Retry dans ${delay}ms`, { url, retriesLeft: retry });
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.request<T>(url, { ...options, retry: retry + 1 });
      }

      throw lastError;
    }
  }

  /**
   * Détermine si on doit retry la requête
   */
  private shouldRetry(error: any): boolean {
    if (error instanceof ApiError) {
      // Retry seulement sur erreurs serveur (5xx) et timeouts
      return error.status >= 500 || error.status === 408;
    }
    // Retry sur erreurs réseau
    return true;
  }

  /**
   * Construit les headers avec auth token
   */
  private buildHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...getDefaultHeaders(),
      ...customHeaders,
    };

    // Ajouter token d'auth si disponible
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Gestion des erreurs HTTP
   */
  private handleErrorResponse(response: Response): never {
    const status = response.status;
    const statusText = response.statusText || 'Unknown Error';

    this.logger.error?.(`❌ HTTP ${status}`, { url: response.url });

    throw new ApiError(
      `HTTP ${status}: ${statusText}`,
      status
    );
  }
}

/**
 * Export instance avec config Societe
 */
export const apiClient = new ApiClient({
  baseUrl: '', // buildApiUrl() inclut déjà le domaine complet
  timeout: API_CONFIG.timeout || 30000,
  maxRetries: 3,
  getToken: () => {
    // TODO: récupérer depuis auth context ou localStorage
    return null;
  },
  getHeaders: getDefaultHeaders,
  logger: {
    error: (msg, data) => logger.error(`[API] ${msg}`, data),
    warn: (msg, data) => logger.warn(`[API] ${msg}`, data),
    debug: (msg, data) => logger.debug?.(`[API] ${msg}`, data) || console.debug(`[API] ${msg}`, data),
  },
});

