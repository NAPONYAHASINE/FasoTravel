/**
 * Service Paiements FasoTravel Admin
 * Backend-ready: Mock → API en changeant AppConfig
 * Version 2.0 - Pagination + Actions (Refund/Retry)
 * ZÉRO génération de données dans ce service
 */

import { AppConfig } from '../config/app.config';
import { apiService } from './apiService';
import type { Payment, RevenueStats } from '../shared/types/standardized';
import { MOCK_PAYMENTS, MOCK_REVENUE_STATS } from '../lib/adminMockData';

// ============================================================================
// TYPES
// ============================================================================

export interface PaymentFilters {
  status?: string;
  method?: string;
  search?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedPaymentsResponse {
  data: Payment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// CACHE
// ============================================================================

let cachedPayments: Payment[] | null = null;
let cachedStats: RevenueStats | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60000;

// ============================================================================
// SERVICE
// ============================================================================

class PaymentService {
  async getAllPayments(): Promise<Payment[]> {
    const now = Date.now();
    if (cachedPayments && cachedPayments.length > 0 && (now - cacheTimestamp < CACHE_DURATION)) {
      return cachedPayments;
    }

    if (AppConfig.isMock) {
      cachedPayments = MOCK_PAYMENTS;
      cacheTimestamp = now;
      return MOCK_PAYMENTS;
    }

    const response = await apiService.get<Payment[]>('/admin/payments');
    cachedPayments = (response as any)?.data ?? response;
    cacheTimestamp = now;
    return cachedPayments!;
  }

  async getPaymentsPaginated(
    pag: PaginationParams,
    filters?: PaymentFilters
  ): Promise<PaginatedPaymentsResponse> {
    if (AppConfig.isMock) {
      let filtered = [...MOCK_PAYMENTS];

      if (filters?.search) {
        const s = filters.search.toLowerCase();
        filtered = filtered.filter(p =>
          p.id.toLowerCase().includes(s) ||
          p.bookingId.toLowerCase().includes(s) ||
          p.userId.toLowerCase().includes(s) ||
          (p.transactionId || '').toLowerCase().includes(s) ||
          (p.userName || '').toLowerCase().includes(s)
        );
      }

      if (filters?.status && filters.status !== 'all') {
        filtered = filtered.filter(p => p.status === filters.status);
      }

      if (filters?.method && filters.method !== 'all') {
        filtered = filtered.filter(p => p.method === filters.method);
      }

      const total = filtered.length;
      const totalPages = Math.ceil(total / pag.limit) || 1;
      const start = (pag.page - 1) * pag.limit;
      const data = filtered.slice(start, start + pag.limit);

      return {
        data,
        pagination: { page: pag.page, limit: pag.limit, total, totalPages },
      };
    }

    const params = new URLSearchParams();
    params.set('page', String(pag.page));
    params.set('limit', String(pag.limit));
    if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters?.method && filters.method !== 'all') params.set('method', filters.method);
    if (filters?.search) params.set('search', filters.search);

    const response: any = await apiService.get(`/admin/payments?${params.toString()}`);
    return response?.data ?? response;
  }

  async getRevenueStats(): Promise<RevenueStats> {
    const now = Date.now();
    if (cachedStats && (now - cacheTimestamp < CACHE_DURATION)) {
      return cachedStats;
    }

    if (AppConfig.isMock) {
      cachedStats = MOCK_REVENUE_STATS;
      return MOCK_REVENUE_STATS;
    }

    const response: any = await apiService.get('/admin/payments/stats');
    cachedStats = response?.data ?? response;
    return cachedStats!;
  }

  async getPaymentById(paymentId: string): Promise<Payment | null> {
    if (AppConfig.isMock) {
      return MOCK_PAYMENTS.find(p => p.id === paymentId) || null;
    }

    const response: any = await apiService.get(`/admin/payments/${paymentId}`);
    return response?.data ?? response;
  }

  async refundPayment(paymentId: string, reason: string): Promise<Payment> {
    if (AppConfig.isMock) {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const payment = MOCK_PAYMENTS.find(p => p.id === paymentId);
      if (!payment) throw new Error(`Paiement ${paymentId} introuvable`);
      if (payment.status !== 'completed') {
        throw new Error('Seuls les paiements complétés peuvent être remboursés');
      }
      
      (payment as any).status = 'refunded';
      (payment as any).refundedAt = new Date().toISOString();
      (payment as any).refundReason = reason;
      (payment as any).updatedAt = new Date().toISOString();
      
      this.clearCache();
      return { ...payment };
    }

    const response: any = await apiService.post(`/admin/payments/${paymentId}/refund`, { reason });
    return response?.data ?? response;
  }

  async retryPayment(paymentId: string): Promise<Payment> {
    if (AppConfig.isMock) {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const payment = MOCK_PAYMENTS.find(p => p.id === paymentId);
      if (!payment) throw new Error(`Paiement ${paymentId} introuvable`);
      if (payment.status !== 'failed') {
        throw new Error('Seuls les paiements échoués peuvent être relancés');
      }
      
      (payment as any).status = 'pending';
      (payment as any).updatedAt = new Date().toISOString();
      
      this.clearCache();
      return { ...payment };
    }

    const response: any = await apiService.post(`/admin/payments/${paymentId}/retry`, {});
    return response?.data ?? response;
  }

  clearCache(): void {
    cachedPayments = null;
    cachedStats = null;
    cacheTimestamp = 0;
  }
}

export const paymentService = new PaymentService();
export default paymentService;
