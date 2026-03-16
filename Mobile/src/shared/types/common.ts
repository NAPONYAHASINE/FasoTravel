/**
 * 🎯 COMMON TYPES - PARTAGÉ MOBILE & SOCIETE
 * 
 * Types unifiés pour garantir compatibilité entre:
 * - Mobile (Passagers)
 * - Societe (Opérateurs)
 * - Backend API
 */

// ============================================
// AUTHENTICATION TYPES
// ============================================

/**
 * User Base - Utilisé par Mobile ET Societe
 * Chacun peut l'étendre avec ses propriétés spécifiques
 */
export interface BaseUser {
  id: string;
  email: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

/**
 * Utilisateur Mobile (Passager)
 */
export interface PassengerUser extends BaseUser {
  phone: string;
  firstName: string;
  lastName: string;
  role: 'PASSENGER';
  profileImage?: string;
}

/**
 * Utilisateur Societe (Opérateur)
 */
export interface OperatorUser extends BaseUser {
  name: string;
  role: 'manager' | 'cashier' | 'responsable';
  gareId?: string;
  gareName?: string;
  companyId?: string;
}

/**
 * Type Union - User peut être Passager OU Opérateur
 */
export type User = PassengerUser | OperatorUser;

/**
 * Helper pour vérifier le type d'utilisateur
 */
export const isPassengerUser = (user: User): user is PassengerUser => {
  return (user as PassengerUser).firstName !== undefined;
};

export const isOperatorUser = (user: User): user is OperatorUser => {
  return (user as OperatorUser).name !== undefined;
};

/**
 * Réponse d'authentification - UNIFIÉE
 */
export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
  expiresIn?: number;
}

/**
 * Credentials pour login Mobile
 */
export interface AuthCredentials {
  email: string;
  password: string;
}

/**
 * Data pour register Mobile
 */
export interface AuthRegisterData {
  email: string;
  password: string;
  phone: string;
  firstName: string;
  lastName: string;
}

/**
 * Data pour login/register Societe
 */
export interface AuthRegisterDataOperator {
  email: string;
  password: string;
  name: string;
  role: 'responsable' | 'manager' | 'cashier';
  companyId?: string;
  gareId?: string;
  gareName?: string;
}

// ============================================
// API ERROR HANDLING
// ============================================

/**
 * Erreur API standardisée
 */
export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: Record<string, unknown>;
}

/**
 * API Response générique
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

// ============================================
// SHARED ENUMS
// ============================================

export enum PaymentMethod {
  CASH = 'cash',
  ORANGE_MONEY = 'orange_money',
  MOOV_MONEY = 'moov_money',
  WAVE = 'wave',
  CARD = 'card',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum TicketStatus {
  ACTIVE = 'active',
  BOARDED = 'boarded',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TripStatus {
  SCHEDULED = 'scheduled',
  BOARDING = 'boarding',
  DEPARTED = 'departed',
  ARRIVED = 'arrived',
  CANCELLED = 'cancelled',
}

// ============================================
// SHARED DATA TYPES
// ============================================

/**
 * Station (Gare)
 */
export interface Station {
  id: string;
  name: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
}

/**
 * Trip (Trajet)
 */
export interface Trip {
  id: string;
  departureStationId: string;
  departureStation?: Station;
  arrivalStationId: string;
  arrivalStation?: Station;
  departureTime: string;
  arrivalTime: string;
  price: number;
  availableSeats: number;
  totalSeats: number;
  operatorId: string;
  operatorName: string;
  status: TripStatus;
  vehicleType: string;
}

/**
 * Ticket
 */
export interface Ticket {
  id: string;
  tripId: string;
  trip?: Trip;
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string;
  seatNumber: string;
  bookingId: string;
  status: TicketStatus;
  qrCode?: string;
  purchasedAt: string;
}

/**
 * Booking
 */
export interface Booking {
  id: string;
  userId: string;
  tripId: string;
  tickets: Ticket[];
  totalPrice: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// MOCK DATA TYPE
// ============================================

/**
 * Données de test pour Mobile & Societe
 */
export interface MockData {
  trips: Trip[];
  stations: Station[];
  tickets: Ticket[];
  bookings: Booking[];
  managers?: OperatorUser[];
  cashiers?: OperatorUser[];
}
