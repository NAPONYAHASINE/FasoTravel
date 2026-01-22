/**
 * Types & Interfaces Centralisés - TransportBF
 * 
 * ✅ SOURCE UNIQUE DE VÉRITÉ pour Mobile et Societe
 * Tous les DTOs, Interfaces doivent être ici (PAS de duplication)
 * 
 * Organization:
 * - Types utilitaires (enums, unions)
 * - Interfaces métier (User, Trip, Ticket, etc.)
 * - Request/Response DTOs (API)
 * - Service interfaces
 */

// ============================================
// ENUMS & TYPES UTILITAIRES
// ============================================

export type TicketStatus = 'AVAILABLE' | 'HOLD' | 'PAID' | 'EMBARKED' | 'CANCELLED' | 'REFUNDED';
export type TripStatus = 'SCHEDULED' | 'BOARDING' | 'DEPARTED' | 'ARRIVED' | 'CANCELLED';
export type BookingStatus = 'HOLD' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'ORANGE_MONEY' | 'MOOV_MONEY' | 'CARTE_BANCAIRE' | 'CASH';
export type UserRole = 'PASSENGER' | 'OPERATOR' | 'ADMIN' | 'SUPPORT';
export type SeatStatus = 'available' | 'hold' | 'paid' | 'offline_reserved' | 'selected';
export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type IncidentStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

// ============================================
// USER & AUTHENTICATION
// ============================================

export interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  totalTrips: number;
  totalSpent: number;
  averageRating: number;
  emergencyContacts?: Array<{
    name: string;
    phone: string;
    relationship: string;
  }>;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthRegisterData {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

// ============================================
// STATIONS & ROUTES
// ============================================

export interface Station {
  id: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  address?: string;
  isActive: boolean;
  operatingHours?: string;
  phone?: string;
  email?: string;
  createdAt?: string;
}

export interface Route {
  id: string;
  departure: string;
  arrival: string;
  distance: number;
  duration: number; // en minutes
  basePrice: number;
  status: 'active' | 'inactive';
  description?: string;
}

// ============================================
// OPERATORS & SERVICES
// ============================================

export interface Operator {
  id: string;
  name: string;
  email: string;
  phone: string;
  logoUrl?: string;
  baseCity?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface OperatorService {
  id?: string;
  operatorId: string;
  name: string; // ex: "Baggage", "WiFi", "Food"
  description?: string;
  price: number;
  isAvailable: boolean;
  createdAt: string;
}

export interface OperatorStory {
  id: string;
  operatorId: string;
  title: string;
  description: string;
  imageUrl?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  duration?: number;
  startDate: string;
  endDate: string;
  views?: number;
  clicks?: number;
  status: 'active' | 'scheduled' | 'expired';
  createdAt: string;
}

// ============================================
// TRIPS & SEGMENTS
// ============================================

export interface Segment {
  id: string;
  fromStationId: string;
  toStationId: string;
  fromStationName: string;
  toStationName: string;
  departureTime: string;
  arrivalTime: string;
  distanceKm: number;
  availableSeats: number;
  totalSeats: number;
}

export interface Trip {
  id: string;
  operatorId: string;
  operatorName: string;
  operatorLogo?: string;
  vehicleType: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  basePrice: number;
  fromStationId: string;
  toStationId: string;
  fromStationName: string;
  toStationName: string;
  segments: Segment[];
  amenities: string[];
  hasLiveTracking: boolean;
  availableSeats: number;
  totalSeats: number;
  status: TripStatus;
  serviceClass?: 'standard' | 'vip' | 'express';
  driverId?: string;
  driverName?: string;
  createdAt: string;
}

// ============================================
// BOOKINGS & TICKETS
// ============================================

export interface Booking {
  id: string;
  userId: string;
  tripId: string;
  numSeats: number;
  status: BookingStatus;
  holdExpiresAt?: string;
  basePrice: number;
  servicesPrice: number;
  totalPrice: number;
  selectedServices?: string[]; // service IDs
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: string;
  bookingId?: string;
  tripId: string;
  userId: string;
  passengerName: string;
  passengerPhone: string;
  seatNumber: string;
  price: number;
  paymentMethod: PaymentMethod;
  status: TicketStatus;
  qrCode?: string;
  embarkationTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketTransfer {
  id: string;
  ticketId: string;
  fromUserId: string;
  toUserId: string;
  toPhone: string;
  toEmail?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  expiresAt: string;
  createdAt: string;
}

// ============================================
// PAYMENTS
// ============================================

export interface Payment {
  id: string;
  bookingId: string;
  userId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  externalReference?: string;
  failureReason?: string;
  createdAt: string;
  completedAt?: string;
}

export interface PaymentMethodInfo {
  id: string;
  name: string;
  type: 'mobile_money' | 'card' | 'bank_transfer';
  provider: string;
  logo?: string;
  enabled: boolean;
  minAmount?: number;
  maxAmount?: number;
  feesPercentage?: number;
}

// ============================================
// REVIEWS & RATINGS
// ============================================

export interface Review {
  id: string;
  tripId: string;
  operatorId: string;
  userId: string;
  rating: number; // 1-5
  comment: string;
  status: ReviewStatus;
  createdAt: string;
  updatedAt?: string;
}

// ============================================
// INCIDENTS & SUPPORT
// ============================================

export interface Incident {
  id: string;
  tripId: string;
  userId: string;
  type: 'delay' | 'accident' | 'missing_passenger' | 'vehicle_issue' | 'other';
  description: string;
  status: IncidentStatus;
  attachments?: string[]; // photo URLs
  createdAt: string;
  resolvedAt?: string;
}

export interface SupportMessage {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  attachments?: string[];
  response?: string;
  createdAt: string;
  respondedAt?: string;
}

// ============================================
// VEHICLE TRACKING
// ============================================

export interface VehicleLocation {
  tripId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  timestamp: string;
  updatedAt: string;
}

// ============================================
// STORIES & ADS
// ============================================

export interface Story {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  emoji?: string;
  gradient: string;
  category: 'PROMO' | 'NEW' | 'DESTINATION' | 'TIPS' | 'PARTNERS' | 'ANNOUNCEMENT' | 'ACTUALITE' | 'ALERTE' | 'EVENT';
  linkUrl?: string;
  isActive: boolean;
  priority: number;
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
}

export interface Advertisement {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  placement: 'SEARCH_RESULTS' | 'TICKET_LIST' | 'OPERATOR_PROFILE' | 'HOME_FEED';
  clickUrl?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  impressions: number;
  clicks: number;
  conversions: number;
  createdAt: string;
}

// ============================================
// REQUEST/RESPONSE DTOs
// ============================================

export interface TripSearchParams {
  fromStationId: string;
  toStationId: string;
  departureDate: string;
  numPassengers: number;
  returnDate?: string;
}

export interface NearbyStationsParams {
  latitude: number;
  longitude: number;
  radiusKm?: number;
}

export interface CreateHoldBookingParams {
  tripId: string;
  numSeats: number;
  selectedServices?: string[];
}

export interface ConfirmBookingParams {
  bookingId: string;
  paymentMethod: PaymentMethod;
  paymentData?: Record<string, any>; // pour fournisseur spécifique
}

export interface TransferTicketParams {
  ticketId: string;
  toPhone: string;
  toEmail?: string;
}

export interface CreateIncidentParams {
  tripId: string;
  type: string;
  description: string;
  attachments?: string[];
}

export interface LocationShareParams {
  tripId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
}

// ============================================
// VALIDATION UTILITIES
// ============================================

/**
 * Calcule les places disponibles réelles pour un trajet
 * selon la règle: min des places de tous les segments
 */
export function getAvailableSeatsForTrip(trip: { segments: { availableSeats: number }[] }): number {
  if (!trip.segments || trip.segments.length === 0) return 0;
  return Math.min(...trip.segments.map(s => s.availableSeats));
}

/**
 * Valide la cohérence capacité d'un trajet
 */
export function validateTripCapacity(trip: Trip): boolean {
  const calculatedMin = getAvailableSeatsForTrip(trip);
  if (calculatedMin !== trip.availableSeats) {
    console.error(
      `❌ TRIP CAPACITY MISMATCH: ${trip.id}\n` +
      `   Declared: ${trip.availableSeats}, Actual (min): ${calculatedMin}`
    );
    return false;
  }
  return true;
}
