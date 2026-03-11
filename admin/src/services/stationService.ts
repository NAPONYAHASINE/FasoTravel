/**
 * Service Gares/Stations FasoTravel Admin
 * Backend-ready: Mock service qui peut être facilement remplacé par de vrais appels API
 * Version 2.0 - Données mock depuis adminMockData.ts (ZÉRO Math.random)
 * 
 * RESPONSABILITÉS:
 * - Statistiques de ventes par gare
 * - Statistiques globales
 */

import { AppConfig } from '../config/app.config';
import { apiService } from './apiService';
import type { Station } from '../types';
import {
  MOCK_STATION_STATS,
  MOCK_GLOBAL_STATION_STATS,
  type MockStationStats,
  type MockGlobalStationStats,
} from '../lib/adminMockData';

// ============================================================================
// TYPES (réexportés pour compatibilité)
// ============================================================================

export type StationStats = MockStationStats;
export type GlobalStationStats = MockGlobalStationStats;

// ============================================================================
// SERVICE API (MOCKABLE)
// ============================================================================

class StationService {
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
   * Récupère les statistiques de toutes les gares
   * 
   * MODE MOCK: Lit les données pré-calculées depuis adminMockData.ts
   * MODE PRODUCTION: Appelle GET /api/admin/stations/stats
   */
  async getAllStationStats(stations: Station[]): Promise<StationStats[]> {
    if (AppConfig.isMock) {
      await this.simulateNetworkDelay();
      
      // Filtrer les stats pour ne retourner que celles des stations existantes
      const stationIds = new Set(stations.map(s => s.id));
      const filteredStats = MOCK_STATION_STATS.filter(s => stationIds.has(s.station_id));
      
      console.log('🧪 [StationService] Mock stats loaded:', filteredStats.length);
      
      return filteredStats;
    }
    
    const response = await apiService.get<StationStats[]>('/admin/stations/stats');
    
    if (!response.success) {
      throw new Error(response.error || 'Erreur lors de la récupération des statistiques des gares');
    }
    
    return response.data;
  }
  
  /**
   * Récupère les statistiques globales
   * 
   * MODE MOCK: Lit depuis adminMockData.ts
   * MODE PRODUCTION: Appelle GET /api/admin/stations/global-stats
   */
  async getGlobalStationStats(stations: Station[]): Promise<GlobalStationStats> {
    if (AppConfig.isMock) {
      await this.simulateNetworkDelay();
      return MOCK_GLOBAL_STATION_STATS;
    }
    
    const response = await apiService.get<GlobalStationStats>('/admin/stations/global-stats');
    
    if (!response.success) {
      throw new Error(response.error || 'Erreur lors de la récupération des statistiques globales');
    }
    
    return response.data;
  }
  
  /**
   * Récupère les statistiques d'une gare spécifique
   */
  async getStationStats(stationId: string, stations: Station[]): Promise<StationStats | null> {
    if (AppConfig.isMock) {
      await this.simulateNetworkDelay();
      return MOCK_STATION_STATS.find(s => s.station_id === stationId) || null;
    }
    
    const response = await apiService.get<StationStats>(`/admin/stations/${stationId}/stats`);
    
    if (!response.success) {
      return null;
    }
    
    return response.data;
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const stationService = new StationService();

// Pour debug/tests
if (typeof window !== 'undefined' && AppConfig.isMock) {
  (window as any).stationService = stationService;
}
