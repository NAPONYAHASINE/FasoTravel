/**
 * localStorage Service - TransportBF Mobile
 * 
 * Gestion centralisée de la persistence des données
 * Avec support TTL et préfixe automatique
 */

import { STORAGE_CONFIG } from '../config';

interface StoredData<T> {
  value: T;
  timestamp: number;
  ttl?: number;
}

class LocalStorageService {
  private prefix = STORAGE_CONFIG.prefix;
  private defaultTTL = STORAGE_CONFIG.defaultTTL;

  /**
   * Récupère une valeur du localStorage
   */
  get<T = any>(key: string, defaultValue?: T): T | null {
    try {
      const fullKey = this.getFullKey(key);
      const stored = localStorage.getItem(fullKey);
      
      if (!stored) {
        return defaultValue ?? null;
      }

      const data: StoredData<T> = JSON.parse(stored);

      // Vérifier TTL
      if (data.ttl) {
        const age = Date.now() - data.timestamp;
        if (age > data.ttl) {
          this.remove(key);
          return defaultValue ?? null;
        }
      }

      return data.value;
    } catch (error) {
      console.error(`❌ Error reading from localStorage [${key}]:`, error);
      return defaultValue ?? null;
    }
  }

  /**
   * Stocke une valeur dans le localStorage
   */
  set<T = any>(key: string, value: T, ttl?: number): void {
    try {
      const fullKey = this.getFullKey(key);
      const data: StoredData<T> = {
        value,
        timestamp: Date.now(),
        ttl: ttl || this.defaultTTL,
      };
      localStorage.setItem(fullKey, JSON.stringify(data));
    } catch (error) {
      console.error(`❌ Error writing to localStorage [${key}]:`, error);
    }
  }

  /**
   * Supprime une clé
   */
  remove(key: string): void {
    try {
      const fullKey = this.getFullKey(key);
      localStorage.removeItem(fullKey);
    } catch (error) {
      console.error(`❌ Error removing from localStorage [${key}]:`, error);
    }
  }

  /**
   * Nettoie tout (avec préfixe)
   */
  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('❌ Error clearing localStorage:', error);
    }
  }

  /**
   * Vérifie si une clé existe
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Récupère toutes les clés avec ce préfixe
   */
  keys(): string[] {
    const allKeys = Object.keys(localStorage);
    return allKeys
      .filter(k => k.startsWith(this.prefix))
      .map(k => k.substring(this.prefix.length));
  }

  /**
   * Obtient la clé complète avec préfixe
   */
  private getFullKey(key: string): string {
    return `${this.prefix}${key}`;
  }
}

export const storageService = new LocalStorageService();
