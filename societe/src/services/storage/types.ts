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
  | 'operatorServices'
  | 'auth_token'
  | 'auth_user'
  | 'refresh_token'
  | 'token_expires_at'
  | '_pending_otp_user';

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
  operatorServices: any[]; // OperatorServiceItem[]
  auth_token: string;
  auth_user: any; // Type User à définir
  refresh_token: string;
  token_expires_at: string;
  _pending_otp_user: any;
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
