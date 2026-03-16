/**
 * Service Analytics Plateforme FasoTravel Admin
 * Backend-ready: Mock service qui peut être facilement remplacé par de vrais appels API
 * Version 2.0 - Données mock depuis adminMockData.ts (ZÉRO Math.random)
 * 
 * RESPONSABILITÉS:
 * - Évolution des inscriptions (sociétés, passagers)
 * - Activité des stations (départs, arrivées)
 * - Métriques plateforme non-financières
 */

import { AppConfig } from '../config/app.config';
import { apiService } from './apiService';
import { TransportCompany, PassengerUser, Station } from '../shared/types/standardized';
import {
  MOCK_WEEKLY_REGISTRATIONS,
  MOCK_STATION_ACTIVITIES,
  MOCK_ADMIN_DASHBOARD_STATS,
  type MockWeeklyRegistration,
  type MockStationActivity,
} from '../lib/adminMockData';
import type { DashboardStats } from '../shared/types/standardized';

// ============================================================================
// TYPES (réexportés pour compatibilité)
// ============================================================================

export type WeeklyRegistration = MockWeeklyRegistration;
export type StationActivity = MockStationActivity;

export interface PlatformGrowthMetrics {
  weeklyRegistrations: WeeklyRegistration[];
  stationActivities: StationActivity[];
  totalCompanies: number;
  totalPassengers: number;
  activeCompanies: number;
  activePassengers: number;
  verifiedPassengers: number;
  pendingCompanies: number;
  growthRate: {
    companies: number;
    passengers: number;
  };
}

// ============================================================================
// SERVICE API (MOCKABLE)
// ============================================================================

class PlatformAnalyticsService {
  private mockDelay: number = 400;
  
  setMockDelay(delay: number) {
    this.mockDelay = delay;
  }
  
  private async simulateNetworkDelay(): Promise<void> {
    if (AppConfig.isMock && this.mockDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.mockDelay));
    }
  }
  
  /**
   * Récupère les métriques de croissance plateforme
   * 
   * MODE MOCK: Lit depuis adminMockData.ts + calcule à partir des entités existantes
   * MODE PRODUCTION: Appelle GET /api/admin/analytics/platform
   */
  async getPlatformGrowthMetrics(
    companies: TransportCompany[],
    passengers: PassengerUser[],
    _stations: Station[]
  ): Promise<PlatformGrowthMetrics> {
    if (AppConfig.isMock) {
      await this.simulateNetworkDelay();
      
      return {
        weeklyRegistrations: MOCK_WEEKLY_REGISTRATIONS,
        stationActivities: MOCK_STATION_ACTIVITIES,
        totalCompanies: companies.length,
        totalPassengers: passengers.length,
        activeCompanies: companies.filter(c => c.status === 'active').length,
        activePassengers: passengers.filter(p => p.status === 'active').length,
        verifiedPassengers: passengers.filter(p => p.phoneVerified || p.emailVerified).length,
        pendingCompanies: 0, // No pending status - admin creates all companies directly
        growthRate: {
          companies: 8.5,
          passengers: 12.3,
        },
      };
    }
    
    // MODE PRODUCTION: Appel API réel
    const response = await apiService.get<PlatformGrowthMetrics>('/admin/analytics/platform', {
      params: {
        period: 'week',
        includeStations: true,
      },
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Erreur lors de la récupération des analytics');
    }
    
    return response.data!;
  }
  
  /**
   * Récupère uniquement les inscriptions hebdomadaires
   */
  async getWeeklyRegistrations(
    _companies: TransportCompany[],
    _passengers: PassengerUser[]
  ): Promise<WeeklyRegistration[]> {
    if (AppConfig.isMock) {
      await this.simulateNetworkDelay();
      return MOCK_WEEKLY_REGISTRATIONS;
    }
    
    const response = await apiService.get<WeeklyRegistration[]>('/admin/analytics/registrations', {
      params: { period: 'week' },
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Erreur lors de la récupération des inscriptions');
    }
    
    return response.data!;
  }
  
  /**
   * Récupère uniquement l'activité des stations
   */
  async getStationActivities(_stations: Station[]): Promise<StationActivity[]> {
    if (AppConfig.isMock) {
      await this.simulateNetworkDelay();
      return MOCK_STATION_ACTIVITIES;
    }
    
    const response = await apiService.get<StationActivity[]>('/admin/analytics/stations/activity', {
      params: { limit: 5 },
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Erreur lors de la récupération de l\'activité des stations');
    }
    
    return response.data!;
  }

  /**
   * Récupère les stats globales du dashboard
   * 
   * MODE MOCK: Retourne MOCK_ADMIN_DASHBOARD_STATS
   * MODE PRODUCTION: Appelle GET /api/admin/dashboard/stats
   */
  async getDashboardStats(): Promise<DashboardStats> {
    if (AppConfig.isMock) {
      await this.simulateNetworkDelay();
      return { ...MOCK_ADMIN_DASHBOARD_STATS };
    }

    const response = await apiService.get<DashboardStats>('/admin/dashboard/stats');
    if (!response.success) {
      throw new Error(response.error || 'Erreur lors de la récupération des stats dashboard');
    }
    return response.data!;
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const platformAnalyticsService = new PlatformAnalyticsService();

// Pour debug/tests
if (typeof window !== 'undefined' && AppConfig.isMock) {
  (window as any).platformAnalyticsService = platformAnalyticsService;
}