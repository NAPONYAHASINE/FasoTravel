/**
 * User roles across all 3 apps.
 * Single source of truth — never duplicate these strings.
 *
 * Mobile passengers: PASSENGER
 * Admin panel users: SUPER_ADMIN, OPERATOR_ADMIN, SUPPORT_ADMIN, FINANCE_ADMIN
 * Societe users: responsable, manager, caissier
 */
export enum UserRole {
  PASSENGER = 'PASSENGER',
  // Admin roles
  SUPER_ADMIN = 'SUPER_ADMIN',
  OPERATOR_ADMIN = 'OPERATOR_ADMIN',
  SUPPORT_ADMIN = 'SUPPORT_ADMIN',
  FINANCE_ADMIN = 'FINANCE_ADMIN',
  // Societe roles
  RESPONSABLE = 'responsable',
  MANAGER = 'manager',
  CAISSIER = 'caissier',
}

/**
 * Matches shared/types/standardized.ts — lowercase values.
 * Flow: pending → confirmed → completed | cancelled
 */
export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * Matches shared/types/standardized.ts — lowercase values.
 */
export enum TicketStatus {
  ACTIVE = 'active',
  BOARDED = 'boarded',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

/**
 * Matches shared/types/standardized.ts — lowercase values.
 */
export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

/**
 * Matches shared/types/standardized.ts — lowercase values.
 */
export enum PaymentMethod {
  CASH = 'cash',
  ORANGE_MONEY = 'orange_money',
  MOOV_MONEY = 'moov_money',
  WAVE = 'wave',
  CARD = 'card',
}

/**
 * Matches shared/types/standardized.ts — lowercase values.
 */
export enum TripStatus {
  SCHEDULED = 'scheduled',
  BOARDING = 'boarding',
  DEPARTED = 'departed',
  ARRIVED = 'arrived',
  CANCELLED = 'cancelled',
}

export enum SeatStatus {
  AVAILABLE = 'available',
  HELD = 'held',
  BOOKED = 'booked',
  BLOCKED = 'blocked',
}

export enum IncidentSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum PolicyStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum ReferralStatus {
  PENDING = 'pending',
  VALIDATED = 'validated',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum CouponStatus {
  ACTIVE = 'active',
  USED = 'used',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum ReferralBadgeLevel {
  STANDARD = 'standard',
  AMBASSADEUR = 'ambassadeur',
  SUPER_AMBASSADEUR = 'super_ambassadeur',
  LEGENDE = 'legende',
}

export const REFERRAL_BADGE_THRESHOLDS: Record<string, number> = {
  [ReferralBadgeLevel.STANDARD]: 0,
  [ReferralBadgeLevel.AMBASSADEUR]: 100,
  [ReferralBadgeLevel.SUPER_AMBASSADEUR]: 250,
  [ReferralBadgeLevel.LEGENDE]: 500,
};

export const REFERRAL_COUPON_TIERS = [
  { pointsCost: 100, amount: 500 },
  { pointsCost: 200, amount: 1000 },
] as const;

export const POINTS_PER_REFERRAL = 10;

export const COUPON_VALIDITY_DAYS = 90;

/** Default seat count when generating trips from schedule templates */
export const DEFAULT_TOTAL_SEATS = 50;

/** Default duration in minutes when template has no durationMinutes */
export const DEFAULT_TRIP_DURATION_MINUTES = 180;

/** Default page size for admin trip summary queries */
export const ADMIN_TRIPS_PAGE_SIZE = 50;

export enum NotificationChannel {
  PUSH = 'push',
  EMAIL = 'email',
  SMS = 'sms',
  WHATSAPP = 'whatsapp',
}

/** User account status */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

/** Booking hold duration in minutes */
export const BOOKING_HOLD_MINUTES = 10;

/** Bcrypt salt rounds */
export const BCRYPT_SALT_ROUNDS = 12;

/** Referral code prefix */
export const REFERRAL_CODE_PREFIX = 'FT-226';

/** Ticket alphanumeric code length */
export const TICKET_CODE_LENGTH = 8;

/** OTP expiration in minutes */
export const OTP_EXPIRATION_MINUTES = 10;

/** Ticket transfer expiration in hours */
export const TICKET_TRANSFER_EXPIRATION_HOURS = 24;

/** Story default expiration in days */
export const STORY_EXPIRATION_DAYS = 7;

/** Ad default expiration in days */
export const AD_DEFAULT_EXPIRATION_DAYS = 30;

/** Google Maps Directions API base URL */
export const GOOGLE_MAPS_DIRECTIONS_URL =
  'https://maps.googleapis.com/maps/api/directions/json';

/** Cashier heartbeat interval — considered offline after this many seconds without ping */
export const HEARTBEAT_TIMEOUT_SECONDS = 90;

/** Heartbeat ping interval the frontend should use (seconds) */
export const HEARTBEAT_PING_INTERVAL_SECONDS = 30;
