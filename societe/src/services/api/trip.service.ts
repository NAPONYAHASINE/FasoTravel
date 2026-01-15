/**
 * Service API pour la gestion des départs (Trips)
 */

import { isLocalMode, API_ENDPOINTS } from '../config';
import { apiClient } from './apiClient';
import { storageService } from '../storage/localStorage.service';
import { logger } from '../../utils/logger';
import { generateId } from '../../utils/formatters';
import type { Trip } from '../../contexts/DataContext';
import type { CreateTripDto, UpdateTripDto, TripFilters, GenerateTripsDto } from '../types';

class TripService {
  async create(data: CreateTripDto): Promise<Trip> {
    logger.info('🚌 Création départ', { route: data.routeId, date: data.departureDate });

    if (isLocalMode()) {
      const newTrip: Trip = {
        ...data,
        id: generateId(),
        status: 'scheduled',
        availableSeats: data.totalSeats,
      };

      const trips = storageService.get<Trip[]>('trips') || [];
      trips.push(newTrip);
      storageService.set('trips', trips);

      logger.success('✅ Départ créé (local)', { id: newTrip.id });
      return newTrip;
    } else {
      return await apiClient.post<Trip>(API_ENDPOINTS.trips, data);
    }
  }

  async list(filters?: TripFilters): Promise<Trip[]> {
    if (isLocalMode()) {
      let trips = storageService.get<Trip[]>('trips') || [];

      if (filters) {
        if (filters.routeId) trips = trips.filter(t => t.routeId === filters.routeId);
        if (filters.gareId) trips = trips.filter(t => t.gareId === filters.gareId);
        if (filters.status) trips = trips.filter(t => t.status === filters.status);
        if (filters.dateFrom) trips = trips.filter(t => t.departureDate >= filters.dateFrom!);
        if (filters.dateTo) trips = trips.filter(t => t.departureDate <= filters.dateTo!);
      }

      return trips;
    } else {
      const params = new URLSearchParams(filters as any);
      return await apiClient.get<Trip[]>(`${API_ENDPOINTS.trips}?${params}`);
    }
  }

  async getById(id: string): Promise<Trip | null> {
    if (isLocalMode()) {
      const trips = storageService.get<Trip[]>('trips') || [];
      return trips.find(t => t.id === id) || null;
    } else {
      try {
        return await apiClient.get<Trip>(`${API_ENDPOINTS.trips}/${id}`);
      } catch {
        return null;
      }
    }
  }

  async update(id: string, data: UpdateTripDto): Promise<Trip> {
    if (isLocalMode()) {
      const trips = storageService.get<Trip[]>('trips') || [];
      const index = trips.findIndex(t => t.id === id);

      if (index === -1) throw new Error('Départ introuvable');

      trips[index] = { ...trips[index], ...data };
      storageService.set('trips', trips);

      return trips[index];
    } else {
      return await apiClient.put<Trip>(`${API_ENDPOINTS.trips}/${id}`, data);
    }
  }

  async delete(id: string): Promise<void> {
    if (isLocalMode()) {
      const trips = storageService.get<Trip[]>('trips') || [];
      const filtered = trips.filter(t => t.id !== id);
      storageService.set('trips', filtered);
      logger.info('🗑️ Départ supprimé (local)', { id });
    } else {
      await apiClient.delete(`${API_ENDPOINTS.trips}/${id}`);
    }
  }

  async generateFromTemplates(data: GenerateTripsDto): Promise<Trip[]> {
    logger.info('⚙️ Génération départs automatiques', { days: data.daysCount });

    if (isLocalMode()) {
      // En mode local, on génère depuis les templates du contexte
      // Cette logique est déjà implémentée dans DataContext
      logger.warn('Génération en local via DataContext');
      return [];
    } else {
      return await apiClient.post<Trip[]>(API_ENDPOINTS.tripsGenerate, data);
    }
  }
}

export const tripService = new TripService();