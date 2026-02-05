/**
 * 🎯 STANDARDIZED TYPES - SOURCE UNIQUE DE VÉRITÉ
 * 
 * Types harmonisés pour Mobile ET Societe
 * À utiliser pour backend API aussi
 * 
 * Date: 2026-01-23
 * Version: 1.0
 */

// ============================================
// PAYMENT METHOD (MODE DE PAIEMENT)
// ============================================

/**
 * Méthodes de paiement acceptées
 * HARMONISÉE pour Mobile + Societe
 */
export enum PaymentMethod {
  CASH = 'cash',
  MOBILE_MONEY = 'mobile_money',
  CARD = 'card',
}

export const PAYMENT_METHOD_VALUES = Object.values(PaymentMethod);

// ============================================
// TICKET STATUS (STATUT DU BILLET)
// ============================================

/**
 * Statuts possibles d'un billet
 * ✅ Aligné avec logique métier Mobile:
 * - PAID: Billet acheté, prêt à voyager (actif)
 * - EMBARKED: Passager en voyage (embarqué)
 * - REFUNDED: Billet remboursé
 * - CANCELLED: Billet annulé
 * HARMONISÉE pour Mobile + Societe
 */
export enum TicketStatus {
  PAID = 'paid',          // Billet acheté et valide (statut "Actif")
  EMBARKED = 'embarked',  // Passager embarqué et en voyage
  REFUNDED = 'refunded',  // Billet remboursé
  CANCELLED = 'cancelled', // Billet annulé
}

export const TICKET_STATUS_VALUES = Object.values(TicketStatus);

// ============================================
// TRIP STATUS (STATUT DU TRAJET)
// ============================================

/**
 * Statuts possibles d'un trajet
 * HARMONISÉE pour Mobile + Societe
 */
export enum TripStatus {
  SCHEDULED = 'scheduled',   // Trajet programmé
  BOARDING = 'boarding',     // Embarquement en cours
  DEPARTED = 'departed',     // Trajet en route
  ARRIVED = 'arrived',       // Trajet arrivé
  CANCELLED = 'cancelled',   // Trajet annulé
}

export const TRIP_STATUS_VALUES = Object.values(TripStatus);

// ============================================
// SERVICE CLASS (CLASSE DE SERVICE)
// ============================================

/**
 * Classes de service disponibles
 * HARMONISÉE pour Mobile + Societe
 */
export enum ServiceClass {
  STANDARD = 'standard',
  VIP = 'vip',
  EXPRESS = 'express',
}

export const SERVICE_CLASS_VALUES = Object.values(ServiceClass);

// ============================================
// SALES CHANNEL (CANAL DE VENTE)
// ============================================

/**
 * Canaux de vente
 * Spécifique à Societe (Dashboard)
 */
export enum SalesChannel {
  ONLINE = 'online',     // Vente app mobile
  COUNTER = 'counter',   // Vente au guichet
}

export const SALES_CHANNEL_VALUES = Object.values(SalesChannel);

// ============================================
// USER ROLE (RÔLE UTILISATEUR)
// ============================================

/**
 * Rôles pour Societe (Dashboard)
 */
export enum UserRoleSociete {
  RESPONSABLE = 'responsable',  // Responsable exploitation
  MANAGER = 'manager',          // Manager gare
  CASHIER = 'caissier',         // Caissier
}

/**
 * Rôles pour Mobile (Passagers)
 */
export enum UserRoleMobile {
  PASSENGER = 'PASSENGER',
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Valide si une valeur est un PaymentMethod valide
 */
export const isValidPaymentMethod = (value: unknown): value is PaymentMethod => {
  return Object.values(PaymentMethod).includes(value as PaymentMethod);
};

/**
 * Valide si une valeur est un TicketStatus valide
 */
export const isValidTicketStatus = (value: unknown): value is TicketStatus => {
  return Object.values(TicketStatus).includes(value as TicketStatus);
};

/**
 * Valide si une valeur est un TripStatus valide
 */
export const isValidTripStatus = (value: unknown): value is TripStatus => {
  return Object.values(TripStatus).includes(value as TripStatus);
};

/**
 * Valide si une valeur est une ServiceClass valide
 */
export const isValidServiceClass = (value: unknown): value is ServiceClass => {
  return Object.values(ServiceClass).includes(value as ServiceClass);
};

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Booking (Réservation) harmonisée
 */
export interface Booking {
  id: string;
  tripId: string;
  passengerName: string;
  passengerPhone: string;
  seatNumber: string;
  price: number;
  paymentMethod: PaymentMethod;
  status: TicketStatus;
  purchaseDate: string;
}

/**
 * Trip (Trajet) harmonisée
 */
export interface Trip {
  id: string;
  departureStation: string;
  arrivalStation: string;
  departureTime: string;
  arrivalTime: string;
  totalSeats: number;
  availableSeats: number;
  price: number;
  status: TripStatus;
  serviceClass: ServiceClass;
}
