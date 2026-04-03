/**
 * User roles across all 3 apps.
 * Single source of truth — never duplicate these strings.
 */
export enum UserRole {
  PASSENGER = 'PASSENGER',
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR',
  MANAGER = 'MANAGER',
  CASHIER = 'CASHIER',
}

export enum BookingStatus {
  HOLD = 'HOLD',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  COMPLETED = 'COMPLETED',
}

export enum TicketStatus {
  ACTIVE = 'ACTIVE',
  VALIDATED = 'VALIDATED',
  USED = 'USED',
  CANCELLED = 'CANCELLED',
  TRANSFERRED = 'TRANSFERRED',
  EXPIRED = 'EXPIRED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  EXPIRED = 'EXPIRED',
}

export enum PaymentMethod {
  ORANGE_MONEY = 'ORANGE_MONEY',
  MOOV_MONEY = 'MOOV_MONEY',
  WAVE = 'WAVE',
  CARD = 'CARD',
  CASH = 'CASH',
}

export enum TripStatus {
  SCHEDULED = 'SCHEDULED',
  BOARDING = 'BOARDING',
  IN_TRANSIT = 'IN_TRANSIT',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DELAYED = 'DELAYED',
}

export enum SeatStatus {
  AVAILABLE = 'AVAILABLE',
  HELD = 'HELD',
  BOOKED = 'BOOKED',
  BLOCKED = 'BLOCKED',
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

export enum NotificationChannel {
  PUSH = 'push',
  EMAIL = 'email',
  SMS = 'sms',
  WHATSAPP = 'whatsapp',
}

/** Booking hold duration in minutes */
export const BOOKING_HOLD_MINUTES = 10;

/** Bcrypt salt rounds */
export const BCRYPT_SALT_ROUNDS = 12;

/** Referral code prefix */
export const REFERRAL_CODE_PREFIX = 'FT';

/** Ticket alphanumeric code length */
export const TICKET_CODE_LENGTH = 8;
