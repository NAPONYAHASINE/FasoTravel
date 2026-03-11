/**
 * @file constants.ts
 * @description Shared constants used across Mobile and Societe apps
 */

// ============= API CONFIGURATION =============

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  TIMEOUT: 30000,
  MAX_RETRIES: 3
} as const;

// ============= STORAGE KEYS =============

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'transportbf_auth_token',
  REFRESH_TOKEN: 'transportbf_refresh_token',
  USER_ID: 'transportbf_user_id',
  USER_ROLE: 'transportbf_user_role',
  THEME: 'transportbf_theme',
  LANGUAGE: 'transportbf_language'
} as const;

// ============= PAGINATION =============

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
} as const;

// ============= DATE & TIME =============

export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  DISPLAY_WITH_TIME: 'DD/MM/YYYY HH:mm',
  ISO: 'YYYY-MM-DD',
  TIME: 'HH:mm',
  FULL: 'DD/MM/YYYY à HH:mm:ss'
} as const;

// ============= CURRENCY =============

export const CURRENCY = {
  CODE: 'XOF',
  SYMBOL: 'F CFA',
  LOCALE: 'fr-BF'
} as const;

// ============= VALIDATION =============

export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  PHONE_MIN_LENGTH: 8,
  PHONE_MAX_LENGTH: 20,
  EMAIL_MAX_LENGTH: 255,
  NAME_MAX_LENGTH: 255
} as const;

// ============= FILE UPLOAD =============

export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword']
} as const;

// ============= BURKINA FASO COLORS (Design System) =============

export const COLORS = {
  RED: '#dc2626',      // Burkina red
  YELLOW: '#f59e0b',   // Burkina yellow
  GREEN: '#16a34a',    // Burkina green
  
  // UI Colors
  PRIMARY: '#dc2626',
  SECONDARY: '#f59e0b',
  SUCCESS: '#16a34a',
  WARNING: '#f59e0b',
  ERROR: '#dc2626',
  INFO: '#3b82f6',
  
  // Neutrals
  GRAY_50: '#f9fafb',
  GRAY_100: '#f3f4f6',
  GRAY_200: '#e5e7eb',
  GRAY_300: '#d1d5db',
  GRAY_400: '#9ca3af',
  GRAY_500: '#6b7280',
  GRAY_600: '#4b5563',
  GRAY_700: '#374151',
  GRAY_800: '#1f2937',
  GRAY_900: '#111827'
} as const;

// ============= BREAKPOINTS (Responsive) =============

export const BREAKPOINTS = {
  XS: 320,
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536
} as const;

// ============= REFUND POLICY =============

export const REFUND_POLICY = {
  FULL_REFUND_HOURS_BEFORE: 24,
  PARTIAL_REFUND_HOURS_BEFORE: 6,
  PARTIAL_REFUND_PERCENTAGE: 80,
  NO_REFUND_HOURS_BEFORE: 2
} as const;

// ============= BOOKING LIMITS =============

export const BOOKING_LIMITS = {
  MAX_SEATS_PER_BOOKING: 10,
  MIN_BOOKING_HOURS_BEFORE: 2,
  MAX_BOOKING_DAYS_ADVANCE: 90
} as const;

// ============= STATUSES =============

export const TRIP_STATUSES = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

export const TICKET_STATUSES = {
  BOOKED: 'booked',
  CONFIRMED: 'confirmed',
  USED: 'used',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
} as const;

export const PAYMENT_STATUSES = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed'
} as const;

export const INCIDENT_STATUSES = {
  OPEN: 'open',
  IN_PROGRESS: 'in-progress',
  RESOLVED: 'resolved'
} as const;

// ============= WEBSOCKET =============

export const WEBSOCKET = {
  URL: import.meta.env.VITE_WS_URL || 'ws://localhost:3000',
  RECONNECT_INTERVAL: 5000,
  PING_INTERVAL: 30000
} as const;

// ============= ERROR CODES =============

export const ERROR_CODES = {
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  TIMEOUT: 'TIMEOUT',
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  UNPROCESSABLE_ENTITY: 'UNPROCESSABLE_ENTITY',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVER_ERROR: 'SERVER_ERROR'
} as const;
