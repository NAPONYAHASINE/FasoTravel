/**
 * Service Trajets FasoTravel Admin
 * Backend-ready: Mock service qui peut être facilement remplacé par de vrais appels API
 * Version 2.0 - Utilise DONNÉES CENTRALISÉES depuis adminMockData.ts
 * 
 * RESPONSABILITÉS:
 * - Supervision des trajets (lecture seule pour Admin)
 * - Statistiques globales et par société
 * - UTILISE les données mock centralisées (pas de génération)
 * 
 * NOTE: L'Admin NE GÈRE PAS les trajets directement (c'est la responsabilité de l'app Société)
 */

import { AppConfig } from '../config/app.config';
import { apiService } from './apiService';
import { TransportCompany } from '../shared/types/standardized';
import { 
  MOCK_COMPANY_TRIP_SUMMARIES, 
  MOCK_GLOBAL_TRIP_STATS,
  type CompanyTripSummary,
  type GlobalTripStats
} from '../lib/adminMockData';

// ============================================================================
// TYPES (réexportés depuis adminMockData pour compatibilité)
// ============================================================================

export type { CompanyTripSummary, GlobalTripStats };

export type TripStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';

// Compatibilité avec l'ancien type TripGlobalStats
export interface TripGlobalStats {
  totalActiveTrips: number;
  totalScheduledTrips: number;
  totalCompletedToday: number;
  totalCancelledToday: number;
  totalSeats: number;
  occupiedSeats: number;
  availableSeats: number;
  globalOccupancy: number;
  avgRevenue: number;
  totalRevenueToday: number;
}

// ============================================================================
// HELPERS POUR CONVERTIR LES DONNÉES
// ============================================================================

/**
 * Convertit GlobalTripStats vers TripGlobalStats (compatibilité)
 */
function convertGlobalStats(stats: GlobalTripStats): TripGlobalStats {
  // Calcul des valeurs manquantes basé sur les données existantes
  const totalSeats = Math.round(stats.totalActiveTrips * 40); // 40 sièges/bus en moyenne
  const occupiedSeats = Math.round(totalSeats * (stats.avgOccupancyRate / 100));
  const availableSeats = totalSeats - occupiedSeats;
  
  return {
    totalActiveTrips: stats.totalActiveTrips,
    totalScheduledTrips: 0, // Non disponible dans les nouvelles stats
    totalCompletedToday: stats.totalCompletedToday,
    totalCancelledToday: stats.totalCancelledToday,
    totalSeats,
    occupiedSeats,
    availableSeats,
    globalOccupancy: stats.avgOccupancyRate,
    avgRevenue: 0, // Calculé à partir des summaries si besoin
    totalRevenueToday: stats.totalRevenueToday,
  };
}

// ============================================================================
// SERVICE API (MOCKABLE)
// ============================================================================

class TripService {
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
   * Récupère le résumé des trajets par société
   * 
   * MODE MOCK: Utilise MOCK_COMPANY_TRIP_SUMMARIES (données centralisées)
   * MODE PRODUCTION: Appelle GET /api/admin/trips/summary
   */
  async getCompanyTripSummaries(companies: TransportCompany[]): Promise<CompanyTripSummary[]> {
    if (AppConfig.isMock) {
      await this.simulateNetworkDelay();
      
      // ✅ UTILISE LES DONNÉES CENTRALISÉES
      console.log('🧪 [TripService] Using centralized mock data:', MOCK_COMPANY_TRIP_SUMMARIES.length);
      
      return MOCK_COMPANY_TRIP_SUMMARIES;
    }
    
    const response = await apiService.get<CompanyTripSummary[]>('/admin/trips/summary');
    
    if (!response.success) {
      throw new Error(response.error || 'Erreur lors de la récupération des résumés de trajets');
    }
    
    return response.data;
  }
  
  /**
   * Récupère les statistiques globales des trajets
   * 
   * MODE MOCK: Utilise MOCK_GLOBAL_TRIP_STATS (données centralisées)
   * MODE PRODUCTION: Appelle GET /api/admin/trips/stats
   */
  async getGlobalTripStats(companies: TransportCompany[]): Promise<TripGlobalStats> {
    if (AppConfig.isMock) {
      await this.simulateNetworkDelay();
      
      // ✅ UTILISE LES DONNÉES CENTRALISÉES
      console.log('🧪 [TripService] Using centralized global stats');
      
      return convertGlobalStats(MOCK_GLOBAL_TRIP_STATS);
    }
    
    const response = await apiService.get<TripGlobalStats>('/admin/trips/stats');
    
    if (!response.success) {
      throw new Error(response.error || 'Erreur lors de la récupération des statistiques');
    }
    
    return response.data;
  }
  
  /**
   * Récupère le résumé pour une société spécifique
   */
  async getCompanyTripSummary(companyId: string, companies: TransportCompany[]): Promise<CompanyTripSummary | null> {
    if (AppConfig.isMock) {
      await this.simulateNetworkDelay();
      
      // ✅ UTILISE LES DONNÉES CENTRALISÉES
      const summary = MOCK_COMPANY_TRIP_SUMMARIES.find(s => s.company_id === companyId);
      
      if (!summary) {
        console.warn(`⚠️ [TripService] No summary found for company ${companyId}`);
        return null;
      }
      
      return summary;
    }
    
    const response = await apiService.get<CompanyTripSummary>(`/admin/trips/summary/${companyId}`);
    
    if (!response.success) {
      return null;
    }
    
    return response.data;
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const tripService = new TripService();

// Pour debug/tests
if (typeof window !== 'undefined' && AppConfig.isMock) {
  (window as any).tripService = tripService;
}
