/**
 * Hook réutilisable pour les métriques financières
 * Backend-ready: Gère le loading, erreurs, cache, et appels API
 * Version 3.0 - Fix: useCallback pour éviter les bugs de closure
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { financialService } from '../services/financialService';
import {
  FinancialDashboardMetrics,
  FinancialMetricsRequest,
  TimePeriod,
  FinancialKPI,
  PaymentMethodStats,
  CompanyRevenue,
  DailyRevenue,
} from '../types/financial';
import { useAdminApp } from '../context/AdminAppContext';

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export interface UseFinancialMetricsOptions {
  period?: TimePeriod;
  autoRefresh?: boolean;
  refreshInterval?: number; // En millisecondes
  companyId?: string;
}

export interface UseFinancialMetricsReturn {
  // Données
  metrics: FinancialDashboardMetrics | null;
  kpis: FinancialKPI[];
  
  // État
  loading: boolean;
  error: string | null;
  
  // Actions
  refresh: () => Promise<void>;
  setPeriod: (period: TimePeriod) => void;
  
  // Méta
  lastUpdated: Date | null;
  period: TimePeriod;
}

/**
 * Hook principal pour récupérer et gérer les métriques financières
 */
export function useFinancialMetrics(
  options: UseFinancialMetricsOptions = {}
): UseFinancialMetricsReturn {
  const { 
    period: initialPeriod = TimePeriod.WEEK,
    autoRefresh = false,
    refreshInterval = 60000, // 1 minute
    companyId 
  } = options;

  const { transportCompanies } = useAdminApp();
  
  const [metrics, setMetrics] = useState<FinancialDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<TimePeriod>(initialPeriod);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const loadedRef = useRef(false);

  /**
   * 🔥 SYNC: Synchronise avec le parent quand initialPeriod change
   */
  useEffect(() => {
    setPeriod(initialPeriod);
  }, [initialPeriod]);

  /**
   * 🔥 FIX: Récupère les métriques depuis le service avec useCallback
   * Évite les closures obsolètes
   */
  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const request: FinancialMetricsRequest = {
        period,
        companyId,
        includeDetails: true,
      };

      const response = await financialService.getFinancialMetrics(
        request,
        transportCompanies
      );

      if (response.success) {
        setMetrics(response.data);
        setLastUpdated(new Date());
      } else {
        setError(response.error || 'Erreur lors de la récupération des métriques');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [period, companyId, transportCompanies]); // 🔥 Dépendances explicites

  /**
   * Charge les données au montage
   */
  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      fetchMetrics();
    }
  }, [fetchMetrics]); // 🔥 fetchMetrics est maintenant stable

  /**
   * Recharge quand la période change
   */
  useEffect(() => {
    if (loadedRef.current) {
      fetchMetrics();
    }
  }, [period, fetchMetrics]); // 🔥 Inclut fetchMetrics dans les dépendances

  /**
   * Auto-refresh si activé
   */
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchMetrics();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchMetrics]); // 🔥 Inclut fetchMetrics

  /**
   * Génère les KPIs à partir des métriques
   */
  const kpis = useMemo<FinancialKPI[]>(() => {
    if (!metrics) return [];

    const { revenue, transactions, avgTransactionAmount, pendingPayments } = metrics;

    return [
      {
        label: 'Revenus Totaux',
        value: `${(revenue.totalRevenue / 1000000).toFixed(2)}M`,
        rawValue: revenue.totalRevenue,
        change: `+${revenue.growthRate.toFixed(1)}%`,
        changeValue: revenue.growthRate,
        trend: revenue.growthRate > 0 ? 'up' : revenue.growthRate < 0 ? 'down' : 'stable',
        format: 'currency',
        subtext: `${(revenue.periodRevenue / 1000).toFixed(0)}K FCFA cette période`,
        icon: 'DollarSign',
        color: 'emerald',
      },
      {
        label: 'Transactions',
        value: transactions.totalCount.toLocaleString(),
        rawValue: transactions.totalCount,
        change: `${transactions.successRate.toFixed(1)}% succès`,
        changeValue: transactions.successRate,
        trend: transactions.successRate > 95 ? 'up' : 'down',
        format: 'number',
        subtext: `${transactions.successCount.toLocaleString()} réussies`,
        icon: 'CreditCard',
        color: 'blue',
      },
      {
        label: 'Commission Plateforme',
        value: `${(revenue.platformCommission / 1000).toFixed(0)}K`,
        rawValue: revenue.platformCommission,
        change: `${revenue.commissionRate}% taux`,
        changeValue: revenue.commissionRate,
        trend: 'up',
        format: 'currency',
        subtext: `${revenue.commissionRate}% des transactions`,
        icon: 'Wallet',
        color: 'purple',
      },
      {
        label: 'Montant Moyen',
        value: `${(avgTransactionAmount / 1000).toFixed(1)}K`,
        rawValue: avgTransactionAmount,
        change: `${(pendingPayments / 1000).toFixed(0)}K en attente`,
        changeValue: pendingPayments,
        trend: 'up',
        format: 'currency',
        subtext: 'Par transaction (FCFA)',
        icon: 'Receipt',
        color: 'orange',
      },
    ];
  }, [metrics]);

  return {
    metrics,
    kpis,
    loading,
    error,
    refresh: fetchMetrics,
    setPeriod,
    lastUpdated,
    period,
  };
}

// ============================================================================
// HOOKS SPÉCIALISÉS
// ============================================================================

/**
 * Hook pour récupérer uniquement les données de revenus journaliers
 */
export function useDailyRevenue(period: TimePeriod = TimePeriod.WEEK) {
  const [data, setData] = useState<DailyRevenue[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    financialService.getDailyRevenue(period).then(result => {
      setData(result);
      setLoading(false);
    });
  }, [period]);

  return { data, loading };
}

/**
 * Hook pour les statistiques par méthode de paiement
 */
export function usePaymentMethodStats() {
  const [data, setData] = useState<PaymentMethodStats[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    financialService.getPaymentMethodStats().then(result => {
      setData(result);
      setLoading(false);
    });
  }, []);

  return { data, loading };
}

/**
 * Hook pour le classement des sociétés par revenus
 */
export function useTopCompaniesByRevenue(limit: number = 10) {
  const { transportCompanies } = useAdminApp();
  const [data, setData] = useState<CompanyRevenue[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    financialService.getTopCompaniesByRevenue(transportCompanies, limit).then(result => {
      setData(result);
      setLoading(false);
    });
  }, [transportCompanies, limit]);

  return { data, loading };
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Formate un montant en FCFA
 */
export function formatCurrency(amount: number, compact: boolean = false): string {
  if (compact) {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(2)}M`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`;
    }
  }
  return `${amount.toLocaleString()} FCFA`;
}

/**
 * Formate un taux de croissance
 */
export function formatGrowthRate(rate: number): string {
  const sign = rate > 0 ? '+' : '';
  return `${sign}${rate.toFixed(1)}%`;
}

/**
 * Détermine la tendance à partir d'un taux
 */
export function getTrend(rate: number): 'up' | 'down' | 'stable' {
  if (rate > 1) return 'up';
  if (rate < -1) return 'down';
  return 'stable';
}