/**
 * @file enums.ts
 * @description Shared enums for FasoTravel system
 */

// ============= USER ROLES =============

export enum UserRole {
  RESPONSABLE = 'responsable',
  MANAGER = 'manager',
  CAISSIER = 'caissier'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

// ============= TRIP STATUSES =============

export enum TripStatus {
  SCHEDULED = 'scheduled',
  BOARDING = 'boarding',
  DEPARTED = 'departed',
  ARRIVED = 'arrived',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// ============= TICKET STATUSES =============

export enum TicketStatus {
  ACTIVE = 'active',
  BOARDED = 'boarded',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  BOOKED = 'booked',
  CONFIRMED = 'confirmed',
  USED = 'used'
}

// ============= PAYMENT =============

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

// ============= INCIDENT =============

export enum IncidentType {
  ACCIDENT = 'accident',
  DELAY = 'delay',
  CANCELLATION = 'cancellation',
  MECHANICAL = 'mechanical',
  OTHER = 'other'
}

export enum IncidentSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum IncidentStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in-progress',
  RESOLVED = 'resolved'
}

// ============= STORY =============

export enum StoryCategory {
  NEWS = 'news',
  PROMOTION = 'promotion',
  ALERT = 'alert',
  MAINTENANCE = 'maintenance'
}

export enum StoryStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

// ============= REVIEW =============

export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

// ============= SUPPORT =============

export enum SupportCategory {
  BOOKING = 'booking',
  PAYMENT = 'payment',
  TECHNICAL = 'technical',
  FEEDBACK = 'feedback',
  OTHER = 'other'
}

export enum SupportPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum SupportStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in-progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

// ============= CASH TRANSACTION =============

export enum CashTransactionType {
  SALE = 'sale',
  REFUND = 'refund',
  ADJUSTMENT = 'adjustment',
  OPENING = 'opening',
  CLOSING = 'closing'
}

// ============= PASSENGER TYPE =============

export enum PassengerType {
  ADULT = 'adult',
  CHILD = 'child',
  SENIOR = 'senior'
}

// ============= ENTITY STATUS =============

export enum EntityStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

// ============= DAYS OF WEEK =============

export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6
}

// ============= SORT ORDER =============

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc'
}

// ============= HELPER FUNCTIONS =============

/**
 * Get display label for UserRole
 */
export function getUserRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    [UserRole.RESPONSABLE]: 'Responsable',
    [UserRole.MANAGER]: 'Manager',
    [UserRole.CAISSIER]: 'Caissier'
  };
  return labels[role];
}

/**
 * Get display label for TripStatus
 */
export function getTripStatusLabel(status: TripStatus): string {
  const labels: Record<TripStatus, string> = {
    [TripStatus.SCHEDULED]: 'Programmé',
    [TripStatus.BOARDING]: 'Embarquement',
    [TripStatus.DEPARTED]: 'En route',
    [TripStatus.ARRIVED]: 'Arrivé',
    [TripStatus.IN_PROGRESS]: 'En cours',
    [TripStatus.COMPLETED]: 'Terminé',
    [TripStatus.CANCELLED]: 'Annulé'
  };
  return labels[status];
}

/**
 * Get display label for TicketStatus
 */
export function getTicketStatusLabel(status: TicketStatus): string {
  const labels: Record<TicketStatus, string> = {
    [TicketStatus.ACTIVE]: 'Actif',
    [TicketStatus.BOARDED]: 'Embarqué',
    [TicketStatus.EXPIRED]: 'Expiré',
    [TicketStatus.CANCELLED]: 'Annulé',
    [TicketStatus.REFUNDED]: 'Remboursé',
    [TicketStatus.BOOKED]: 'Réservé',
    [TicketStatus.CONFIRMED]: 'Confirmé',
    [TicketStatus.USED]: 'Utilisé'
  };
  return labels[status];
}

/**
 * Get display label for PaymentMethod
 */
export function getPaymentMethodLabel(method: PaymentMethod): string {
  const labels: Record<PaymentMethod, string> = {
    [PaymentMethod.CASH]: 'Espèces',
    [PaymentMethod.CARD]: 'Carte bancaire',
    [PaymentMethod.ORANGE_MONEY]: 'Orange Money',
    [PaymentMethod.MOOV_MONEY]: 'Moov Money',
    [PaymentMethod.WAVE]: 'Wave'
  };
  return labels[method];
}

/**
 * Get display label for IncidentSeverity
 */
export function getIncidentSeverityLabel(severity: IncidentSeverity): string {
  const labels: Record<IncidentSeverity, string> = {
    [IncidentSeverity.LOW]: 'Faible',
    [IncidentSeverity.MEDIUM]: 'Moyen',
    [IncidentSeverity.HIGH]: 'Élevé',
    [IncidentSeverity.CRITICAL]: 'Critique'
  };
  return labels[severity];
}

/**
 * Get display label for day of week
 */
export function getDayOfWeekLabel(day: DayOfWeek): string {
  const labels: Record<DayOfWeek, string> = {
    [DayOfWeek.SUNDAY]: 'Dimanche',
    [DayOfWeek.MONDAY]: 'Lundi',
    [DayOfWeek.TUESDAY]: 'Mardi',
    [DayOfWeek.WEDNESDAY]: 'Mercredi',
    [DayOfWeek.THURSDAY]: 'Jeudi',
    [DayOfWeek.FRIDAY]: 'Vendredi',
    [DayOfWeek.SATURDAY]: 'Samedi'
  };
  return labels[day];
}

/**
 * Get color for TripStatus
 */
export function getTripStatusColor(status: TripStatus): string {
  const colors: Record<TripStatus, string> = {
    [TripStatus.SCHEDULED]: '#3b82f6',
    [TripStatus.BOARDING]: '#8b5cf6',
    [TripStatus.DEPARTED]: '#f97316',
    [TripStatus.ARRIVED]: '#14b8a6',
    [TripStatus.IN_PROGRESS]: '#f59e0b',
    [TripStatus.COMPLETED]: '#16a34a',
    [TripStatus.CANCELLED]: '#dc2626'
  };
  return colors[status];
}

/**
 * Get color for TicketStatus
 */
export function getTicketStatusColor(status: TicketStatus): string {
  const colors: Record<TicketStatus, string> = {
    [TicketStatus.ACTIVE]: '#16a34a',
    [TicketStatus.BOARDED]: '#8b5cf6',
    [TicketStatus.EXPIRED]: '#6b7280',
    [TicketStatus.BOOKED]: '#3b82f6',
    [TicketStatus.CONFIRMED]: '#16a34a',
    [TicketStatus.USED]: '#6b7280',
    [TicketStatus.CANCELLED]: '#dc2626',
    [TicketStatus.REFUNDED]: '#f59e0b'
  };
  return colors[status];
}

/**
 * Get color for IncidentSeverity
 */
export function getIncidentSeverityColor(severity: IncidentSeverity): string {
  const colors: Record<IncidentSeverity, string> = {
    [IncidentSeverity.LOW]: '#10b981',
    [IncidentSeverity.MEDIUM]: '#f59e0b',
    [IncidentSeverity.HIGH]: '#f97316',
    [IncidentSeverity.CRITICAL]: '#dc2626'
  };
  return colors[severity];
}
