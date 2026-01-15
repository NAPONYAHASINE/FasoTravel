/**
 * Système de Logs Professionnel pour TransportBF Dashboard
 * 
 * Features:
 * - Niveaux de logs (debug, info, warn, error)
 * - Désactivation automatique en production
 * - Contexte automatique (composant, timestamp)
 * - Colorisation pour lisibilité
 * - Filtrage par catégorie
 */

// Détection de l'environnement
const isDevelopment = process.env.NODE_ENV === 'development' || 
                      window.location.hostname === 'localhost' ||
                      window.location.hostname === '127.0.0.1';

// Configuration des logs
const LOG_CONFIG = {
  // Activer/désactiver par niveau
  enableDebug: isDevelopment,
  enableInfo: true, // Info important même en production
  enableWarn: true,
  enableError: true,

  // Catégories à logger (vide = tout)
  allowedCategories: [] as string[], // Ex: ['vente', 'caisse', 'auth']
  
  // Afficher timestamp
  showTimestamp: isDevelopment,
  
  // Afficher nom du composant
  showComponent: isDevelopment,
};

// Types de logs
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogCategory = 
  | 'auth'       // Connexion, déconnexion
  | 'vente'      // Ventes de billets
  | 'caisse'     // Gestion caisse
  | 'trip'       // Gestion des trips
  | 'refund'     // Remboursements
  | 'data'       // Manipulation données
  | 'api'        // Appels API (futur)
  | 'ui'         // Interactions UI
  | 'analytics'  // Calculs analytics
  | 'general';   // Logs généraux

// Couleurs console
const COLORS = {
  debug: '#9CA3AF',   // Gris
  info: '#3B82F6',    // Bleu
  warn: '#F59E0B',    // Jaune
  error: '#DC2626',   // Rouge
  category: '#16A34A', // Vert
  component: '#8B5CF6', // Violet
};

/**
 * Classe Logger avec contexte
 */
class Logger {
  private component?: string;
  private category: LogCategory;

  constructor(component?: string, category: LogCategory = 'general') {
    this.component = component;
    this.category = category;
  }

  /**
   * Vérifie si la catégorie est autorisée
   */
  private isCategoryAllowed(): boolean {
    if (LOG_CONFIG.allowedCategories.length === 0) return true;
    return LOG_CONFIG.allowedCategories.includes(this.category);
  }

  /**
   * Formatte le préfixe du log
   */
  private formatPrefix(level: LogLevel): string {
    const parts: string[] = [];

    // Timestamp
    if (LOG_CONFIG.showTimestamp) {
      const now = new Date();
      const time = now.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
      parts.push(`[${time}]`);
    }

    // Niveau
    parts.push(`[${level.toUpperCase()}]`);

    // Catégorie
    parts.push(`[${this.category}]`);

    // Composant
    if (LOG_CONFIG.showComponent && this.component) {
      parts.push(`[${this.component}]`);
    }

    return parts.join(' ');
  }

  /**
   * Log de debug (développement uniquement)
   */
  debug(...args: any[]): void {
    if (!LOG_CONFIG.enableDebug || !this.isCategoryAllowed()) return;

    const prefix = this.formatPrefix('debug');
    console.log(
      `%c${prefix}`,
      `color: ${COLORS.debug}; font-weight: bold;`,
      ...args
    );
  }

  /**
   * Log d'information
   */
  info(...args: any[]): void {
    if (!LOG_CONFIG.enableInfo || !this.isCategoryAllowed()) return;

    const prefix = this.formatPrefix('info');
    console.log(
      `%c${prefix}`,
      `color: ${COLORS.info}; font-weight: bold;`,
      ...args
    );
  }

  /**
   * Log d'avertissement
   */
  warn(...args: any[]): void {
    if (!LOG_CONFIG.enableWarn || !this.isCategoryAllowed()) return;

    const prefix = this.formatPrefix('warn');
    console.warn(
      `%c${prefix}`,
      `color: ${COLORS.warn}; font-weight: bold;`,
      ...args
    );
  }

  /**
   * Log d'erreur
   */
  error(...args: any[]): void {
    if (!LOG_CONFIG.enableError || !this.isCategoryAllowed()) return;

    const prefix = this.formatPrefix('error');
    console.error(
      `%c${prefix}`,
      `color: ${COLORS.error}; font-weight: bold;`,
      ...args
    );
  }

  /**
   * Log groupé (pour structures complexes)
   */
  group(title: string, data: any, level: LogLevel = 'debug'): void {
    if (!this.isCategoryAllowed()) return;

    const levelEnabled = {
      debug: LOG_CONFIG.enableDebug,
      info: LOG_CONFIG.enableInfo,
      warn: LOG_CONFIG.enableWarn,
      error: LOG_CONFIG.enableError,
    }[level];

    if (!levelEnabled) return;

    const prefix = this.formatPrefix(level);
    console.group(`%c${prefix} ${title}`, `color: ${COLORS[level]}; font-weight: bold;`);
    console.log(data);
    console.groupEnd();
  }

  /**
   * Log de table (pour arrays)
   */
  table(data: any[], level: LogLevel = 'debug'): void {
    if (!this.isCategoryAllowed()) return;

    const levelEnabled = {
      debug: LOG_CONFIG.enableDebug,
      info: LOG_CONFIG.enableInfo,
      warn: LOG_CONFIG.enableWarn,
      error: LOG_CONFIG.enableError,
    }[level];

    if (!levelEnabled) return;

    const prefix = this.formatPrefix(level);
    console.log(`%c${prefix}`, `color: ${COLORS[level]}; font-weight: bold;`);
    console.table(data);
  }

  /**
   * Log de performance
   */
  time(label: string): void {
    if (!LOG_CONFIG.enableDebug || !this.isCategoryAllowed()) return;
    console.time(`${this.formatPrefix('debug')} ${label}`);
  }

  timeEnd(label: string): void {
    if (!LOG_CONFIG.enableDebug || !this.isCategoryAllowed()) return;
    console.timeEnd(`${this.formatPrefix('debug')} ${label}`);
  }
}

/**
 * Factory pour créer des loggers avec contexte
 */
export function createLogger(component: string, category: LogCategory = 'general'): Logger {
  return new Logger(component, category);
}

/**
 * Logger par défaut (sans contexte)
 */
export const logger = new Logger(undefined, 'general');

/**
 * Configuration globale des logs
 */
export const configureLogger = (config: Partial<typeof LOG_CONFIG>) => {
  Object.assign(LOG_CONFIG, config);
};

/**
 * Helpers rapides pour logs courants
 */
export const logVente = createLogger('Vente', 'vente');
export const logCaisse = createLogger('Caisse', 'caisse');
export const logAuth = createLogger('Auth', 'auth');
export const logTrip = createLogger('Trip', 'trip');
export const logRefund = createLogger('Refund', 'refund');
export const logData = createLogger('Data', 'data');
export const logAnalytics = createLogger('Analytics', 'analytics');

/**
 * Exemple d'utilisation :
 * 
 * import { logVente, createLogger } from '../utils/logger';
 * 
 * // Dans un composant
 * const logger = createLogger('TicketSalePage', 'vente');
 * 
 * logger.debug('Initialisation de la page');
 * logger.info('Vente démarrée', { tripId, seatNumber });
 * logger.warn('Siège déjà occupé', seatNumber);
 * logger.error('Erreur lors de la vente', error);
 * 
 * // Logs groupés
 * logger.group('Données ticket', ticket, 'info');
 * 
 * // Performance
 * logger.time('Calcul revenus');
 * // ... calculs ...
 * logger.timeEnd('Calcul revenus');
 */
