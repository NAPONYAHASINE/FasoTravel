/**
 * Hook réutilisable pour la gestion des paiements
 * Backend-ready: Gère le loading, erreurs, cache, pagination et actions
 * Version 3.0 - Pagination + Actions (Refund/Retry)
 */

import { useState, useEffect, useCallback } from 'react';
import { paymentService } from '../services/paymentService';
import type { Payment, RevenueStats } from '../shared/types/standardized';

// ============================================================================
// TYPES
// ============================================================================

export interface PaymentFilterState {
  status?: string;
  method?: string;
  search?: string;
}

export interface UsePaymentsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  loadStats?: boolean;
  paginated?: boolean;
  limit?: number;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function usePayments(options: UsePaymentsOptions = {}) {
  const {
    autoRefresh = false,
    refreshInterval = 30000,
    loadStats = true,
    paginated = true,
    limit = 10,
  } = options;
  
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit,
    total: 0,
    totalPages: 0,
  });
  
  const [filters, setFiltersInternal] = useState<PaymentFilterState>({});

  const fetchData = useCallback(async (
    pageOverride?: number,
    filtersOverride?: PaymentFilterState
  ) => {
    setError(null);

    const currentPage = pageOverride ?? pagination.page;
    const currentFilters = filtersOverride ?? filters;

    try {
      if (paginated) {
        const result = await paymentService.getPaymentsPaginated(
          { page: currentPage, limit: pagination.limit },
          currentFilters
        );
        setPayments(result.data);
        setPagination(prev => ({
          ...prev,
          page: result.pagination.page,
          total: result.pagination.total,
          totalPages: result.pagination.totalPages,
        }));
      } else {
        const data = await paymentService.getAllPayments();
        setPayments(data || []);
      }

      if (loadStats) {
        const statsData = await paymentService.getRevenueStats();
        setStats(statsData);
      }

      setLastUpdated(new Date());
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('[usePayments] Erreur:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters, paginated, loadStats]);

  const setPage = useCallback((newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  }, []);
  
  const setFilters = useCallback((newFilters: PaymentFilterState) => {
    setFiltersInternal(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Load on mount + when page/filters change
  useEffect(() => {
    let cancelled = false;
    
    const load = async () => {
      setError(null);
      
      try {
        if (paginated) {
          const result = await paymentService.getPaymentsPaginated(
            { page: pagination.page, limit: pagination.limit },
            filters
          );
          if (!cancelled) {
            setPayments(result.data);
            setPagination(prev => ({
              ...prev,
              total: result.pagination.total,
              totalPages: result.pagination.totalPages,
            }));
          }
        } else {
          const data = await paymentService.getAllPayments();
          if (!cancelled) setPayments(data || []);
        }
        
        if (loadStats) {
          const statsData = await paymentService.getRevenueStats();
          if (!cancelled) setStats(statsData);
        }
        
        if (!cancelled) {
          setLastUpdated(new Date());
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erreur inconnue');
          setLoading(false);
        }
      }
    };
    
    load();
    return () => { cancelled = true; };
  }, [pagination.page, pagination.limit, filters, paginated, loadStats]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => { fetchData(); }, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchData]);

  return {
    payments,
    stats,
    pagination,
    setPage,
    filters,
    setFilters,
    loading,
    error,
    refresh: () => fetchData(),
    lastUpdated,
  };
}

// ============================================================================
// HOOK ACTIONS D'ÉCRITURE
// ============================================================================

export function usePaymentActions() {
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const refundPayment = useCallback(async (paymentId: string, reason: string) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const result = await paymentService.refundPayment(paymentId, reason);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du remboursement';
      setActionError(msg);
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const retryPayment = useCallback(async (paymentId: string) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const result = await paymentService.retryPayment(paymentId);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la relance';
      setActionError(msg);
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, []);

  return { refundPayment, retryPayment, actionLoading, actionError };
}

// ============================================================================
// HOOK STATS SEULES
// ============================================================================

export function useRevenueStats() {
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    
    paymentService
      .getRevenueStats()
      .then(result => {
        if (!cancelled) { setStats(result); setLoading(false); }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erreur inconnue');
          setLoading(false);
        }
      });
    
    return () => { cancelled = true; };
  }, []);

  return { stats, loading, error };
}