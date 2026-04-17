/**
 * 🎯 COMMON TYPES - PARTAGÉ MOBILE & SOCIETE
 * 
 * Types unifiés pour garantir compatibilité entre:
 * - Mobile (Passagers)
 * - Societe (Opérateurs)
 * - Backend API
 */

// ============================================
// REFERRAL / PARRAINAGE TYPES
// ============================================

export type ReferralBadgeLevel = 'standard' | 'ambassadeur' | 'super_ambassadeur' | 'legende';

export interface ReferralInfo {
  referralCode: string;
  pointsBalance: number;
  totalReferrals: number;
  badgeLevel: ReferralBadgeLevel;
  referredUsers: ReferredUser[];
  shareLink: string;
}

export interface ReferredUser {
  id: string;
  name: string;
  joinedAt: string;
  pointsEarned: number;
}

export interface ReferralCoupon {
  id: string;
  code: string;
  amount: number;        // ex: 500 or 1000 FCFA
  pointsCost: number;    // ex: 100 or 200
  status: 'active' | 'used' | 'expired' | 'cancelled';
  createdAt: string;
  expiresAt: string;
  usedAt?: string;
}

export const REFERRAL_BADGE_THRESHOLDS: Record<ReferralBadgeLevel, number> = {
  standard: 0,
  ambassadeur: 100,
  super_ambassadeur: 250,
  legende: 500,
};

export const REFERRAL_COUPON_TIERS = [
  { pointsCost: 100, amount: 500, label: '500 FCFA' },
  { pointsCost: 200, amount: 1000, label: '1 000 FCFA' },
] as const;

export const POINTS_PER_REFERRAL = 10;

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
  // Referral / Parrainage
  referralCode?: string;
  referredBy?: string;
  referralPointsBalance?: number;
  totalReferrals?: number;
  badgeLevel?: ReferralBadgeLevel;
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
 * Le backend renvoie otpRequired=true pour les non-admin (OTP via WhatsApp).
 */
export interface AuthResponse {
  user?: User;
  token?: string;
  refreshToken?: string;
  expiresIn?: number;
  otpRequired?: boolean;
  identifier?: string;
  message?: string;
  otpCode?: string; // dev only
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
  referralCode?: string;  // Code de parrainage reçu
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
