/**
 * Client API centralisé pour TransportBF
 * 
 * Gère automatiquement :
 * - Headers d'authentification
 * - Gestion des erreurs HTTP (401, 403, 500, etc.)
 * - Retry automatique en cas d'échec réseau
 * - Timeout des requêtes
 * - Logging unifié
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

class ApiClient {
  /**
   * Effectue une requête HTTP avec gestion complète des erreurs
   */
  async request<T>(
    endpoint: string,
    options: ApiClientOptions = {}
  ): Promise<T> {
    const { retry = 0, timeout = API_CONFIG.timeout, ...fetchOptions } = options;

    try {
      // Créer AbortController pour le timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(buildApiUrl(endpoint), {
        ...fetchOptions,
        headers: {
          ...getDefaultHeaders(),
          ...fetchOptions.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Gestion des erreurs HTTP
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      // Succès - parser la réponse
      const data = await response.json();
      return data;
    } catch (error: any) {
      // Gestion timeout
      if (error.name === 'AbortError') {
        logger.error('⏱️ Timeout API', { endpoint, timeout });
        throw new ApiError('Délai d\'attente dépassé', 408);
      }

      // Retry en cas d'erreur réseau
      if (retry > 0 && this.shouldRetry(error)) {
        logger.warn(`🔄 Retry ${retry} restant(s)`, { endpoint });
        await this.delay(1000); // Attendre 1s avant retry
        return this.request<T>(endpoint, { ...options, retry: retry - 1 });
      }

      // Re-throw l'erreur
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: ApiClientOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    data?: any,
    options?: ApiClientOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    data?: any,
    options?: ApiClientOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: ApiClientOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }

  /**
   * Gestion des erreurs HTTP
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    const status = response.status;
    let errorData: any;

    try {
      errorData = await response.json();
    } catch {
      errorData = { message: 'Erreur serveur' };
    }

    const message = errorData.message || this.getDefaultErrorMessage(status);

    // Gestion spécifique par code HTTP
    switch (status) {
      case 401:
        logger.error('🔒 Non autorisé - Session expirée', { status });
        // Rediriger vers login (sera géré par le composant)
        throw new ApiError('Session expirée. Veuillez vous reconnecter.', 401, errorData);

      case 403:
        logger.error('🚫 Accès refusé', { status });
        throw new ApiError('Accès refusé. Vous n\'avez pas les permissions nécessaires.', 403, errorData);

      case 404:
        logger.error('🔍 Ressource introuvable', { status });
        throw new ApiError('Ressource introuvable.', 404, errorData);

      case 422:
        logger.error('❌ Données invalides', { status, errors: errorData.errors });
        throw new ApiError('Données invalides.', 422, errorData);

      case 500:
      case 502:
      case 503:
        logger.error('💥 Erreur serveur', { status });
        throw new ApiError('Erreur serveur. Veuillez réessayer plus tard.', status, errorData);

      default:
        logger.error('❌ Erreur API', { status, message });
        throw new ApiError(message, status, errorData);
    }
  }

  /**
   * Messages d'erreur par défaut selon le code HTTP
   */
  private getDefaultErrorMessage(status: number): string {
    const messages: Record<number, string> = {
      400: 'Requête invalide',
      401: 'Non autorisé',
      403: 'Accès refusé',
      404: 'Ressource introuvable',
      422: 'Données invalides',
      500: 'Erreur serveur',
      502: 'Service temporairement indisponible',
      503: 'Service en maintenance',
    };

    return messages[status] || 'Erreur inconnue';
  }

  /**
   * Détermine si on doit retry la requête
   */
  private shouldRetry(error: any): boolean {
    // Retry sur erreurs réseau (pas sur erreurs 4xx)
    if (error instanceof ApiError) {
      return error.status >= 500; // Retry seulement sur erreurs serveur
    }
    return true; // Retry sur erreurs réseau
  }

  /**
   * Délai asynchrone pour les retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export instance singleton
export const apiClient = new ApiClient();
