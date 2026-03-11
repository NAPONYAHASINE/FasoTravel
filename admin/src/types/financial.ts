/**
 * Types pour le système financier de FasoTravel Admin
 * Backend-ready - Ces types correspondent aux modèles DB/API
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export enum PaymentMethod {
  MOBILE_MONEY = 'mobile_money',
  CREDIT_CARD = 'credit_card',
  CASH = 'cash',
}

export enum RevenueCategory {
  BOOKING_COMMISSION = 'booking_commission',
  PLATFORM_FEE = 'platform_fee',
  SUBSCRIPTION = 'subscription',
  ADVERTISING = 'advertising'
}

export enum TimePeriod {
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
  CUSTOM = 'custom'
}

// ============================================================================
// TRANSACTION TYPES
// ============================================================================

export interface Transaction {
  id: string;
  bookingId?: string;
  companyId: string;
  passengerId: string;
  amount: number; // En FCFA
  currency: 'XOF'; // Franc CFA
  method: PaymentMethod;
  status: TransactionStatus;
  category: RevenueCategory;
  platformCommission: number; // Montant de la commission
  commissionRate: number; // Taux en %
  metadata?: Record<string, any>;
  createdAt: Date;
  completedAt?: Date;
  failureReason?: string;
}

export interface TransactionSummary {
  totalAmount: number;
  totalCount: number;
  successCount: number;
  failedCount: number;
  pendingCount: number;
  refundedCount: number;
  successRate: number; // En %
  averageAmount: number;
}

// ============================================================================
// REVENUE TYPES
// ============================================================================

export interface RevenueMetrics {
  totalRevenue: number;
  periodRevenue: number;
  previousPeriodRevenue: number;
  growthRate: number; // En %
  platformCommission: number;
  commissionRate: number; // Taux moyen en %
  byCategory: Record<RevenueCategory, number>;
  byPaymentMethod: Record<PaymentMethod, number>;
  topCompanies: CompanyRevenue[];
}

export interface CompanyRevenue {
  companyId: string;
  companyName: string;
  totalRevenue: number;
  transactionCount: number;
  commissionGenerated: number;
  averageTransactionAmount: number;
  growth: number; // En %
}

export interface DailyRevenue {
  date: Date;
  revenue: number;
  transactionCount: number;
  commission: number;
  activeCompanies: number;
}

// ============================================================================
// PAYMENT METHOD ANALYTICS
// ============================================================================

export interface PaymentMethodStats {
  method: PaymentMethod;
  methodName: string;
  transactionCount: number;
  totalAmount: number;
  percentage: number; // % du total
  successRate: number;
  averageAmount: number;
  color: string; // Pour les graphiques
  isAuditOnly?: boolean; // 🔥 Indique si cette méthode est gérée par les sociétés (Admin = audit uniquement)
}

// ============================================================================
// FINANCIAL DASHBOARD METRICS
// ============================================================================

export interface FinancialDashboardMetrics {
  // Métriques principales
  revenue: RevenueMetrics;
  transactions: TransactionSummary;
  
  // Données pour graphiques
  dailyRevenue: DailyRevenue[];
  paymentMethods: PaymentMethodStats[];
  topCompaniesByRevenue: CompanyRevenue[];
  
  // Métriques de performance
  avgTransactionAmount: number;
  pendingPayments: number;
  processingFees: number;
  netRevenue: number;
  
  // Période de référence
  period: TimePeriod;
  startDate: Date;
  endDate: Date;
  
  // Méta-données
  lastUpdated: Date;
  dataSource: 'live' | 'cached' | 'mock';
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface FinancialMetricsRequest {
  period: TimePeriod;
  startDate?: Date;
  endDate?: Date;
  companyId?: string; // Filtrer par société
  includeDetails?: boolean;
}

export interface FinancialMetricsResponse {
  success: boolean;
  data: FinancialDashboardMetrics;
  message?: string;
  error?: string;
}

// ============================================================================
// MOCK DATA CONFIGURATION
// ============================================================================

export interface MockFinancialConfig {
  baseRevenue: number;
  baseTransactionCount: number;
  commissionRate: number;
  successRate: number;
  growthRate: number;
  variancePercentage: number; // Pour randomisation réaliste
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface RevenueComparison {
  current: number;
  previous: number;
  difference: number;
  percentageChange: number;
  trend: 'up' | 'down' | 'stable';
}

export interface FinancialKPI {
  label: string;
  value: string | number;
  rawValue: number;
  change: string;
  changeValue: number;
  trend: 'up' | 'down' | 'stable';
  format: 'currency' | 'number' | 'percentage';
  subtext?: string;
  icon?: string;
  color?: string;
}