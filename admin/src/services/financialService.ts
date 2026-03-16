/**
 * Service Financier FasoTravel Admin
 * Backend-ready: Mock service qui peut être facilement remplacé par de vrais appels API
 * Version 3.0 - ZÉRO Math.random — Toutes les données viennent de adminMockData.ts
 */

import { AppConfig } from '../config/app.config';
import { apiService } from './apiService';
import {
  FinancialDashboardMetrics,
  FinancialMetricsRequest,
  FinancialMetricsResponse,
  PaymentMethod,
  PaymentMethodStats,
  RevenueCategory,
  TimePeriod,
  DailyRevenue,
  CompanyRevenue,
} from '../types/financial';
import {
  MOCK_DAILY_REVENUE_BY_PERIOD,
  MOCK_PAYMENT_METHOD_STATS,
  MOCK_TOP_COMPANIES_REVENUE,
} from '../lib/adminMockData';

// ============================================================================
// SERVICE API (MOCKABLE)
// ============================================================================

class FinancialService {
  private mockDelay: number = 300; // Simule latence réseau

  /**
   * Active/désactive le délai de simulation réseau
   */
  setMockDelay(delay: number) {
    this.mockDelay = delay;
  }

  /**
   * Simule un appel réseau avec délai
   */
  private async simulateNetworkCall<T>(data: T): Promise<T> {
    if (this.mockDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.mockDelay));
    }
    return data;
  }

  /**
   * Récupère les DailyRevenue depuis les données mock statiques
   */
  private getMockDailyRevenue(period: TimePeriod): DailyRevenue[] {
    const data = MOCK_DAILY_REVENUE_BY_PERIOD[period];
    if (!data) return MOCK_DAILY_REVENUE_BY_PERIOD[TimePeriod.WEEK];
    // Deep copy pour éviter les mutations
    return data.map(d => ({ ...d, date: new Date(d.date) }));
  }

  /**
   * Récupère les PaymentMethodStats depuis les données mock statiques
   */
  private getMockPaymentMethodStats(
    totalTransactions: number,
    totalRevenue: number
  ): PaymentMethodStats[] {
    // On scale proportionnellement au total réel de la période
    const baseTotalTx = MOCK_PAYMENT_METHOD_STATS.reduce((s, m) => s + m.transactionCount, 0);
    const baseTotalRev = MOCK_PAYMENT_METHOD_STATS.reduce((s, m) => s + m.totalAmount, 0);
    const txRatio = totalTransactions / baseTotalTx;
    const revRatio = totalRevenue / baseTotalRev;

    return MOCK_PAYMENT_METHOD_STATS.map(pm => ({
      ...pm,
      transactionCount: Math.floor(pm.transactionCount * txRatio),
      totalAmount: Math.floor(pm.totalAmount * revRatio),
      averageAmount: Math.floor((pm.totalAmount * revRatio) / Math.max(1, Math.floor(pm.transactionCount * txRatio))),
    }));
  }

  /**
   * Récupère le top compagnies depuis les données mock statiques
   */
  private getMockTopCompanies(): CompanyRevenue[] {
    return MOCK_TOP_COMPANIES_REVENUE.map(c => ({ ...c }));
  }

  /**
   * MÉTHODE PRINCIPALE: Récupère toutes les métriques financières
   * 
   * Backend: Remplacer par un vrai appel API
   * Exemple: return await apiService.get('/admin/financial/metrics', request)
   */
  async getFinancialMetrics(
    request: FinancialMetricsRequest,
    _companies?: any[]
  ): Promise<FinancialMetricsResponse> {
    try {
      // === MODE PRODUCTION ===
      if (!AppConfig.isMock) {
        const response = await apiService.get('/admin/financial/metrics', request);
        return response as FinancialMetricsResponse;
      }

      // === MODE MOCK ===
      const { period = TimePeriod.WEEK } = request;
      const commissionRate = 8; // 8%
      const successRate = 97.3;
      const growthRate = 12.5;

      const dailyRevenue = this.getMockDailyRevenue(period);
      const totalRevenue = dailyRevenue.reduce((sum, day) => sum + day.revenue, 0);
      const totalTransactions = dailyRevenue.reduce((sum, day) => sum + day.transactionCount, 0);

      // Calcul de la période précédente (pour comparaison)
      const previousRevenue = Math.floor(totalRevenue / (1 + growthRate / 100));

      const platformCommission = Math.floor(totalRevenue * (commissionRate / 100));
      const avgTransaction = Math.floor(totalRevenue / Math.max(1, totalTransactions));

      const paymentMethods = this.getMockPaymentMethodStats(totalTransactions, totalRevenue);
      const topCompanies = this.getMockTopCompanies();

      const successCount = Math.floor(totalTransactions * (successRate / 100));
      const failedCount = totalTransactions - successCount;

      const metrics: FinancialDashboardMetrics = {
        revenue: {
          totalRevenue,
          periodRevenue: totalRevenue,
          previousPeriodRevenue: previousRevenue,
          growthRate,
          platformCommission,
          commissionRate,
          byCategory: {
            [RevenueCategory.BOOKING_COMMISSION]: Math.floor(platformCommission * 0.85),
            [RevenueCategory.PLATFORM_FEE]: Math.floor(platformCommission * 0.10),
            [RevenueCategory.SUBSCRIPTION]: Math.floor(platformCommission * 0.03),
            [RevenueCategory.ADVERTISING]: Math.floor(platformCommission * 0.02),
          },
          byPaymentMethod: paymentMethods.reduce((acc, pm) => {
            acc[pm.method] = pm.totalAmount;
            return acc;
          }, {} as Record<PaymentMethod, number>),
          topCompanies: topCompanies.slice(0, 5),
        },
        transactions: {
          totalAmount: totalRevenue,
          totalCount: totalTransactions,
          successCount,
          failedCount,
          pendingCount: Math.floor(totalTransactions * 0.01), // 1% en attente
          refundedCount: Math.floor(totalTransactions * 0.005), // 0.5% remboursés
          successRate,
          averageAmount: avgTransaction,
        },
        dailyRevenue,
        paymentMethods,
        topCompaniesByRevenue: topCompanies,
        avgTransactionAmount: avgTransaction,
        pendingPayments: Math.floor(totalRevenue * 0.02), // 2% en attente
        processingFees: Math.floor(totalRevenue * 0.015), // 1.5% frais traitement
        netRevenue: platformCommission - Math.floor(totalRevenue * 0.015),
        period,
        startDate: dailyRevenue[0]?.date || new Date(),
        endDate: dailyRevenue[dailyRevenue.length - 1]?.date || new Date(),
        lastUpdated: new Date(),
        dataSource: 'mock',
      };

      const response: FinancialMetricsResponse = {
        success: true,
        data: metrics,
        message: 'Métriques financières récupérées avec succès',
      };

      return await this.simulateNetworkCall(response);
    } catch (error) {
      return {
        success: false,
        data: {} as FinancialDashboardMetrics,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Récupère uniquement les revenus journaliers (pour graphiques)
   * Backend: return await apiService.get(`/admin/financial/daily-revenue?period=${period}`)
   */
  async getDailyRevenue(period: TimePeriod): Promise<DailyRevenue[]> {
    if (!AppConfig.isMock) {
      const response = await apiService.get<DailyRevenue[]>(`/admin/financial/daily-revenue?period=${period}`);
      return response.data!;
    }
    const data = this.getMockDailyRevenue(period);
    return await this.simulateNetworkCall(data);
  }

  /**
   * Récupère les statistiques par méthode de paiement
   * Backend: return await apiService.get('/admin/financial/payment-methods')
   */
  async getPaymentMethodStats(): Promise<PaymentMethodStats[]> {
    if (!AppConfig.isMock) {
      const response = await apiService.get<PaymentMethodStats[]>('/admin/financial/payment-methods');
      return response.data!;
    }
    // Retourne les stats de base (non scalées)
    const data = MOCK_PAYMENT_METHOD_STATS.map(pm => ({ ...pm }));
    return await this.simulateNetworkCall(data);
  }

  /**
   * Récupère le classement des sociétés par revenus
   * Backend: return await apiService.get(`/admin/financial/top-companies?limit=${limit}`)
   */
  async getTopCompaniesByRevenue(_companies: any[], limit: number = 10): Promise<CompanyRevenue[]> {
    if (!AppConfig.isMock) {
      const response = await apiService.get<CompanyRevenue[]>(`/admin/financial/top-companies?limit=${limit}`);
      return response.data!;
    }
    const data = this.getMockTopCompanies().slice(0, limit);
    return await this.simulateNetworkCall(data);
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

/**
 * Instance singleton du service financier
 * 
 * Backend: Remplacer par:
 * export const financialService = new FinancialApiService(apiClient);
 */
export const financialService = new FinancialService();

// Export de la classe pour tests
export { FinancialService };
