/**
 * @file types/index.ts
 * @description Type re-exports for backward compatibility
 * 
 * ⚠️ IMPORTANT: This file re-exports types from the standardized source
 * All types come from /shared/types/standardized.ts (SINGLE SOURCE OF TRUTH)
 * 
 * ⚠️ RAPPEL CRITIQUE - RÉSERVATIONS ≠ BILLETS:
 * - RÉSERVATIONS (Booking): EN_ATTENTE | CONFIRMÉ | TERMINÉ | ANNULÉ
 *   → Défini dans /lib/adminMockData.ts (type Booking propre)
 * - BILLETS (Ticket): ACTIF | EMBARQUÉ | EXPIRÉ | ANNULÉ
 *   → Défini dans /shared/types/standardized.ts
 * - Une réservation CONFIRMÉE génère un billet ACTIF
 * - CE NE SONT PAS LES MÊMES ENTITÉS
 */

// Re-export all standardized types
export type {
  // User types
  PassengerUser,
  AdminUser,
  OperatorUser,
  
  // Transport entities
  TransportCompany,
  Station,
  Route,
  Trip,
  Ticket,
  
  // Business entities
  Incident,
  Story,
  Review,
  Support,
  AuditLog,
  
  // Admin-specific types
  Notification,
  Payment,
  RevenueStats,
  Integration,
  FeatureFlag,
  Advertisement,
  Promotion,
  UserSession,
  OperatorPolicy,
  OperatorService,
  
  // Stats types
  DashboardStats,
  TicketStats,
  UserStats,
  
  // Other entities
  Manager,
  Cashier,
  
  // Booking
  BookingCreateData
} from '../shared/types/standardized';

// ============= LEGACY TYPE ALIASES =============

import type {
  PassengerUser as User,
  TransportCompany as Operator,
  OperatorService,
  Advertisement,
  UserSession,
  OperatorPolicy,
  Payment,
  Ticket,
  Support,
  TicketStats,
  UserStats,
  AuditLog,
  Notification
} from '../shared/types/standardized';

// Export with legacy names
export type { User, Operator };

// ⚠️ ATTENTION: Booking ≠ Ticket !
// Booking = Réservation (EN_ATTENTE, CONFIRMÉ, TERMINÉ, ANNULÉ)
// Ticket = Billet (ACTIF, EMBARQUÉ, EXPIRÉ, ANNULÉ)
// Les deux types sont définis dans /shared/types/standardized.ts (source unique de vérité)
export type { Booking, BookingStatus, BookingStats } from '../shared/types/standardized';

// LegacyTicket reste un alias pour Ticket (billets)
export type LegacyTicket = Ticket;

// SystemLog type (alias for AuditLog)
export type SystemLog = AuditLog;

// AnalyticsEvent type
export interface AnalyticsEvent {
  id: string;
  type: string;
  userId?: string;
  data?: Record<string, any>;
  timestamp: string;
}

// ============= DERIVED TYPES =============

// Service types
export type ServiceType = OperatorService['type'];

// Ad types
export type AdMediaType = Advertisement['mediaType'];
export type AdActionType = Advertisement['actionType'];
export type AdStatus = Advertisement['status'];

// Policy types  
export type PolicyType = OperatorPolicy['type'];

// Incident types - Using proper Incident interface
export type IncidentStatus = 'open' | 'in-progress' | 'resolved';
export type IncidentType = 'accident' | 'delay' | 'cancellation' | 'mechanical' | 'other';

// Integration types
export type IntegrationCategory = 'payment' | 'sms' | 'email' | 'analytics' | 'mapping';

// Session types
export type DeviceType = UserSession['deviceType'];

// Payment types (statuts paiement - différent des billets et réservations)
export type PaymentStatus = Payment['status'];
export type PaymentMethod = Payment['method'];

// Ticket status types (BILLETS: active, boarded, expired, cancelled)
export type TicketStatus = Ticket['status'];

// User types
export type UserRole = 'USER' | 'ADMIN' | 'OPERATOR';

// Review types
export type ReviewStatus = 'pending' | 'approved' | 'rejected';

// Support types
export type TicketType = Support['category'];
export type SupportTicketStatus = Support['status'];

// Notification types
export type NotificationType = Notification['type'];

// ============= STAT OVERVIEW TYPES =============

export interface TicketStatsOverview extends TicketStats {
  // Additional fields if needed
}

export interface UserStatsOverview extends UserStats {
  // Additional fields if needed
}

// ============= CONSTANTS =============
// ⚠️ TOUTES les constantes de labels sont dans /lib/constants.ts (source unique)
// Ne PAS dupliquer ici — importer depuis lib/constants.ts directement