/**
 * @file standardized.ts
 * @description All standardized entities for FasoTravel ecosystem
 * 
 * CRITICAL: These types are the SINGLE SOURCE OF TRUTH
 * Used by Mobile, Societe, and Admin apps
 * NEVER duplicate these types - always import from here
 */

// ============= REFERRAL / PARRAINAGE TYPES =============

export type ReferralBadgeLevel = 'standard' | 'ambassadeur' | 'super_ambassadeur' | 'legende';

export interface Referral {
  id: string;
  referrerUserId: string;
  referrerName: string;
  referrerCode: string;
  referredUserId: string;
  referredName: string;
  pointsAwarded: number;
  status: 'validated';
  validatedAt: string;
  createdAt: string;
}

export interface ReferralCoupon {
  id: string;
  userId: string;
  userName: string;
  code: string;
  amount: number;
  pointsCost: number;
  status: 'active' | 'used' | 'expired' | 'cancelled';
  createdAt: string;
  expiresAt: string;
  usedAt?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancelReason?: string;
}

export interface ReferralConfig {
  enabled: boolean;
  pointsPerReferral: number;
  disabledReason?: string;
  updatedAt: string;
  updatedBy: string;
}

export interface ReferralStats {
  totalReferrals: number;
  totalPointsDistributed: number;
  totalCouponsGenerated: number;
  totalCouponsUsed: number;
  totalCouponsCost: number;
  activeReferrers: number;
  config: ReferralConfig;
  badgeDistribution: Record<ReferralBadgeLevel, number>;
  topReferrers: { userId: string; name: string; referrals: number; badge: ReferralBadgeLevel }[];
}

export const REFERRAL_BADGE_THRESHOLDS: Record<ReferralBadgeLevel, number> = {
  standard: 0,
  ambassadeur: 100,
  super_ambassadeur: 250,
  legende: 500,
};

export const POINTS_PER_REFERRAL = 10;

// ============= USER TYPES =============

/**
 * PassengerUser - Users of the Mobile app
 * Can search trips, book tickets, track trips
 */
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
  // Referral / Parrainage
  referralCode?: string;
  referredBy?: string;
  referralPointsBalance?: number;
  totalReferrals?: number;
  badgeLevel?: ReferralBadgeLevel;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  createdAt: string;
  updatedAt: string;
}

/**
 * AdminUser - Users of the Admin app (FasoTravel platform administrators)
 * Supervise the entire ecosystem: all transport companies, passengers, and infrastructure
 */
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'OPERATOR_ADMIN' | 'SUPPORT_ADMIN' | 'FINANCE_ADMIN';  // Updated roles
  permissions?: string[];  // Legacy - now calculated from role
  operatorId?: string;  // For OPERATOR_ADMIN - limited to their operator
  status: 'active' | 'inactive' | 'suspended';
  fullName?: string;
  mfaEnabled?: boolean;  // Multi-factor authentication
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * OperatorUser - Users of the Societe app
 * Employees of a specific transport company
 * Three roles: responsable (CEO), manager (Station Manager), caissier (Cashier)
 */
export interface OperatorUser {
  id: string;
  email: string;
  name: string;
  role: 'responsable' | 'manager' | 'caissier';
  companyId: string;  // FIXED: was 'societyId', now 'companyId' for consistency
  companyName: string;
  
  // For manager and caissier only
  stationId?: string;
  stationName?: string;
  
  // Legacy aliases (used by societe app)
  gareId?: string;
  gareName?: string;
  
  // For caissier only
  shiftStartTime?: string;
  shiftEndTime?: string;
  
  status: 'active' | 'inactive' | 'suspended';
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============= TRANSPORT ENTITIES =============

/**
 * TransportCompany - A transport company/society
 * Managed by Admin, operated via Societe app
 * Each company manages their own fleet, routes, and staff
 */
export interface TransportCompany {
  id: string;
  name: string;
  legalName?: string;
  logo?: string;
  email: string;
  phone: string;
  
  // Business info
  registrationNumber?: string;
  taxId?: string;
  address?: string;
  
  // Platform settings
  commission: number; // % commission taken by FasoTravel
  status: 'active' | 'suspended' | 'pending';
  
  // Additional services offered by the company
  amenities?: string[]; // e.g., ['wifi', 'coffee', 'ac', 'toilet', 'usb', 'tv', 'luggage']
  luggagePrice?: number; // Price per extra luggage in FCFA (only relevant if amenities includes 'luggage')
  
  // Contact person
  contactPersonName?: string;
  contactPersonWhatsapp?: string;
  contactPersonEmail?: string;
  
  vehicleCount?: number;
  operatorId?: string;
  approvedAt?: string;
  
  // Stats (read-only, calculated)
  totalVehicles?: number;
  totalRoutes?: number;
  totalTrips?: number;
  rating?: number;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Route - Bus route between two stations
 */
export interface Route {
  id: string;
  name: string;
  companyId: string; // FIXED: was 'societyId', now 'companyId'
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

/**
 * Station - Bus terminal/station
 * Managed by Admin (global infrastructure)
 * Used by all transport companies
 */
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
  
  // ⚡ CONNEXION AUTOMATIQUE - Heartbeat des CAISSIERS de l'App Société
  // ARCHITECTURE: L'App Société a 3 modules (Responsable, Manager, Caissier)
  // SEULS les CAISSIERS envoient un heartbeat (ils sont à la caisse physique)
  // Si AU MOINS UN caissier est connecté → isConnected = true
  lastHeartbeat?: string; // Dernier ping reçu d'un caissier (ISO timestamp)
  isConnected?: boolean; // Calculé: true si AU MOINS UN caissier connecté (heartbeat < 30s)
  activeCashiers?: number; // Nombre de caissiers actuellement connectés à cette gare
  
  // Admin can assign amenities
  amenities?: string[]; // e.g., ['wifi', 'parking', 'restrooms', 'cafeteria']
  
  createdAt: string;
  updatedAt: string;
}

/**
 * ScheduleTemplate - Recurring schedule template
 * Defines regular departures (e.g., every Monday at 14:00)
 */
export interface ScheduleTemplate {
  id: string;
  routeId: string;
  routeName?: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  departureTime: string; // HH:MM format
  arrivalTime: string; // HH:MM format
  driverName?: string;
  vehicleRegistration?: string;
  capacity: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

/**
 * Trip - Actual trip instance (scheduled from a template)
 */
export interface Trip {
  id: string;
  scheduleId?: string;
  routeId: string;
  routeName?: string;
  companyId: string; // Company operating this trip
  companyName?: string;
  stationId?: string; // FIXED: was 'gareId', now 'stationId'
  stationName?: string; // FIXED: was 'gareName'
  departureTime?: string; // ISO datetime
  arrivalTime?: string; // ISO datetime
  driverId?: string;
  driverName?: string;
  vehicleId?: string; // Vehicle from company's fleet
  vehicleRegistration?: string;
  status: 'scheduled' | 'boarding' | 'departed' | 'arrived' | 'in-progress' | 'completed' | 'cancelled' | 'active';
  currentPassengers?: number;
  capacity?: number;
  
  // Optional extended fields
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
  
  // Real-time tracking
  currentLatitude?: number;
  currentLongitude?: number;
  lastLocationUpdate?: string;
  
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  cancelledReason?: string;
}

/**
 * PricingSegment - Price rules for routes
 */
export interface PricingSegment {
  id: string;
  routeId: string;
  routeName?: string;
  passengerType: 'adult' | 'child' | 'senior';
  basePrice: number;
  discountPercentage?: number;
  finalPrice: number;
  effectiveFrom: string; // Date
  effectiveTo?: string; // Date
  createdAt: string;
  updatedAt: string;
}

// ============= BOOKING ENTITIES =============

/**
 * Booking - Réservation passager (DIFFÉRENT d'un billet !)
 * 
 * STATUTS DES RÉSERVATIONS :
 * - EN_ATTENTE: Réservation créée, en attente de paiement
 * - CONFIRMÉ: Paiement reçu → génère un billet ACTIF
 * - TERMINÉ: Voyage terminé
 * - ANNULÉ: Réservation annulée
 * 
 * RELATION AVEC LES BILLETS :
 * - Une réservation CONFIRMÉE génère un billet ACTIF
 * - Réservation EN_ATTENTE → pas de billet encore
 * - Réservation ANNULÉE → billet ANNULÉ (si existant)
 */
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Booking {
  booking_id: string;
  passenger_name: string;
  passenger_email: string;
  passenger_phone: string;
  user_id: string;
  trip_id?: string;
  trip_route: string;
  company_id?: string;
  company_name: string;
  num_passengers: number;
  selected_seats: string[];
  price_per_seat: number;
  total_amount: number;
  currency: string;
  status: BookingStatus;
  created_at: string;
  updated_at?: string;
  departure_date?: string;
  departure_time?: string;
}

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

/**
 * Ticket - Billet de transport (GÉNÉRÉ quand une réservation est CONFIRMÉE)
 * 
 * STATUTS DES BILLETS (différents des réservations !) :
 * - ACTIF: Billet valide, date de départ pas encore passée
 * - EMBARQUÉ: Passager actuellement dans le car (voyage en cours)
 * - EXPIRÉ: Date de départ passée (trajet terminé ou passager absent)
 * - ANNULÉ: Billet annulé manuellement
 * 
 * RELATION AVEC LES RÉSERVATIONS :
 * - Une réservation CONFIRMÉE génère un billet ACTIF
 * - Réservation EN_ATTENTE → pas de billet encore
 * - Réservation ANNULÉE → billet ANNULÉ (si existant)
 */
export interface Ticket {
  id: string;
  bookingId: string; // Lien vers la réservation d'origine
  tripId: string;
  trip?: Trip; // Populated when needed
  passengerId: string;
  passengerName?: string;
  seatNumber: string;
  
  // Pricing
  fare: number;
  discount?: number;
  tax?: number;
  totalAmount: number;
  
  // Status - BILLETS uniquement (≠ réservations)
  status: 'active' | 'boarded' | 'expired' | 'cancelled' | 'refunded';
  
  qrCode?: string;
  
  // Payment info
  paymentMethod?: 'cash' | 'orange_money' | 'moov_money' | 'wave' | 'card';
  paymentStatus?: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  
  // Cashier info (if sold at station)
  cashierId?: string;
  cashierName?: string;
  cashierStationId?: string;
  
  // Company info
  companyId?: string;
  companyName?: string;
  
  // Route info
  departure?: string;
  destination?: string;
  departureDate?: string;
  departureTime?: string;
  
  // Timestamps
  purchaseDate: string;
  boardedAt?: string; // Quand le passager est monté
  cancelledAt?: string;
  refundAmount?: number;
  refundedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Cashier - Station cashier (staff member)
 */
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

/**
 * CashTransaction - Cash drawer transaction
 */
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

// ============= MANAGEMENT ENTITIES =============

/**
 * Incident - System incident/issue
 * Signalé par un passager ou une société de transport, toujours lié à un trajet
 */
export interface Incident {
  id: string;
  gareId?: string;
  gareName?: string;
  
  // Trajet lié (obligatoire en pratique)
  tripId?: string;
  tripRoute?: string;           // ex: "Ouagadougou → Bobo-Dioulasso"
  tripDepartureTime?: string;   // ISO datetime du départ
  
  // Société de transport concernée
  companyId?: string;
  companyName?: string;
  
  type: 'accident' | 'delay' | 'cancellation' | 'mechanical' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  title: string;
  description: string;
  
  status: 'open' | 'in-progress' | 'resolved';
  
  // Qui a signalé
  reporterType: 'passenger' | 'company';  // Source du signalement
  reportedBy: string;
  reportedByName?: string;
  reportedByPhone?: string;
  
  // Résolution
  resolvedBy?: string;
  resolvedByName?: string;
  
  estimatedResolutionTime?: string;
  resolvedAt?: string;
  
  impactEstimate?: string;
  passengersAffected?: number;
  
  createdAt: string;
  updatedAt: string;
}

/**
 * StoryCircle - Cercle de stories dans l'app mobile
 * 
 * Chaque cercle regroupe des stories par thématique.
 * 4 cercles par défaut + cercles custom créés par l'admin.
 */
export interface StoryCircle {
  id: string;
  name: string;          // "Promotions", "Nouveautés", custom...
  emoji: string;         // Emoji représentatif du cercle
  gradient: string;      // Gradient CSS pour le ring du cercle
  color: string;         // Couleur Tailwind principale (ex: "red", "blue")
  isDefault: boolean;    // true = cercle système, false = créé par admin
  order: number;         // Ordre d'affichage (1, 2, 3...)
  createdAt: string;
  updatedAt: string;
}

/**
 * Story - Contenus circulaires dans l'app mobile (type Instagram Stories)
 * 
 * Chaque story appartient à un cercle (circleId → StoryCircle).
 * Les cercles sont dynamiques — l'admin peut en créer de nouveaux.
 * Les stories peuvent contenir image, vidéo ou texte sur gradient.
 * 
 * MÉDIA: Upload fichier depuis l'appareil (pas d'URL manuelle).
 * En mode mock, stocké en base64/objectURL. En prod, upload S3/CDN.
 */
export interface Story {
  id: string;

  // Contenu
  title: string;
  description: string;

  // Média
  mediaType: 'image' | 'video' | 'gradient';
  mediaUrl?: string;       // URL du fichier uploadé (base64 en mock, CDN en prod)
  gradient?: string;       // CSS gradient string
  emoji?: string;          // Emoji affiché sur le gradient

  // Cercle = type de story (dynamique, référence StoryCircle.id)
  circleId: string;

  // Call-to-Action (optionnel pour stories)
  ctaText?: string;
  actionType: 'internal' | 'external' | 'none';
  actionUrl?: string;
  internalPage?: string;

  // Tracking
  viewsCount: number;
  clicksCount: number;     // Clics sur le CTA

  // Statut & planification
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  expiresAt?: string;       // Auto-archivage après cette date

  // Métadonnées
  createdBy: string;
  createdByName?: string;

  createdAt: string;
  updatedAt: string;
}

/**
 * Review - Avis passager après voyage terminé
 * 
 * Un passager ne peut émettre un avis qu'APRÈS avoir terminé son voyage.
 * L'avis porte sur la SOCIÉTÉ DE TRANSPORT utilisée (pas la plateforme).
 * Pas de workflow d'approbation/modération — données collectées telles quelles.
 */
export interface Review {
  id: string;
  tripId: string;
  passengerId: string;
  passengerName?: string;
  
  // Société notée (dérivée du voyage)
  companyId: string;
  companyName?: string;
  
  // Contexte du voyage (traçabilité)
  routeName?: string; // ex: "Ouagadougou → Bobo-Dioulasso"
  tripDate?: string; // Date du voyage effectué
  tripTime?: string; // Heure du voyage ex: "08:00"
  
  rating: number; // 1-5 (note unique, pas de notation détaillée)
  comment?: string;
  
  helpfulCount: number;
  
  createdAt: string;
  updatedAt: string;
}

/**
 * Manager - Station manager
 */
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

/**
 * AuditLog - System audit trail
 */
export interface AuditLog {
  id: string;
  userId: string;
  userName?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  
  /** Human-readable description of the action */
  details?: string;
  
  /** Severity level for filtering/display */
  severity?: 'info' | 'warning' | 'critical';
  
  /** Category for grouping */
  category?: string;
  
  changes?: Record<string, {
    oldValue: any;
    newValue: any;
  }>;
  
  ipAddress?: string;
  userAgent?: string;
  
  /** Geographic location derived from IP */
  geoLocation?: string;
  
  /** Session ID for correlating actions */
  sessionId?: string;
  
  /** Action duration in milliseconds */
  durationMs?: number;
  
  /** Extra metadata */
  metadata?: Record<string, any>;
  
  status?: string;
  
  createdAt: string;
}

/**
 * SupportReply - Message dans un fil de discussion support
 */
export interface SupportReply {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: 'admin' | 'user';
  message: string;
  createdAt: string;
}

/**
 * Support - Customer support ticket
 */
export interface Support {
  id: string;
  userId: string;
  userName?: string;
  userType: 'passenger' | 'operator';
  companyName?: string; // Nom de la société (pour les opérateurs uniquement)
  
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

// ============= STATISTICS & ANALYTICS =============

/**
 * DashboardStats - Dashboard summary statistics
 * ADMIN version includes multi-company aggregated stats
 */
export interface DashboardStats {
  // Platform-wide (for Admin)
  totalCompanies?: number;
  activeCompanies?: number;
  pendingCompanies?: number;
  
  // Aggregated stats
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
  systemHealth: number; // 0-100
  
  // Admin-specific
  platformCommission?: number; // Total commission earned
  totalStations?: number;
  totalOperatorUsers?: number;
}

/**
 * RevenueByPeriod - Revenue analytics
 */
export interface RevenueByPeriod {
  period: string; // Date or month
  revenue: number;
  ticketCount: number;
  passengerCount: number;
}

/**
 * TripAnalytics - Trip performance analytics
 */
export interface TripAnalytics {
  routeId: string;
  routeName: string;
  totalTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  averageOccupancy: number; // Percentage
  totalRevenue: number;
  averageRating?: number;
}

// ============= API RESPONSE TYPES =============

/**
 * Standard API success response
 */
export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    field?: string;
    details?: any;
  };
  timestamp: string;
}

/**
 * Paginated response
 */
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

// ============= FORM DATA TYPES =============

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
  otp?: string; // For operator 2FA
}

/**
 * Registration data
 */
export interface RegistrationData {
  email: string;
  name: string;
  phone: string;
  password: string;
}

/**
 * Trip search filters
 */
export interface TripSearchFilters {
  from?: string; // Station ID or name
  to?: string; // Station ID or name
  date?: string; // ISO date
  passengers?: number;
  status?: Trip['status'];
  minPrice?: number;
  maxPrice?: number;
}

/**
 * Booking creation data
 */
export interface BookingCreateData {
  tripId: string;
  seats: string[];
  passengerInfo: {
    name: string;
    phone: string;
    email: string;
  };
  paymentMethod?: 'cash' | 'orange_money' | 'moov_money' | 'wave' | 'card';
}

/**
 * Check if user is OperatorUser
 */
export function isOperatorUser(user: any): user is OperatorUser {
  return user && 'role' in user && ['responsable', 'manager', 'caissier'].includes(user.role);
}

/**
 * Check if user is PassengerUser
 */
export function isPassengerUser(user: any): user is PassengerUser {
  return user && 'phone' in user && !('role' in user);
}

/**
 * Check if response is error
 */
export function isApiError(response: any): response is ApiErrorResponse {
  return response && response.success === false;
}

/**
 * Check if response is paginated
 */
export function isPaginatedResponse<T>(response: any): response is PaginatedResponse<T> {
  return response && response.success && 'pagination' in response;
}

// ============= ADMIN-SPECIFIC TYPES =============

/**
 * Notification - System notifications for Admin
 */
export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  read: boolean;
  entityType?: 'company' | 'passenger' | 'trip' | 'payment' | 'incident';
  entityId?: string;
  actionUrl?: string;
  createdAt: string;
  readAt?: string;
}

/**
 * Payment - Platform-wide payment tracking
 */
export interface Payment {
  id: string;
  bookingId: string;
  userId: string;
  userName?: string;
  companyId: string;
  companyName?: string;
  
  amount: number;
  currency: string;
  method: 'cash' | 'orange_money' | 'moov_money' | 'wave' | 'card';
  
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  
  platformFee?: number; // Commission FasoTravel
  companyAmount?: number; // Montant pour la société
  
  transactionId?: string;
  paymentGateway?: string;
  
  processedAt?: string;
  refundedAt?: string;
  refundReason?: string;
  
  createdAt: string;
  updatedAt: string;
}

/**
 * RevenueStats - Platform revenue statistics
 */
export interface RevenueStats {
  totalRevenue: number;
  platformCommission: number;
  companyRevenue: number;
  
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  refundedPayments: number;
  
  averageTicketPrice: number;
  topCompanyId?: string;
  topCompanyRevenue?: number;
}

/**
 * Integration - Third-party service integrations
 */
export interface Integration {
  id: string;
  name: string;
  type: 'payment' | 'sms' | 'email' | 'analytics' | 'mapping' | 'storage';
  provider: string;
  
  status: 'active' | 'inactive' | 'error';
  
  apiKey?: string;
  apiSecret?: string;
  webhookUrl?: string;
  
  config?: Record<string, any>;
  
  /** Usage statistics for monitoring */
  usageStats?: IntegrationUsageStats;
  
  /** Documentation URL */
  docsUrl?: string;
  
  /** Dashboard URL (external) */
  dashboardUrl?: string;
  
  /** Billing model for this integration */
  billingType: 'free' | 'subscription' | 'usage' | 'client_charged';
  
  /** Monthly cost in FCFA — only for 'subscription' billing type */
  monthlyCostFcfa?: number;
  
  /** Billing details description (e.g. "1% Mobile Money, 3.5% Carte") */
  billingDetails?: string;
  
  lastSyncAt?: string;
  errorMessage?: string;
  
  createdAt: string;
  updatedAt: string;
}

/**
 * IntegrationUsageStats - Usage metrics per integration
 */
export interface IntegrationUsageStats {
  /** API calls this month */
  apiCallsThisMonth: number;
  /** API calls limit (0 = unlimited) */
  apiCallsLimit: number;
  /** Success rate percentage */
  successRate: number;
  /** Average latency in ms */
  avgLatencyMs: number;
  /** Uptime percentage (last 30 days) */
  uptimePercent: number;
  /** Last health check */
  lastHealthCheck: string;
  /** Extra metrics specific to the integration type */
  extras?: Record<string, any>;
}

/**
 * IntegrationAlert - Alertes configurables par integration
 */
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertRuleType = 'quota_exceeded' | 'high_latency' | 'downtime' | 'error_rate' | 'cost_spike' | 'storage_full' | 'cpu_high' | 'memory_high';

export interface IntegrationAlertRule {
  id: string;
  integrationId: string;
  type: AlertRuleType;
  label: string;
  /** Threshold that triggers the alert */
  threshold: number;
  /** Current value (computed from usageStats) */
  currentValue: number;
  /** Unit for display (%, ms, Go, FCFA) */
  unit: string;
  severity: AlertSeverity;
  enabled: boolean;
  /** Notify channels */
  notifyEmail: boolean;
  notifySms: boolean;
  createdAt: string;
}

export interface IntegrationAlert {
  id: string;
  ruleId: string;
  integrationId: string;
  integrationName: string;
  type: AlertRuleType;
  severity: AlertSeverity;
  message: string;
  currentValue: number;
  threshold: number;
  unit: string;
  acknowledged: boolean;
  triggeredAt: string;
  acknowledgedAt?: string;
}

/**
 * WhatsAppMessageResult - Resultat d'envoi message WhatsApp Business test
 */
export interface WhatsAppMessageResult {
  success: boolean;
  messageId?: string;
  to: string;
  status: string;
  deliveryTime?: number;
  errorMessage?: string;
}
/** @deprecated Use WhatsAppMessageResult */
export type InfobipSmsResult = WhatsAppMessageResult;

/**
 * WhatsAppAccountInfo - Infos compte WhatsApp Business
 */
export interface WhatsAppAccountInfo {
  balance: number;
  currency: string;
  messagesSentToday: number;
  messagesSentThisMonth: number;
  deliveryRate: number;
  avgDeliveryTimeSec: number;
  templates: { id: string; name: string; type: string; enabled: boolean }[];
  supportedNetworks: string[];
}
/** @deprecated Use WhatsAppAccountInfo */
export type InfobipAccountInfo = WhatsAppAccountInfo;

/**
 * AwsHealthReport - Rapport sante complet AWS
 */
export interface AwsHealthReport {
  s3: {
    status: 'healthy' | 'degraded' | 'down';
    bucketName: string;
    region: string;
    storageUsedGb: number;
    storageLimitGb: number;
    objectsCount: number;
    bandwidthUsedGb: number;
    latencyMs: number;
  };
  cloudfront: {
    status: 'healthy' | 'degraded' | 'down';
    distributionId: string;
    domain: string;
    cacheHitRate: number;
    requestsThisMonth: number;
    bandwidthGb: number;
    latencyMs: number;
  };
  lightsail: {
    status: 'running' | 'stopped' | 'error';
    instanceName: string;
    region: string;
    cpuPercent: number;
    memoryPercent: number;
    diskPercent: number;
    uptimeHours: number;
    publicIp: string;
  };
}

/**
 * FeatureFlag - Platform feature toggles
 */
export interface FeatureFlag {
  id: string;
  name: string;
  key: string;
  description: string;
  
  enabled: boolean;
  
  rolloutPercentage?: number; // 0-100
  targetCompanies?: string[];
  
  createdAt: string;
  updatedAt: string;
  enabledAt?: string;
}

/**
 * Advertisement - Platform advertisements
 * 
 * Aligné sur le modèle Mobile (config.ts endpoints /api/admin/ads)
 * 
 * MEDIA:
 * - image: URL d'image (mediaUrl requis)
 * - video: URL de vidéo (mediaUrl requis)
 * - gradient: Gradient CSS + emoji optionnel
 * 
 * ACTION:
 * - internal: Navigation vers une page de l'app mobile (internalPage)
 * - external: Ouverture d'un lien externe (actionUrl)
 * - none: Pas d'action au clic
 * 
 * CIBLAGE:
 * - targetPages[]: Pages où la pub s'affiche (home, search-results, tickets, operators, nearby)
 * - targetNewUsers: Si true, visible uniquement par les nouveaux utilisateurs
 * - priority: 1-10, détermine l'ordre d'affichage (10 = priorité max)
 */
export interface Advertisement {
  id: string;

  // Contenu
  title: string;
  description: string;

  // Média
  mediaType: 'image' | 'video' | 'gradient';
  mediaUrl?: string;       // URL si image/vidéo
  gradient?: string;       // Ex: "linear-gradient(135deg, #EF2B2D 0%, #FCD116 50%, #009E49 100%)"
  emoji?: string;          // Emoji affiché sur le gradient

  // Call-to-Action
  ctaText: string;         // Texte du bouton ("Voir les offres")
  actionType: 'internal' | 'external' | 'none';
  actionUrl?: string;      // Si external
  internalPage?: string;   // Si internal: 'home'|'search-results'|'tickets'|'operators'|'nearby'|'profile'
  internalData?: Record<string, any>; // Données à passer à la page

  // Ciblage
  targetPages: string[];   // Multi-select: home, search-results, tickets, operators, nearby
  targetNewUsers: boolean;
  priority: number;        // 1-10

  // Planification
  startDate: string;
  endDate: string;
  maxImpressions?: number;
  maxClicks?: number;

  // Performance (tracking)
  impressions: number;
  clicks: number;

  // Statut (enrichi côté admin — 'expired' calculé si endDate < now)
  status: 'active' | 'inactive' | 'expired';

  // Métadonnées
  createdAt: string;
  updatedAt: string;
}

/**
 * Promotion - Réduction de prix sur les trajets
 * 
 * FLUX COMPLET:
 * 1. L'opérateur (Societe app) crée une promotion sur ses trajets
 * 2. L'admin (Admin app) voit toutes les promos, peut approuver/rejeter
 * 3. Le mobile affiche les prix réduits dans les résultats de recherche
 * 
 * CIBLAGE:
 * - tripId = null → s'applique à TOUS les trajets de l'opérateur
 * - tripId = "TRIP_123" → s'applique uniquement à ce trajet
 * 
 * TYPES DE RÉDUCTION:
 * - percentage: -20% sur le prix de base
 * - fixed: -5000 FCFA sur le prix de base
 */
export interface Promotion {
  id: string;
  
  // Opérateur qui a créé la promotion
  operatorId: string;
  operatorName?: string;
  
  // Ciblage trajet (null = tous les trajets de l'opérateur)
  tripId?: string;
  tripRoute?: string; // Display: "Ouagadougou → Bobo-Dioulasso"
  
  // Détails de la promotion
  title: string;
  description?: string;
  code?: string; // DEPRECATED: Conservé pour rétro-compatibilité backend — les promos sont automatiques, pas de code promo
  
  // Réduction
  discountType: 'percentage' | 'fixed';
  discountValue: number; // 25 pour 25%, ou 5000 pour 5000 FCFA
  
  // Limites
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number; // null = illimité (global)
  usageLimitPerUser?: number; // null = illimité (par utilisateur individuel)
  usageCount: number;
  
  // Dates de validité
  startDate: string;
  endDate: string;
  
  // Statut
  isActive: boolean;
  
  // Workflow d'approbation admin
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  
  // Story associée (contenu visuel pour l'app mobile)
  // Quand storyEnabled=true, une story est créée/affichée dans le carousel mobile
  storyEnabled?: boolean;
  storyMediaType?: 'image' | 'video';
  storyMediaUrl?: string;       // URL de l'image ou vidéo (stockée CDN en production)
  storyThumbnailUrl?: string;   // Thumbnail pour les vidéos
  storyCtaText?: string;        // Texte du bouton CTA (ex: "Réserver maintenant")
  storyCtaLink?: string;        // Deep link mobile auto-généré (ex: "fasotravel://tickets?routes=...&discount=25%")
  
  // Métadonnées
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * PromotionStats - Statistiques agrégées pour le dashboard admin
 */
export interface PromotionStats {
  total: number;
  active: number;
  pending: number;
  expired: number;
  rejected: number;
  totalUsage: number;
  totalSavings: number; // Économies générées en FCFA
  avgDiscountPercent: number;
}

/**
 * UserSession - User session tracking
 */
export interface UserSession {
  id: string;
  userId: string;
  userName?: string;
  userType: 'admin' | 'operator' | 'passenger';
  
  deviceType: 'web' | 'mobile' | 'tablet';
  deviceInfo?: string;
  
  ipAddress?: string;
  location?: string;
  
  loginAt: string;
  logoutAt?: string;
  lastActivityAt: string;
  
  active: boolean;
}

/**
 * OperatorPolicy - Company policies set by Admin or by companies themselves
 * 
 * SOURCE: 
 * - 'platform' = émise par FasoTravel (s'applique à toutes les sociétés)
 * - 'company' = émise par la société de transport elle-même
 */
export interface OperatorPolicy {
  id: string;
  companyId?: string; // Optional - platform-wide or company-specific
  companyName?: string;
  
  type: 'cancellation' | 'refund' | 'booking' | 'pricing' | 'transfer' | 'baggage' | 'delay' | 'general';
  title: string;
  description: string;
  
  rules: Record<string, any>;
  
  source: 'platform' | 'company'; // Qui a émis cette politique
  
  status: 'active' | 'inactive';
  complianceStatus?: 'compliant' | 'review_needed' | 'non_compliant'; // Admin review
  complianceNote?: string;
  
  effectiveFrom: string;
  effectiveUntil?: string;
  
  createdBy?: string;
  createdByName?: string;
  
  createdAt: string;
  updatedAt: string;
}

/**
 * PlatformPolicy - Pages légales FasoTravel (CGU, Confidentialité)
 * 
 * Gérées exclusivement par les admins FasoTravel.
 * Affichées dans l'app mobile et sur le site web.
 * Versionnées pour traçabilité juridique.
 */
export interface PlatformPolicy {
  id: string;
  type: 'privacy' | 'terms' | 'platform_rule';
  title: string;
  content: string; // Contenu texte (peut contenir du markdown)
  summary: string; // Résumé court pour aperçu
  version: string; // ex: "1.0", "1.1", "2.0"
  
  status: 'draft' | 'published' | 'archived';
  
  scope: 'global' | 'company_addon'; // global = page légale, company_addon = ajouté aux pages sociétés
  
  publishedAt?: string;
  lastPublishedVersion?: string;
  
  createdBy: string;
  createdByName?: string;
  
  createdAt: string;
  updatedAt: string;
}

/**
 * OperatorService - Additional services offered
 */
export interface OperatorService {
  id: string;
  companyId: string;
  companyName?: string;
  
  type: 'luggage' | 'food' | 'wifi' | 'insurance' | 'priority';
  name: string;
  description?: string;
  
  price: number;
  currency: string;
  
  status: 'active' | 'inactive';
  
  createdAt: string;
  updatedAt: string;
}

/**
 * TicketStats - Ticket statistics
 */
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

/**
 * UserStats - User statistics
 */
export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  suspendedUsers: number;
  
  todayRegistrations: number;
  weekRegistrations: number;
  monthRegistrations: number;
  
  verifiedUsers: number;
  unverifiedUsers: number;
}

// ============= NOTIFICATION CENTER TYPES =============

/**
 * AutomationRule - Règles d'automatisation de notifications
 * Déclenchées automatiquement par des événements système
 */
export type AutomationCategory = 'onboarding' | 'transactional' | 'reminder' | 'alert' | 'engagement';

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  triggerEvent: string;
  triggerLabel: string;
  template: { title: string; message: string };
  channels: string[];
  isActive: boolean;
  sentCount: number;
  lastTriggered?: string;
  category: AutomationCategory;
}

/**
 * SentCampaign - Historique des campagnes envoyées (auto + manuelles)
 */
export interface SentCampaign {
  id: string;
  title: string;
  message: string;
  source: 'auto' | 'manual';
  /** For auto: automation rule name. For manual: 'Campagne admin' */
  sourceName: string;
  /** Automation category (only for auto) */
  category?: AutomationCategory;
  audience: string;
  audienceCount: number;
  channels: string[];
  sentAt: string;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  status: 'delivered' | 'partial' | 'failed' | 'scheduled';
}

/**
 * NotifTemplate - Templates réutilisables pour campagnes manuelles
 */
export interface NotifTemplate {
  id: string;
  name: string;
  title: string;
  message: string;
  category: string;
  usageCount: number;
  lastUsed?: string;
}

/**
 * ScheduledNotification - Campagnes programmées pour envoi futur
 */
export interface ScheduledNotification {
  id: string;
  title: string;
  message: string;
  scheduledAt: string;
  audience: string;
  audienceCount: number;
  channels: string[];
  status: 'pending' | 'sent' | 'cancelled';
  createdAt: string;
}

/**
 * NotifStats - Statistiques globales du centre de notifications
 */
export interface NotifStats {
  totalSent: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  scheduledCount: number;
  templatesCount: number;
  autoSent: number;
  manualSent: number;
  trends: {
    autoSentTrend: string;
    manualSentTrend: string;
    deliveryTrend: string;
    openRateTrend: string;
    clickRateTrend: string;
  };
}

/**
 * AudienceSegment - Segments d'audience pour le ciblage
 */
export interface AudienceSegment {
  value: string;
  label: string;
  count: number;
}

/**
 * ChannelStat - Statistiques d'envoi par canal
 */
export interface ChannelStat {
  channel: 'push' | 'email' | 'inApp' | 'whatsapp';
  label: string;
  percentage: number;
  totalSent: number;
}

/**
 * WeeklyNotifStat - Données d'envoi hebdomadaire (auto + manuel)
 */
export interface WeeklyNotifStat {
  day: string;
  auto: number;
  manual: number;
}

// ============= PAYDUNYA TYPES =============

/**
 * PaydunyaChannelKey - Supported payment channels via PaydunYa aggregator
 */
export type PaydunyaChannelKey = 'orange_money' | 'moov_money' | 'wave' | 'sank_money' | 'telecel_money' | 'card';

/**
 * PaydunyaChannel - A single payment method available through PaydunYa
 */
export interface PaydunyaChannel {
  key: PaydunyaChannelKey;
  label: string;
  provider: string;
  enabled: boolean;
  fee: number; // percentage (e.g. 1.5 = 1.5%)
}

/**
 * PaydunyaConfig - Full PaydunYa aggregator configuration
 * Stored in Integration.config but typed here for type safety
 */
export interface PaydunyaConfig {
  masterKey: string;
  mode: 'live' | 'test';
  currency: string; // XOF
  callbackUrl: string;
  returnUrl: string;
  cancelUrl: string;
  channels: Record<PaydunyaChannelKey, {
    enabled: boolean;
    label: string;
    provider: string;
    fee: number;
  }>;
}

/**
 * PaydunyaChannelStats - Transaction statistics for a single channel
 * Backend endpoint: GET /admin/paydunya/stats/channels
 */
export interface PaydunyaChannelStats {
  channelKey: PaydunyaChannelKey;
  label: string;
  transactionsCount: number;
  transactionsTotal: number; // FCFA
  successRate: number;       // 0-100
  avgTransactionAmount: number;
  last24hCount: number;
  last24hTotal: number;
}

/**
 * PaydunyaWebhookLog - IPN event log entry
 * Backend endpoint: GET /admin/paydunya/webhook-logs
 */
export interface PaydunyaWebhookLog {
  id: string;
  eventType: 'payment_success' | 'payment_failed' | 'refund' | 'chargeback' | 'test';
  channelKey: PaydunyaChannelKey;
  transactionRef: string;
  amount: number;
  currency: string;
  httpStatus: number;
  responseTimeMs: number;
  payload?: Record<string, any>;
  createdAt: string;
}

/**
 * PaydunyaHealthStatus - Aggregator health check result
 * Backend endpoint: GET /admin/paydunya/health
 */
export interface PaydunyaHealthStatus {
  apiReachable: boolean;
  latencyMs: number;
  lastSuccessfulTransaction?: string; // ISO date
  channelHealth: Record<PaydunyaChannelKey, {
    operational: boolean;
    lastCheckedAt: string;
  }>;
  updatedAt: string;
}

/**
 * PaydunyaDashboardData - Aggregated data returned by usePaydunYa hook
 * This is NOT a backend entity — it's computed in the hook from multiple endpoints
 */
export interface PaydunyaDashboardData {
  integration: Integration;
  config: PaydunyaConfig;
  channels: PaydunyaChannel[];
  channelStats: PaydunyaChannelStats[];
  recentWebhooks: PaydunyaWebhookLog[];
  health: PaydunyaHealthStatus;
  totals: {
    totalTransactions: number;
    totalRevenue: number;
    globalSuccessRate: number;
    activeChannels: number;
    totalChannels: number;
  };
}

// ============= ADMIN SECURITY TYPES =============

/**
 * AdminActiveSession - Active sessions for the current admin user
 * Different from UserSession (platform-wide session monitoring)
 * This is for the admin's OWN sessions in Settings > Security
 */
export interface AdminActiveSession {
  id: string;
  deviceInfo: string;        // e.g. "Windows - Chrome 120"
  ipAddress: string;
  location: string;          // e.g. "Ouagadougou, Burkina Faso"
  loginAt: string;           // ISO datetime
  lastActivityAt: string;    // ISO datetime
  isCurrent: boolean;        // Is this the session the user is currently using?
}

/**
 * SecurityEvent - Security audit log for the current admin
 * e.g. login, password change, 2FA toggle, session revoked
 */
export interface SecurityEvent {
  id: string;
  type: 'login' | 'logout' | 'password_change' | '2fa_enabled' | '2fa_disabled' | 'session_revoked' | 'failed_login';
  description: string;
  ipAddress: string;
  location: string;
  createdAt: string;         // ISO datetime
}

/**
 * TwoFactorSetup - Response from initiating 2FA setup
 * In production: backend generates a TOTP secret + QR code
 * The admin scans with an authenticator app, then verifies with a code
 */
export interface TwoFactorSetup {
  secret: string;            // TOTP secret (for manual entry)
  qrCodeUrl: string;         // Data URL for QR code image
  backupCodes: string[];     // One-time backup codes
}

/**
 * AdminSecurityProfile - Aggregated security info for current admin
 */
export interface AdminSecurityProfile {
  twoFactorEnabled: boolean;
  lastPasswordChange: string;  // ISO datetime
  activeSessions: AdminActiveSession[];
  recentEvents: SecurityEvent[];
}