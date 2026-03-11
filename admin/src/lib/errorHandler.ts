/**
 * ERROR HANDLER - Phase 5
 * Gestion centralisée des erreurs avec logging, reporting et fallbacks
 */

import { ENV, logger } from '../config/env';
import { toast } from 'sonner@2.0.3';

// ===========================================
// TYPES D'ERREURS
// ===========================================

export enum ErrorType {
  NETWORK = 'NETWORK',
  API = 'API',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface AppError extends Error {
  type: ErrorType;
  severity: ErrorSeverity;
  code?: string;
  statusCode?: number;
  metadata?: Record<string, any>;
  timestamp: string;
}

// ===========================================
// CRÉATION D'ERREURS TYPÉES
// ===========================================

export function createAppError(
  message: string,
  type: ErrorType = ErrorType.UNKNOWN,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  metadata?: Record<string, any>
): AppError {
  const error = new Error(message) as AppError;
  error.type = type;
  error.severity = severity;
  error.metadata = metadata;
  error.timestamp = new Date().toISOString();
  return error;
}

// ===========================================
// CLASSIFICATION AUTOMATIQUE DES ERREURS
// ===========================================

export function classifyError(error: any): AppError {
  // Déjà une AppError
  if (error.type && error.severity) {
    return error as AppError;
  }

  // Erreur réseau
  if (error.message?.includes('Network') || error.message?.includes('fetch')) {
    return createAppError(
      'Erreur de connexion au serveur',
      ErrorType.NETWORK,
      ErrorSeverity.HIGH,
      { originalError: error.message }
    );
  }

  // Timeout
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return createAppError(
      'La requête a expiré. Veuillez réessayer.',
      ErrorType.TIMEOUT,
      ErrorSeverity.MEDIUM,
      { originalError: error.message }
    );
  }

  // Erreurs HTTP
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case 401:
        return createAppError(
          'Session expirée. Veuillez vous reconnecter.',
          ErrorType.AUTHENTICATION,
          ErrorSeverity.HIGH,
          { statusCode: 401 }
        );

      case 403:
        return createAppError(
          "Vous n'avez pas les permissions nécessaires.",
          ErrorType.AUTHORIZATION,
          ErrorSeverity.MEDIUM,
          { statusCode: 403 }
        );

      case 404:
        return createAppError(
          'Ressource introuvable.',
          ErrorType.NOT_FOUND,
          ErrorSeverity.LOW,
          { statusCode: 404 }
        );

      case 422:
        return createAppError(
          data?.message || 'Données invalides.',
          ErrorType.VALIDATION,
          ErrorSeverity.LOW,
          { statusCode: 422, validationErrors: data?.errors }
        );

      case 500:
        return createAppError(
          'Erreur serveur. Veuillez réessayer plus tard.',
          ErrorType.API,
          ErrorSeverity.CRITICAL,
          { statusCode: 500 }
        );

      default:
        return createAppError(
          data?.message || 'Une erreur est survenue.',
          ErrorType.API,
          ErrorSeverity.MEDIUM,
          { statusCode: status }
        );
    }
  }

  // Erreur de validation (frontend)
  if (error.name === 'ValidationError') {
    return createAppError(
      error.message,
      ErrorType.VALIDATION,
      ErrorSeverity.LOW,
      { validationErrors: error.errors }
    );
  }

  // Erreur inconnue
  return createAppError(
    error.message || 'Une erreur inattendue est survenue.',
    ErrorType.UNKNOWN,
    ErrorSeverity.MEDIUM,
    { originalError: error }
  );
}

// ===========================================
// GESTION DES ERREURS
// ===========================================

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logToConsole?: boolean;
  reportToSentry?: boolean;
  onError?: (error: AppError) => void;
}

export function handleError(
  error: any,
  options: ErrorHandlerOptions = {}
): AppError {
  const {
    showToast = true,
    logToConsole = true,
    reportToSentry = ENV.ENABLE_ERROR_REPORTING,
    onError,
  } = options;

  // Classifier l'erreur
  const appError = classifyError(error);

  // Logger en console (dev)
  if (logToConsole) {
    logger.error('[Error Handler]', {
      message: appError.message,
      type: appError.type,
      severity: appError.severity,
      metadata: appError.metadata,
      timestamp: appError.timestamp,
    });
  }

  // Afficher un toast
  if (showToast) {
    showErrorToast(appError);
  }

  // Reporter à Sentry (prod)
  if (reportToSentry && ENV.SENTRY_DSN) {
    reportErrorToSentry(appError);
  }

  // Callback personnalisé
  if (onError) {
    onError(appError);
  }

  return appError;
}

// ===========================================
// AFFICHAGE DES ERREURS
// ===========================================

function showErrorToast(error: AppError) {
  const toastOptions = {
    duration: getToastDuration(error.severity),
  };

  switch (error.severity) {
    case ErrorSeverity.CRITICAL:
      toast.error(error.message, toastOptions);
      break;

    case ErrorSeverity.HIGH:
      toast.error(error.message, toastOptions);
      break;

    case ErrorSeverity.MEDIUM:
      toast.warning(error.message, toastOptions);
      break;

    case ErrorSeverity.LOW:
      toast.info(error.message, toastOptions);
      break;

    default:
      toast(error.message, toastOptions);
  }
}

function getToastDuration(severity: ErrorSeverity): number {
  switch (severity) {
    case ErrorSeverity.CRITICAL:
      return 10000; // 10 secondes
    case ErrorSeverity.HIGH:
      return 7000; // 7 secondes
    case ErrorSeverity.MEDIUM:
      return 5000; // 5 secondes
    case ErrorSeverity.LOW:
      return 3000; // 3 secondes
    default:
      return 5000;
  }
}

// ===========================================
// ERROR REPORTING
// ===========================================

function reportErrorToSentry(error: AppError) {
  // TODO: Implémenter l'intégration Sentry quand le backend est prêt
  // if (ENV.SENTRY_DSN) {
  //   Sentry.captureException(error, {
  //     level: getSentryLevel(error.severity),
  //     tags: {
  //       type: error.type,
  //     },
  //     extra: error.metadata,
  //   });
  // }

  logger.info('[Sentry] Error would be reported:', error.message);
}

function getSentryLevel(severity: ErrorSeverity): 'error' | 'warning' | 'info' {
  switch (severity) {
    case ErrorSeverity.CRITICAL:
    case ErrorSeverity.HIGH:
      return 'error';
    case ErrorSeverity.MEDIUM:
      return 'warning';
    case ErrorSeverity.LOW:
      return 'info';
    default:
      return 'error';
  }
}

// ===========================================
// ERROR BOUNDARY HELPER
// ===========================================

export function createErrorBoundaryHandler(
  componentName: string
): (error: Error, errorInfo: React.ErrorInfo) => void {
  return (error: Error, errorInfo: React.ErrorInfo) => {
    const appError = createAppError(
      `Erreur dans ${componentName}: ${error.message}`,
      ErrorType.UNKNOWN,
      ErrorSeverity.HIGH,
      {
        componentStack: errorInfo.componentStack,
      }
    );

    handleError(appError, {
      showToast: true,
      logToConsole: true,
      reportToSentry: true,
    });
  };
}

// ===========================================
// RETRY LOGIC
// ===========================================

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = ENV.API_RETRY_ATTEMPTS,
  baseDelay: number = ENV.API_RETRY_DELAY
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Ne pas retry si erreur non retryable
      if (!isRetryableError(error)) {
        throw error;
      }

      // Dernier essai échoué
      if (attempt === maxAttempts) {
        throw error;
      }

      // Attendre avant de retry (backoff exponentiel)
      const delay = baseDelay * Math.pow(2, attempt - 1);
      logger.warn(`[Retry] Attempt ${attempt}/${maxAttempts} failed. Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

function isRetryableError(error: any): boolean {
  const appError = classifyError(error);

  // Retry seulement pour certains types d'erreurs
  return [
    ErrorType.NETWORK,
    ErrorType.TIMEOUT,
  ].includes(appError.type);
}

// ===========================================
// VALIDATION HELPERS
// ===========================================

export function validateRequired(value: any, fieldName: string): void {
  if (value === null || value === undefined || value === '') {
    throw createAppError(
      `Le champ "${fieldName}" est requis.`,
      ErrorType.VALIDATION,
      ErrorSeverity.LOW
    );
  }
}

export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw createAppError(
      'Email invalide.',
      ErrorType.VALIDATION,
      ErrorSeverity.LOW
    );
  }
}

export function validatePhone(phone: string): void {
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
  if (!phoneRegex.test(phone)) {
    throw createAppError(
      'Numéro de téléphone invalide.',
      ErrorType.VALIDATION,
      ErrorSeverity.LOW
    );
  }
}

// ===========================================
// EXPORTS
// ===========================================

export default {
  createAppError,
  classifyError,
  handleError,
  createErrorBoundaryHandler,
  retryWithBackoff,
  validateRequired,
  validateEmail,
  validatePhone,
};
