/**
 * Trip Service - TransportBF Mobile
 * 
 * Gère:
 * - Rechercher trajets
 * - Récupérer détails trajet
 * 
 * ✅ Dual-mode (DEV mock / PROD backend)
 * 🔴 ZÉRO données mock ici - tout vient de models.ts
 */

import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../config';
import { MOCK_TRIPS } from '../../data/models';
import type { Trip, TripSearchParams } from '../types';
import { isDevelopment } from '../../shared/config/deployment';

// Map models.ts Trip (snake_case) to services Trip (camelCase)
function mapTripFromModel(modelTrip: any): Trip {
  return {
    id: modelTrip.trip_id,
    operatorId: modelTrip.operator_id,
    operatorName: modelTrip.operator_name,
    operatorLogo: modelTrip.operator_logo,
    vehicleType: modelTrip.vehicle_type,
    departureTime: modelTrip.departure_time,
    arrivalTime: modelTrip.arrival_time,
    durationMinutes: modelTrip.duration_minutes,
    basePrice: modelTrip.base_price,
    fromStationId: modelTrip.from_stop_id,
    toStationId: modelTrip.to_stop_id,
    fromStationName: modelTrip.from_stop_name,
    toStationName: modelTrip.to_stop_name,
    segments: modelTrip.segments.map((seg: any) => ({
      id: seg.segment_id,
      fromStationId: seg.from_stop_id,
      toStationId: seg.to_stop_id,
      fromStationName: seg.from_stop_name,
      toStationName: seg.to_stop_name,
      departureTime: seg.departure_time,
      arrivalTime: seg.arrival_time,
      distanceKm: seg.distance_km,
      availableSeats: seg.available_seats,
      totalSeats: seg.total_seats
    })),
    amenities: modelTrip.amenities,
    hasLiveTracking: modelTrip.has_live_tracking,
    availableSeats: modelTrip.available_seats,
    totalSeats: modelTrip.total_seats,
    status: 'SCHEDULED', // Mock status
    createdAt: new Date().toISOString()
  };
}

class TripService {
  /**
   * Recherche des trajets selon les paramètres
   */
  async searchTrips(params: Partial<TripSearchParams>): Promise<Trip[]> {
    if (isDevelopment()) {
      // Map mock data from models.ts and filter
      let filtered = MOCK_TRIPS.map(mapTripFromModel);
      
      if (params.fromStationId) {
        filtered = filtered.filter(t => t.fromStationId === params.fromStationId);
      }
      if (params.toStationId) {
        filtered = filtered.filter(t => t.toStationId === params.toStationId);
      }
      if (params.departureDate) {
        // Filter by date (YYYY-MM-DD)
        filtered = filtered.filter(t => t.departureTime.startsWith(params.departureDate!));
      }
      if (params.numPassengers) {
        filtered = filtered.filter(t => t.availableSeats >= params.numPassengers!);
      }
      
      return filtered;
    }

    // PRODUCTION: Call backend API
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, String(value));
    });

    return apiClient.get<Trip[]>(`${API_ENDPOINTS.trips.search}?${queryParams}`);
  }

  /**
   * Récupère un trajet par ID
   */
  async getTripById(tripId: string): Promise<Trip> {
    if (isDevelopment()) {
      const trips = await this.searchTrips({});
      const trip = trips.find(t => t.id === tripId);
      if (!trip) throw new Error('Trip not found');
      return trip;
    }

    return apiClient.get<Trip>(API_ENDPOINTS.trips.detail(tripId));
  }
}

export const tripService = new TripService();
