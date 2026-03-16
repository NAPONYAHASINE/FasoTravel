/**
 * Configuration Centralisée de l'Application
 * 
 * USAGE:
 * - En développement: MODE MOCK activé automatiquement
 * - En production: MODE PRODUCTION activé automatiquement
 * - Manuel: AppConfig.setMode('production') ou AppConfig.setMode('mock')
 * 
 * Pour passer en production:
 * 1. Configurer .env avec VITE_APP_MODE=production
 * 2. Ou appeler AppConfig.setMode('production')
 */

import { ENV, logger as _logger } from './env';

// Safe access to import.meta.env
const metaEnv: Record<string, string | undefined> = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env as any : {};

// ============================================================================
// TYPES
// ============================================================================

export type AppMode = 'mock' | 'production';

export interface AppConfiguration {
  mode: AppMode;
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
  };
  features: {
    realTimeUpdates: boolean;
    analytics: boolean;
    notifications: boolean;
  };
  debug: {
    logRequests: boolean;
    showMockBanner: boolean;
  };
}

// ============================================================================
// CONFIGURATION PAR ENVIRONNEMENT
// ============================================================================

const MOCK_CONFIG: AppConfiguration = {
  mode: 'mock',
  api: {
    baseUrl: 'http://localhost:3000/api', // Pas utilisé en mode mock
    timeout: 30000,
    retryAttempts: 3,
  },
  features: {
    realTimeUpdates: false,
    analytics: false,
    notifications: false,
  },
  debug: {
    logRequests: true,
    showMockBanner: true, // Affiche un banner "MODE MOCK" dans l'interface
  },
};

const PRODUCTION_CONFIG: AppConfiguration = {
  mode: 'production',
  api: {
    baseUrl: ENV.API_BASE_URL,
    timeout: ENV.API_TIMEOUT,
    retryAttempts: ENV.API_RETRY_ATTEMPTS,
  },
  features: {
    realTimeUpdates: true,
    analytics: true,
    notifications: true,
  },
  debug: {
    logRequests: false,
    showMockBanner: false,
  },
};

// ============================================================================
// CLASSE DE CONFIGURATION
// ============================================================================

class ApplicationConfig {
  private currentConfig: AppConfiguration;
  private listeners: Array<(config: AppConfiguration) => void> = [];

  constructor() {
    // Déterminer le mode initial
    const envMode = metaEnv.VITE_APP_MODE as AppMode;
    const initialMode = envMode || (ENV.IS_PROD ? 'production' : 'mock');
    
    this.currentConfig = initialMode === 'production' ? PRODUCTION_CONFIG : MOCK_CONFIG;
    
    // Logger le mode au démarrage
    this.logMode();
  }

  /**
   * Récupère la configuration actuelle
   */
  get config(): AppConfiguration {
    return { ...this.currentConfig };
  }

  /**
   * Récupère le mode actuel
   */
  get mode(): AppMode {
    return this.currentConfig.mode;
  }

  /**
   * Vérifie si on est en mode mock
   */
  get isMock(): boolean {
    return this.currentConfig.mode === 'mock';
  }

  /**
   * Vérifie si on est en mode production
   */
  get isProduction(): boolean {
    return this.currentConfig.mode === 'production';
  }

  /**
   * Change le mode de l'application
   */
  setMode(mode: AppMode): void {
    const newConfig = mode === 'production' ? PRODUCTION_CONFIG : MOCK_CONFIG;
    this.currentConfig = newConfig;
    
    // Sauvegarder dans localStorage pour persistance
    localStorage.setItem('app_mode', mode);
    
    // Notifier les listeners
    this.notifyListeners();
    
    // Logger le changement
    this.logMode();
  }

  /**
   * Bascule entre mock et production
   */
  toggleMode(): void {
    const newMode = this.currentConfig.mode === 'mock' ? 'production' : 'mock';
    this.setMode(newMode);
  }

  /**
   * S'abonner aux changements de configuration
   */
  subscribe(listener: (config: AppConfiguration) => void): () => void {
    this.listeners.push(listener);
    
    // Retourner une fonction pour se désabonner
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notifier tous les listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentConfig));
  }

  /**
   * Logger le mode actuel
   */
  private logMode(): void {
    const emoji = this.currentConfig.mode === 'mock' ? '🧪' : '🚀';
    const style = this.currentConfig.mode === 'mock' 
      ? 'color: orange; font-weight: bold; font-size: 14px;'
      : 'color: green; font-weight: bold; font-size: 14px;';
    
    console.log(
      `%c${emoji} FasoTravel Admin - Mode: ${this.currentConfig.mode.toUpperCase()}`,
      style
    );
    
    if (this.currentConfig.mode === 'mock') {
      console.log('%c⚠️ Attention: Vous utilisez des DONNÉES MOCK', 'color: orange;');
      console.log('%c💡 Pour passer en production: AppConfig.setMode("production")', 'color: blue;');
    } else {
      console.log(`%c✅ Backend API: ${this.currentConfig.api.baseUrl}`, 'color: green;');
    }
  }

  /**
   * Réinitialiser au mode par défaut
   */
  reset(): void {
    localStorage.removeItem('app_mode');
    const defaultMode = ENV.IS_PROD ? 'production' : 'mock';
    this.setMode(defaultMode);
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

/**
 * Instance singleton de la configuration
 * 
 * Usage:
 * ```typescript
 * import { AppConfig } from '@/config/app.config';
 * 
 * // Vérifier le mode
 * if (AppConfig.isMock) {
 *   // Utiliser mock data
 * }
 * 
 * // Passer en production
 * AppConfig.setMode('production');
 * 
 * // Basculer entre les modes
 * AppConfig.toggleMode();
 * ```
 */
export const AppConfig = new ApplicationConfig();

// Exposer globalement pour debug en console
if (typeof window !== 'undefined') {
  (window as any).AppConfig = AppConfig;
  console.log('%c💡 Astuce: Tapez "AppConfig.toggleMode()" dans la console pour changer de mode', 'color: blue;');
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Hook React pour utiliser la configuration
 */
export function useAppConfig() {
  return AppConfig.config;
}

/**
 * Hook React pour le mode actuel
 */
export function useAppMode() {
  return AppConfig.mode;
}