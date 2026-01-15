/**
 * Types pour le système de stockage localStorage
 */

import type { 
  Ticket, 
  Trip, 
  Route, 
  Station, 
  Manager, 
  Cashier, 
  ScheduleTemplate,
  Story,
  CashTransaction 
} from '../../contexts/DataContext';

/**
 * Clés de stockage disponibles
 */
export type StorageKey = 
  | 'tickets'
  | 'trips'
  | 'routes'
  | 'stations'
  | 'managers'
  | 'cashiers'
  | 'scheduleTemplates'
  | 'stories'
  | 'cashTransactions'
  | 'priceSegments'
  | 'priceHistory'
  | 'auth_token'
  | 'auth_user';

/**
 * Mapping des clés vers leurs types
 */
export interface StorageTypeMap {
  tickets: Ticket[];
  trips: Trip[];
  routes: Route[];
  stations: Station[];
  managers: Manager[];
  cashiers: Cashier[];
  scheduleTemplates: ScheduleTemplate[];
  stories: Story[];
  cashTransactions: CashTransaction[];
  priceSegments: any[]; // Type à définir
  priceHistory: any[]; // Type à définir
  auth_token: string;
  auth_user: any; // Type User à définir
}

/**
 * Options pour les opérations de stockage
 */
export interface StorageOptions {
  // Expiration en millisecondes (optionnel)
  expiresIn?: number;
  
  // Chiffrement (pour données sensibles)
  encrypt?: boolean;
}

/**
 * Résultat d'une opération de stockage
 */
export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
