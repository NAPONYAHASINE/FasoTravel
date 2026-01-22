/**
 * Vehicle Service - TransportBF Mobile
 * 
 * Gère:
 * - Localisation du véhicule (real-time tracking)
 * - Détails du véhicule
 * 
 * ✅ Dual-mode
 */

import { apiClient } from './apiClient';
import { API_ENDPOINTS, isDevelopment } from '../config';
import type { VehicleLocation } from '../types';

class VehicleService {
  /**
   * Récupère la localisation en temps réel du véhicule
   */
  async getVehicleLocation(tripId: string): Promise<VehicleLocation> {
    if (isDevelopment()) {
      return this.mockGetVehicleLocation(tripId);
    }

    return apiClient.get<VehicleLocation>(
      API_ENDPOINTS.vehicle.location(tripId)
    );
  }

  /**
   * Subscribe à la localisation en temps réel (WebSocket/Server-Sent Events)
   */
  onVehicleLocationUpdate(
    tripId: string,
    callback: (location: VehicleLocation) => void
  ): () => void {
    if (isDevelopment()) {
      const interval = setInterval(() => {
        callback(this.mockGetVehicleLocation(tripId));
      }, 5000);

      return () => clearInterval(interval);
    }

    // TODO: Implémenter WebSocket ou SSE
    return () => {};
  }

  // ============================================
  // MOCK DATA
  // ============================================

  private mockGetVehicleLocation(tripId: string): VehicleLocation {
    // Simuler une position qui bouge légèrement
    const seed = parseInt(tripId.slice(-4), 16);
    const baseLat = 12.3656;
    const baseLon = -1.5197;

    return {
      tripId,
      latitude: baseLat + (Math.sin(seed * 123) * 0.1),
      longitude: baseLon + (Math.cos(seed * 456) * 0.1),
      accuracy: 50,
      heading: Math.random() * 360,
      speed: Math.random() * 120,
      timestamp: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

export const vehicleService = new VehicleService();
