/**
 * 🎯 STANDARDIZED TYPES - SOURCE UNIQUE DE VÉRITÉ
 * 
 * Types harmonisés pour Admin, Mobile ET Societe
 * À utiliser pour backend API aussi
 * 
 * CONVENTION: Le backend envoie ces valeurs exactes.
 * Chaque app peut mapper pour l'affichage (labels localisés).
 * 
 * Date: 2026-03-11
 * Version: 2.0
 */

// ============================================
// PAYMENT METHOD (MODE DE PAIEMENT)
// ============================================

/**
 * Méthodes de paiement acceptées
 * HARMONISÉE pour Admin + Mobile + Societe + Backend
 * 
 * Le backend stocke ces valeurs. Les labels d'affichage (ex: "Orange Money")
 * sont gérés par chaque app dans ses constantes UI.
 */
export enum PaymentMethod {
  CASH = 'cash',
  ORANGE_MONEY = 'orange_money',
  MOOV_MONEY = 'moov_money',
  WAVE = 'wave',
  CARD = 'card',
}

export const PAYMENT_METHOD_VALUES = Object.values(PaymentMethod);

// ============================================
// TICKET STATUS (STATUT DU BILLET)
// ============================================

/**
 * Statuts d'un BILLET (≠ réservation)
 * 
 * Backend envoie ces valeurs. Chaque app affiche ses labels:
 * - Admin FR: Actif, Embarqué, Expiré, Annulé, Remboursé
 * - Mobile: Active, Boarded, Expired, Cancelled, Refunded
 * - Societe FR: Actif, Embarqué, Expiré, Annulé, Remboursé
 */
export enum TicketStatus {
  ACTIVE = 'active',
  BOARDED = 'boarded',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export const TICKET_STATUS_VALUES = Object.values(TicketStatus);

// ============================================
// BOOKING STATUS (STATUT DE RÉSERVATION)
// ============================================

/**
 * Statuts d'une RÉSERVATION (≠ billet)
 * FLUX: pending → confirmed → completed | cancelled
 */
export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export const BOOKING_STATUS_VALUES = Object.values(BookingStatus);

// ============================================
// TRIP STATUS (STATUT DU TRAJET)
// ============================================

export enum TripStatus {
  SCHEDULED = 'scheduled',
  BOARDING = 'boarding',
  DEPARTED = 'departed',
  ARRIVED = 'arrived',
  CANCELLED = 'cancelled',
}

export const TRIP_STATUS_VALUES = Object.values(TripStatus);

// ============================================
// PAYMENT STATUS (STATUT DE PAIEMENT)
// ============================================

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export const PAYMENT_STATUS_VALUES = Object.values(PaymentStatus);

// ============================================
// SERVICE CLASS (CLASSE DE SERVICE)
// ============================================

export enum ServiceClass {
  STANDARD = 'standard',
  VIP = 'vip',
  EXPRESS = 'express',
}

export const SERVICE_CLASS_VALUES = Object.values(ServiceClass);

// ============================================
// SALES CHANNEL (CANAL DE VENTE)
// ============================================

export enum SalesChannel {
  ONLINE = 'online',
  COUNTER = 'counter',
}

export const SALES_CHANNEL_VALUES = Object.values(SalesChannel);

// ============================================
// USER ROLES
// ============================================

export type AdminRole = 'SUPER_ADMIN' | 'OPERATOR_ADMIN' | 'SUPPORT_ADMIN' | 'FINANCE_ADMIN';
export type OperatorRole = 'responsable' | 'manager' | 'caissier';
export type PassengerRole = 'PASSENGER';

// ============================================
// HELPER FUNCTIONS
// ============================================

export const isValidPaymentMethod = (value: unknown): value is PaymentMethod => {
  return Object.values(PaymentMethod).includes(value as PaymentMethod);
};

export const isValidTicketStatus = (value: unknown): value is TicketStatus => {
  return Object.values(TicketStatus).includes(value as TicketStatus);
};

export const isValidTripStatus = (value: unknown): value is TripStatus => {
  return Object.values(TripStatus).includes(value as TripStatus);
};

export const isValidServiceClass = (value: unknown): value is ServiceClass => {
  return Object.values(ServiceClass).includes(value as ServiceClass);
};

export const isValidBookingStatus = (value: unknown): value is BookingStatus => {
  return Object.values(BookingStatus).includes(value as BookingStatus);
};

// ============================================
// USER INTERFACES
// ============================================

/** PassengerUser - Utilisateur app Mobile */
export interface PassengerUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  profileImage?: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  phoneVerifiedAt?: string;
  emailVerifiedAt?: string;
  lastLoginAt?: string;
  verified?: boolean;
  totalBookings?: number;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  createdAt: string;
  updatedAt: string;
}

/** AdminUser - Administrateur plateforme FasoTravel */
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  permissions?: string[];
  operatorId?: string;
  status: 'active' | 'inactive' | 'suspended';
  fullName?: string;
  mfaEnabled?: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** OperatorUser - Employé société de transport (app Societe) */
export interface OperatorUser {
  id: string;
  email: string;
  name: string;
  role: OperatorRole;
  companyId: string;
  companyName: string;
  stationId?: string;
  stationName?: string;
  gareId?: string;
  gareName?: string;
  shiftStartTime?: string;
  shiftEndTime?: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// TRANSPORT ENTITIES
// ============================================

/** TransportCompany - Société de transport */
export interface TransportCompany {
  id: string;
  name: string;
  legalName?: string;
  logo?: string;
  email: string;
  phone: string;
  registrationNumber?: string;
  taxId?: string;
  address?: string;
  commission: number;
  status: 'active' | 'suspended' | 'pending';
  amenities?: string[];
  luggagePrice?: number;
  contactPersonName?: string;
  contactPersonPhone?: string;
  contactPersonEmail?: string;
  vehicleCount?: number;
  operatorId?: string;
  approvedAt?: string;
  totalVehicles?: number;
  totalRoutes?: number;
  totalTrips?: number;
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

/** Route - Trajet entre deux gares */
export interface Route {
  id: string;
  name: string;
  companyId: string;
  startStationId: string;
  startStationName?: string;
  endStationId: string;
  endStationName?: string;
  distanceKm: number;
  estimatedDurationMinutes: number;
  status: 'active' | 'inactive';
  isExpress: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/** Station - Gare routière */
export interface Station {
  id: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  capacity: number;
  contactPerson?: string;
  contactPhone?: string;
  address?: string;
  status: 'active' | 'inactive';
  openingTime?: string;
  closingTime?: string;
  lastHeartbeat?: string;
  isConnected?: boolean;
  activeCashiers?: number;
  amenities?: string[];
  createdAt: string;
  updatedAt: string;
}

/** ScheduleTemplate - Modèle d'horaire récurrent */
export interface ScheduleTemplate {
  id: string;
  routeId: string;
  routeName?: string;
  dayOfWeek: number;
  departureTime: string;
  arrivalTime: string;
  driverName?: string;
  vehicleRegistration?: string;
  capacity: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

/** Trip - Instance de trajet */
export interface Trip {
  id: string;
  scheduleId?: string;
  routeId: string;
  routeName?: string;
  companyId: string;
  companyName?: string;
  stationId?: string;
  stationName?: string;
  departureTime?: string;
  arrivalTime?: string;
  driverId?: string;
  driverName?: string;
  vehicleId?: string;
  vehicleRegistration?: string;
  status: TripStatus | 'in-progress' | 'completed' | 'active';
  currentPassengers?: number;
  capacity?: number;
  departureStationId?: string;
  departureStationName?: string;
  arrivalStationId?: string;
  arrivalStationName?: string;
  price?: number;
  currency?: string;
  scheduledDeparture?: string;
  scheduledArrival?: string;
  actualDeparture?: string;
  actualArrival?: string;
  availableSeats?: number;
  totalSeats?: number;
  bookedSeats?: number;
  currentLatitude?: number;
  currentLongitude?: number;
  lastLocationUpdate?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  cancelledReason?: string;
}

/** PricingSegment - Tarification par segment */
export interface PricingSegment {
  id: string;
  routeId: string;
  routeName?: string;
  passengerType: 'adult' | 'child' | 'senior';
  basePrice: number;
  discountPercentage?: number;
  finalPrice: number;
  effectiveFrom: string;
  effectiveTo?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// BOOKING & TICKET
// ============================================

/** Booking - Réservation passager */
export interface Booking {
  id: string;
  tripId: string;
  userId: string;
  passengerName: string;
  passengerPhone: string;
  passengerEmail?: string;
  numPassengers: number;
  selectedSeats: string[];
  pricePerSeat: number;
  totalAmount: number;
  currency: string;
  paymentMethod?: PaymentMethod;
  status: BookingStatus;
  companyId?: string;
  companyName?: string;
  departureDate?: string;
  departureTime?: string;
  createdAt: string;
  updatedAt: string;
}

/** Ticket - Billet de transport */
export interface Ticket {
  id: string;
  bookingId: string;
  tripId: string;
  trip?: Trip;
  passengerId: string;
  passengerName?: string;
  seatNumber: string;
  fare: number;
  discount?: number;
  tax?: number;
  totalAmount: number;
  status: TicketStatus;
  qrCode?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  transactionId?: string;
  cashierId?: string;
  cashierName?: string;
  cashierStationId?: string;
  companyId?: string;
  companyName?: string;
  departure?: string;
  destination?: string;
  departureDate?: string;
  departureTime?: string;
  purchaseDate: string;
  boardedAt?: string;
  cancelledAt?: string;
  refundAmount?: number;
  refundedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** Cashier - Caissier en gare */
export interface Cashier {
  id: string;
  name: string;
  email: string;
  gareId: string;
  gareName?: string;
  shiftStartTime?: string;
  shiftEndTime?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

/** CashTransaction - Transaction caisse */
export interface CashTransaction {
  id: string;
  cashierId: string;
  cashierName?: string;
  gareId: string;
  gareName?: string;
  amount: number;
  type: 'sale' | 'refund' | 'adjustment' | 'opening' | 'closing';
  tripId?: string;
  ticketId?: string;
  description?: string;
  referenceNumber?: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
}

/** Manager - Gérant de gare */
export interface Manager {
  id: string;
  name: string;
  email: string;
  gareId: string;
  gareName?: string;
  phone?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// ============================================
// INCIDENTS & SUPPORT
// ============================================

/** Incident - Signalement */
export interface Incident {
  id: string;
  gareId?: string;
  gareName?: string;
  tripId?: string;
  tripRoute?: string;
  tripDepartureTime?: string;
  companyId?: string;
  companyName?: string;
  type: 'accident' | 'delay' | 'cancellation' | 'mechanical' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved';
  reporterType: 'passenger' | 'company';
  reportedBy: string;
  reportedByName?: string;
  reportedByPhone?: string;
  resolvedBy?: string;
  resolvedByName?: string;
  estimatedResolutionTime?: string;
  resolvedAt?: string;
  impactEstimate?: string;
  passengersAffected?: number;
  createdAt: string;
  updatedAt: string;
}

/** SupportReply - Message dans un fil support */
export interface SupportReply {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: 'admin' | 'user';
  message: string;
  createdAt: string;
}

/** Support - Ticket de support */
export interface Support {
  id: string;
  userId: string;
  userName?: string;
  userType: 'passenger' | 'operator';
  companyName?: string;
  subject: string;
  message: string;
  category: 'booking' | 'payment' | 'technical' | 'feedback' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'normal';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  assignedTo?: string;
  assignedToName?: string;
  replies?: SupportReply[];
  resolvedAt?: string;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// STORIES & ADVERTISING
// ============================================

/** StoryCircle - Cercle de stories */
export interface StoryCircle {
  id: string;
  name: string;
  emoji: string;
  gradient: string;
  color: string;
  isDefault: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

/** Story - Contenu type Instagram Stories */
export interface Story {
  id: string;
  title: string;
  description: string;
  mediaType: 'image' | 'video' | 'gradient';
  mediaUrl?: string;
  gradient?: string;
  emoji?: string;
  circleId: string;
  ctaText?: string;
  actionType: 'internal' | 'external' | 'none';
  actionUrl?: string;
  internalPage?: string;
  viewsCount: number;
  clicksCount: number;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  expiresAt?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

/** Review - Avis passager */
export interface Review {
  id: string;
  tripId: string;
  passengerId: string;
  passengerName?: string;
  companyId: string;
  companyName?: string;
  routeName?: string;
  tripDate?: string;
  tripTime?: string;
  rating: number;
  comment?: string;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Advertisement - Publicité */
export interface Advertisement {
  id: string;
  title: string;
  description: string;
  mediaType: 'image' | 'video' | 'gradient';
  mediaUrl?: string;
  gradient?: string;
  emoji?: string;
  ctaText: string;
  actionType: 'internal' | 'external' | 'none';
  actionUrl?: string;
  internalPage?: string;
  internalData?: Record<string, unknown>;
  targetPages: string[];
  targetNewUsers: boolean;
  priority: number;
  startDate: string;
  endDate: string;
  maxImpressions?: number;
  maxClicks?: number;
  impressions: number;
  clicks: number;
  status: 'active' | 'inactive' | 'expired';
  createdAt: string;
  updatedAt: string;
}

/** Promotion - Réduction de prix */
export interface Promotion {
  id: string;
  operatorId: string;
  operatorName?: string;
  tripId?: string;
  tripRoute?: string;
  title: string;
  description?: string;
  code?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageLimitPerUser?: number;
  usageCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  storyEnabled?: boolean;
  storyMediaType?: 'image' | 'video';
  storyMediaUrl?: string;
  storyThumbnailUrl?: string;
  storyCtaText?: string;
  storyCtaLink?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// STATISTICS
// ============================================

/** DashboardStats - Statistiques tableau de bord */
export interface DashboardStats {
  totalCompanies?: number;
  activeCompanies?: number;
  pendingCompanies?: number;
  totalRevenue: number;
  todayRevenue: number;
  activeTrips: number;
  todayTrips: number;
  totalPassengers: number;
  todayPassengers: number;
  totalBookings: number;
  todayBookings: number;
  cancelledBookings: number;
  pendingIncidents: number;
  systemHealth: number;
  platformCommission?: number;
  totalStations?: number;
  totalOperatorUsers?: number;
}

/** BookingStats */
export interface BookingStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  today: number;
  conversionRate: number;
  totalRevenue: number;
  averageBookingValue: number;
}

/** TicketStats */
export interface TicketStats {
  totalTickets: number;
  confirmedTickets: number;
  cancelledTickets: number;
  usedTickets: number;
  todayTickets: number;
  weekTickets: number;
  monthTickets: number;
  averageTicketsPerDay: number;
  peakHour?: string;
}

/** PromotionStats */
export interface PromotionStats {
  total: number;
  active: number;
  pending: number;
  expired: number;
  rejected: number;
  totalUsage: number;
  totalSavings: number;
  avgDiscountPercent: number;
}

// ============================================
// API RESPONSE TYPES
// ============================================

/** Standard API response wrapper */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    field?: string;
    details?: unknown;
  };
  timestamp?: string;
}

/** Paginated response */
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp: string;
}

// ============================================
// AUTH TYPES
// ============================================

export interface AuthCredentials {
  email: string;
  password: string;
  otp?: string;
}

export interface AuthResponse {
  user: PassengerUser | AdminUser | OperatorUser;
  token: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface RegistrationData {
  email: string;
  name: string;
  phone: string;
  password: string;
}

// ============================================
// TYPE GUARDS
// ============================================

export function isOperatorUser(user: unknown): user is OperatorUser {
  return !!user && typeof user === 'object' && 'role' in user &&
    ['responsable', 'manager', 'caissier'].includes((user as OperatorUser).role);
}

export function isPassengerUser(user: unknown): user is PassengerUser {
  return !!user && typeof user === 'object' && 'phone' in user && !('companyId' in user);
}

export function isAdminUser(user: unknown): user is AdminUser {
  return !!user && typeof user === 'object' && 'role' in user &&
    ['SUPER_ADMIN', 'OPERATOR_ADMIN', 'SUPPORT_ADMIN', 'FINANCE_ADMIN'].includes((user as AdminUser).role);
}
