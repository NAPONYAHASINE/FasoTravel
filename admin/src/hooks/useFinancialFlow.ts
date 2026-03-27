/**
 * @file useFinancialFlow.ts
 * @description Hook dédié Flux Financier — Page de visualisation des flux d'argent
 * 
 * Convention useAdminApp() appliquée :
 * - Toute la logique métier ici, ZÉRO dans le composant
 * - Backend-ready : bascule mock/prod transparente via financialService
 * - Pas de spinner bloquant — data disponible immédiatement en mock
 * - Filtre automatiquement les canaux `isAuditOnly` (espèces guichets)
 * 
 * MODÈLE ÉCONOMIQUE FASOTRAVEL :
 * - FasoTravel perçoit UNIQUEMENT sur les billets vendus via l'app mobile
 * - Agrégateur unique : PayDunya (Split Payment)
 * - X% commission prélevée sur les sociétés de transport (min 5%, modifiable)
 * - 100 FCFA frais de service payés par le passager (séparé du prix du billet)
 * - Les ventes physiques (cash aux guichets) = hors périmètre FasoTravel
 * 
 * RÉPARTITION DU PRIX DU BILLET :
 * Prix billet = montant fixé par la société
 * → 95% reversé à la société (via Split PayDunya)
 * → 5% commission FasoTravel (via Split PayDunya)
 * Le passager paie EN PLUS 100 FCFA de frais de service (100% FasoTravel)
 * Les 100 FCFA ne font PAS partie du prix du billet, donc ne sont PAS dans le split 95/5.
 * 
 * USAGE:
 * ```tsx
 * const { data, kpis, period, actions, loading, error } = useFinancialFlow();
 * // data.platformChannels  → canaux PayDunya uniquement (pas de cash)
 * // data.companies         → répartition par société
 * // kpis.platformRevenue   → commission + frais de service
 * // actions.setPeriod(TimePeriod.MONTH)
 * // actions.updateCommissionRate(7)  → modifier la commission
 * // actions.updateServiceFee(150)    → modifier les frais de service
 * ```
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { financialService } from '../services/financialService';
import { referralsService } from '../services/entitiesService';
import type { ReferralStats } from '../shared/types/standardized';
import { useAdminApp } from '../context/AdminAppContext';
import {
  TimePeriod,
  type FinancialDashboardMetrics,
  type FinancialMetricsRequest,
  type CompanyRevenue,
  type PaymentMethodStats,
  type DailyRevenue,
} from '../types/financial';

// ============================================================================
// CONSTANTES MODÈLE ÉCONOMIQUE (valeurs par défaut)
// ============================================================================

/** Paramètres du modèle économique FasoTravel — valeurs par défaut */
export const FASOTRAVEL_MODEL_DEFAULTS = {
  /** Commission minimum négociable (jamais en dessous) */
  minCommissionRate: 5,
  /** Commission par défaut */
  defaultCommissionRate: 5,
  /** Frais de service par défaut */
  defaultServiceFee: 100,
  /** Prix moyen d'un billet (pour simulations) */
  avgTicketPrice: 5000,
  /** Devise */
  currency: 'FCFA',
} as const;

/** Export pour compatibilité — sera dynamique via le hook */
export const FASOTRAVEL_MODEL = {
  commissionRate: FASOTRAVEL_MODEL_DEFAULTS.defaultCommissionRate,
  serviceFeePerTicket: FASOTRAVEL_MODEL_DEFAULTS.defaultServiceFee,
  avgTicketPrice: FASOTRAVEL_MODEL_DEFAULTS.avgTicketPrice,
  currency: FASOTRAVEL_MODEL_DEFAULTS.currency,
} as const;

/** Coûts technologiques mensuels (base 1000 users actifs) */
export const TECH_COSTS = [
  { key: 'whatsapp', label: 'WhatsApp Business (OTP)', amount: 63000, color: '#3b82f6' },
  { key: 'googleMaps', label: 'Google Maps', amount: 20000, color: '#16a34a' },
  { key: 'aws', label: 'AWS (Lightsail + S3 + CDN)', amount: 35000, color: '#f97316' },
] as const;

export const TOTAL_TECH_COST = TECH_COSTS.reduce((s, c) => s + c.amount, 0); // 118,000

// ============================================================================
// TYPES
// ============================================================================

/** Données dérivées du flux financier */
export interface FinancialFlowData {
  /** Revenus totaux des transactions via l'app mobile (prix billets uniquement, HORS frais de service) */
  totalRevenue: number;
  /** Nombre total de billets vendus via l'app */
  ticketCount: number;
  /** Commission X% prélevée sur le prix du billet */
  commissionRevenue: number;
  /** Frais de service (séparé du billet) = fraisService × nombre de billets */
  serviceFeeRevenue: number;
  /** Total revenus plateforme (commission + frais service) */
  platformRevenue: number;
  /** Montant reversé aux sociétés ((100 - commission)% du prix billet) */
  companyReversal: number;
  /** Coût total des coupons de parrainage */
  referralCosts: number;
  /** Stats complètes du parrainage (pour affichage détaillé) */
  referralStats: ReferralStats | null;
  /** Marge nette après coûts tech + parrainage */
  netMargin: number;
  /** Total des dépenses (tech + parrainage) */
  totalExpenses: number;
  /** Taux de croissance de la période */
  growthRate: number;

  /** Canaux PayDunya UNIQUEMENT (cash filtré) */
  platformChannels: PaymentMethodStats[];
  /** Donnée cash (audit seulement, hors flux FasoTravel) */
  cashAudit: PaymentMethodStats | null;

  /** Répartition par société de transport */
  companies: CompanyRevenue[];
  /** Données pour le graphique d'évolution */
  dailyRevenue: DailyRevenue[];

  /** Source des données */
  dataSource: 'live' | 'cached' | 'mock';
}

export interface UseFinancialFlowReturn {
  /** Données du flux financier — null seulement avant le tout premier chargement */
  data: FinancialFlowData | null;
  /** Métriques brutes du service (pour composants qui en ont besoin) */
  rawMetrics: FinancialDashboardMetrics | null;
  /** Période actuelle */
  period: TimePeriod;
  /** Loading state */
  loading: boolean;
  /** Erreur */
  error: string | null;
  /** Dernière mise à jour */
  lastUpdated: Date | null;
  /** Paramètres modèle économique (modifiables) */
  model: {
    commissionRate: number;
    serviceFeePerTicket: number;
  };
  /** Actions */
  actions: {
    setPeriod: (period: TimePeriod) => void;
    refresh: () => Promise<void>;
    updateCommissionRate: (rate: number) => void;
    updateServiceFee: (fee: number) => void;
  };
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function useFinancialFlow(
  initialPeriod: TimePeriod = TimePeriod.MONTH
): UseFinancialFlowReturn {
  const { transportCompanies } = useAdminApp();

  const [metrics, setMetrics] = useState<FinancialDashboardMetrics | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<TimePeriod>(initialPeriod);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const loadedRef = useRef(false);

  // Paramètres modèle économique modifiables
  const [commissionRate, setCommissionRate] = useState<number>(FASOTRAVEL_MODEL_DEFAULTS.defaultCommissionRate);
  const [serviceFeePerTicket, setServiceFeePerTicket] = useState<number>(FASOTRAVEL_MODEL_DEFAULTS.defaultServiceFee);

  // ==================== FETCH ====================

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const request: FinancialMetricsRequest = {
        period,
        includeDetails: true,
      };

      const [response, refResponse] = await Promise.all([
        financialService.getFinancialMetrics(request, transportCompanies),
        referralsService.getStats(),
      ]);

      if (response.success) {
        setMetrics(response.data);
        setLastUpdated(new Date());
      } else {
        setError(response.error || 'Erreur lors de la récupération des données financières');
      }

      if (refResponse.success && refResponse.data) {
        setReferralStats(refResponse.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [period, transportCompanies]);

  // Chargement initial — immédiat, pas de délai
  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      fetchData();
    }
  }, [fetchData]);

  // Rechargement quand la période change
  useEffect(() => {
    if (loadedRef.current) {
      fetchData();
    }
  }, [period, fetchData]);

  // ==================== ACTIONS MODÈLE ====================

  const updateCommissionRate = useCallback((rate: number) => {
    // Minimum 5%, pas de limite haute (mais raisonnablement < 50%)
    const clamped = Math.max(FASOTRAVEL_MODEL_DEFAULTS.minCommissionRate, Math.min(50, rate));
    setCommissionRate(clamped);
  }, []);

  const updateServiceFee = useCallback((fee: number) => {
    // Minimum 0 FCFA
    const clamped = Math.max(0, Math.round(fee));
    setServiceFeePerTicket(clamped);
  }, []);

  // ==================== DONNÉES DÉRIVÉES ====================

  const data = useMemo<FinancialFlowData | null>(() => {
    if (!metrics) return null;

    const totalRevenue = metrics.revenue?.totalRevenue ?? 0;
    const ticketCount = metrics.transactions?.totalCount ?? 0;
    const growthRate = metrics.revenue?.growthRate ?? 0;

    // Calculs modèle économique
    // Le prix du billet = totalRevenue (HORS frais de service)
    // Split du prix billet : commissionRate% → FasoTravel, reste → société
    const commissionRevenue = Math.floor(totalRevenue * (commissionRate / 100));
    // Frais de service : payé par le passager EN PLUS du billet → 100% FasoTravel
    const serviceFeeRevenue = ticketCount * serviceFeePerTicket;
    // Revenu total plateforme = commission sur billet + frais de service
    const platformRevenue = commissionRevenue + serviceFeeRevenue;
    // Reversement sociétés = prix billet - commission (les 100F ne touchent jamais la société)
    const companyReversal = totalRevenue - commissionRevenue;
    const referralCosts = referralStats?.totalCouponsCost ?? 0;
    const totalExpenses = TOTAL_TECH_COST + referralCosts;
    const netMargin = platformRevenue - totalExpenses;

    // Filtrage canaux : séparer plateforme (PayDunya) vs audit (cash guichets)
    const allMethods = metrics.paymentMethods ?? [];
    const platformChannels = allMethods.filter(m => !m.isAuditOnly);
    const cashAudit = allMethods.find(m => m.isAuditOnly) ?? null;

    return {
      totalRevenue,
      ticketCount,
      commissionRevenue,
      serviceFeeRevenue,
      platformRevenue,
      companyReversal,
      referralCosts,
      referralStats,
      netMargin,
      totalExpenses,
      growthRate,
      platformChannels,
      cashAudit,
      companies: metrics.topCompaniesByRevenue ?? [],
      dailyRevenue: metrics.dailyRevenue ?? [],
      dataSource: metrics.dataSource ?? 'mock',
    };
  }, [metrics, commissionRate, serviceFeePerTicket, referralStats]);

  // ==================== RETURN ====================

  return {
    data,
    rawMetrics: metrics,
    period,
    loading,
    error,
    lastUpdated,
    model: {
      commissionRate,
      serviceFeePerTicket,
    },
    actions: {
      setPeriod,
      refresh: fetchData,
      updateCommissionRate,
      updateServiceFee,
    },
  };
}
