/**
 * Service de persistance localStorage pour TransportBF
 * 
 * Gère la sauvegarde et la récupération des données en local
 * avec logs automatiques et gestion d'erreurs robuste.
 */

import { API_CONFIG } from '../config';
import { logger } from '../../utils/logger';
import type { StorageKey, StorageTypeMap, StorageOptions, StorageResult } from './types';

class LocalStorageService {
  private prefix: string;
  private isAvailable: boolean;

  constructor() {
    this.prefix = API_CONFIG.storagePrefix;
    // Vérifier si localStorage est disponible
    this.isAvailable = this.checkAvailability();
  }

  /**
   * Vérifier si localStorage est disponible
   */
  private checkAvailability(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Construire la clé complète avec préfixe
   */
  private getKey(key: StorageKey): string {
    return `${this.prefix}${key}`;
  }

  /**
   * Sauvegarder des données dans localStorage
   */
  set<K extends StorageKey>(
    key: K,
    data: StorageTypeMap[K],
    options?: StorageOptions
  ): StorageResult<void> {
    if (!this.isAvailable) {
      logger.error('❌ localStorage non disponible', { key });
      return {
        success: false,
        error: 'localStorage non disponible',
      };
    }

    try {
      const fullKey = this.getKey(key);
      
      // Préparer les données avec métadonnées
      const storageData = {
        data,
        timestamp: Date.now(),
        expiresAt: options?.expiresIn ? Date.now() + options.expiresIn : null,
      };
      
      const serialized = JSON.stringify(storageData);
      localStorage.setItem(fullKey, serialized);
      
      // Log pour le debugging
      const count = Array.isArray(data) ? data.length : 1;
      logger.debug('💾 Données sauvegardées', {
        key,
        count,
        size: `${(serialized.length / 1024).toFixed(2)} KB`,
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('❌ Erreur sauvegarde localStorage', { key, error: errorMessage });
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Récupérer des données depuis localStorage
   */
  get<K extends StorageKey>(key: K): StorageTypeMap[K] | null {
    if (!this.isAvailable) {
      logger.error('❌ localStorage non disponible', { key });
      return null;
    }

    try {
      const fullKey = this.getKey(key);
      const item = localStorage.getItem(fullKey);
      
      if (!item) {
        return null;
      }
      
      const parsed = JSON.parse(item);
      
      // Vérifier l'expiration
      if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
        logger.warn('⏰ Données expirées', { key });
        this.remove(key);
        return null;
      }
      
      const count = Array.isArray(parsed.data) ? parsed.data.length : 1;
      logger.debug('📖 Données chargées', { key, count });
      
      return parsed.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('❌ Erreur lecture localStorage', { key, error: errorMessage });
      return null;
    }
  }

  /**
   * Supprimer une clé du localStorage
   */
  remove(key: StorageKey): void {
    if (!this.isAvailable) {
      logger.error('❌ localStorage non disponible', { key });
      return;
    }

    try {
      const fullKey = this.getKey(key);
      localStorage.removeItem(fullKey);
      logger.debug('🗑️ Données supprimées', { key });
    } catch (error) {
      logger.error('❌ Erreur suppression localStorage', { key, error });
    }
  }

  /**
   * Vider tout le localStorage de l'application
   */
  clear(): void {
    if (!this.isAvailable) {
      logger.error('❌ localStorage non disponible');
      return;
    }

    try {
      const keysToRemove: string[] = [];
      
      // Trouver toutes les clés avec notre préfixe
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }
      
      // Supprimer toutes les clés
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      logger.info('🧹 localStorage nettoyé', { count: keysToRemove.length });
    } catch (error) {
      logger.error('❌ Erreur nettoyage localStorage', { error });
    }
  }

  /**
   * Vérifier si une clé existe
   */
  has(key: StorageKey): boolean {
    if (!this.isAvailable) return false;
    
    try {
      const fullKey = this.getKey(key);
      return localStorage.getItem(fullKey) !== null;
    } catch {
      return false;
    }
  }

  /**
   * Obtenir la taille totale du localStorage (en KB)
   */
  getSize(): number {
    if (!this.isAvailable) return 0;
    
    let total = 0;
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          const item = localStorage.getItem(key);
          if (item) {
            total += item.length;
          }
        }
      }
    } catch {
      // Ignorer les erreurs
    }
    
    return total / 1024; // Convertir en KB
  }

  /**
   * Exporter toutes les données en JSON (pour backup)
   */
  export(): string {
    if (!this.isAvailable) return '{}';
    
    const data: Record<string, any> = {};
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          const item = localStorage.getItem(key);
          if (item) {
            data[key] = JSON.parse(item);
          }
        }
      }
    } catch {
      // Ignorer les erreurs
    }
    
    return JSON.stringify(data, null, 2);
  }

  /**
   * Importer des données depuis JSON (pour restore)
   */
  import(jsonData: string): StorageResult<void> {
    if (!this.isAvailable) {
      return {
        success: false,
        error: 'localStorage non disponible',
      };
    }
    
    try {
      const data = JSON.parse(jsonData);
      
      Object.entries(data).forEach(([key, value]) => {
        if (key.startsWith(this.prefix)) {
          localStorage.setItem(key, JSON.stringify(value));
        }
      });
      
      logger.info('📥 Données importées', { count: Object.keys(data).length });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('❌ Erreur import données', { error: errorMessage });
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Obtenir des statistiques sur le stockage
   */
  getStats() {
    const stats = {
      totalSize: this.getSize(),
      keys: [] as { key: string; size: number; count: number }[],
    };
    
    if (!this.isAvailable) return stats;
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          const item = localStorage.getItem(key);
          if (item) {
            const parsed = JSON.parse(item);
            const count = Array.isArray(parsed.data) ? parsed.data.length : 1;
            
            stats.keys.push({
              key: key.replace(this.prefix, ''),
              size: item.length / 1024,
              count,
            });
          }
        }
      }
    } catch {
      // Ignorer les erreurs
    }
    
    return stats;
  }
}

// Export singleton
export const storageService = new LocalStorageService();