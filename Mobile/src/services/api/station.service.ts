/**
 * Station Service - TransportBF Mobile
 * 
 * Gère:
 * - Récupérer stations (gares)
 * - Détails station
 * - Stations proches (par géolocation)
 * 
 * ✅ Dual-mode
 */

import { apiClient } from './apiClient';
import { API_ENDPOINTS, isDevelopment } from '../config';
import type { Station, NearbyStationsParams } from '../types';

class StationService {
  /**
   * Récupère la liste des stations
   */
  async getStations(limit: number = 50): Promise<Station[]> {
    if (isDevelopment()) {
      return this.mockGetStations(limit);
    }

    return apiClient.get<Station[]>(API_ENDPOINTS.stations.list);
  }

  /**
   * Récupère les détails d'une station
   */
  async getStation(stationId: string): Promise<Station> {
    if (isDevelopment()) {
      const stations = this.mockGetStations();
      const station = stations.find(s => s.id === stationId);
      if (!station) throw new Error(`Station ${stationId} not found`);
      return station;
    }

    return apiClient.get<Station>(API_ENDPOINTS.stations.detail(stationId));
  }

  /**
   * Récupère les stations proches (géolocation)
   */
  async getNearbyStations(params: NearbyStationsParams): Promise<Station[]> {
    if (isDevelopment()) {
      return this.mockGetNearbyStations(params);
    }

    return apiClient.get<Station[]>(
      API_ENDPOINTS.stations.nearby
    );
  }

  // ============================================
  // MOCK DATA
  // ============================================

  private mockGetStations(limit: number = 50): Station[] {
    const stations: Station[] = [
      {
        id: 'station_1',
        name: 'Gare Routière Centrale',
        city: 'Ouagadougou',
        latitude: 12.3656,
        longitude: -1.5197,
        address: 'Avenue de la Paix, Ouagadougou',
        operatingHours: '05:00 - 23:00',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'station_2',
        name: 'Gare Bobo-Dioulasso',
        city: 'Bobo-Dioulasso',
        latitude: 12.1652,
        longitude: -4.2889,
        address: 'Route de Koudougou',
        operatingHours: '06:00 - 22:00',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'station_3',
        name: 'Gare Koudougou',
        city: 'Koudougou',
        latitude: 12.2539,
        longitude: -2.4010,
        address: 'Rue Principale',
        operatingHours: '06:00 - 21:00',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'station_4',
        name: 'Gare Ouahigouya',
        city: 'Ouahigouya',
        latitude: 13.5734,
        longitude: -2.4270,
        address: 'Avenue Principale',
        operatingHours: '05:00 - 20:00',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ];

    return stations.slice(0, limit);
  }

  private mockGetNearbyStations(params: NearbyStationsParams): Station[] {
    const allStations = this.mockGetStations();
    
    // Calculer distance simple (Haversine approximation)
    return allStations
      .map(station => ({
        ...station,
        distance: this.calculateDistance(
          params.latitude,
          params.longitude,
          station.latitude,
          station.longitude
        ),
      }))
      .filter(s => s.distance <= (params.radiusKm || 50))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10);
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

export const stationService = new StationService();
