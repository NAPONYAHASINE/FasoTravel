/**
 * Service API pour la gestion des gares (Stations)
 */

import { isLocalMode, API_ENDPOINTS } from '../config';
import { apiClient } from './apiClient';
import { storageService } from '../storage/localStorage.service';
import { logger } from '../../utils/logger';
import { generateId } from '../../utils/formatters';
import type { Station } from '../../contexts/DataContext';
import type { CreateStationDto, UpdateStationDto } from '../types';

class StationService {
  async create(data: CreateStationDto): Promise<Station> {
    logger.info('🏢 Création gare', { name: data.name, city: data.city });

    if (isLocalMode()) {
      const newStation: Station = {
        ...data,
        id: generateId(),
      };

      const stations = storageService.get<Station[]>('stations') || [];
      stations.push(newStation);
      storageService.set('stations', stations);

      logger.success('✅ Gare créée (local)', { id: newStation.id });
      return newStation;
    } else {
      return await apiClient.post<Station>(API_ENDPOINTS.stations, data);
    }
  }

  async list(): Promise<Station[]> {
    if (isLocalMode()) {
      return storageService.get<Station[]>('stations') || [];
    } else {
      return await apiClient.get<Station[]>(API_ENDPOINTS.stations);
    }
  }

  async getById(id: string): Promise<Station | null> {
    if (isLocalMode()) {
      const stations = storageService.get<Station[]>('stations') || [];
      return stations.find(s => s.id === id) || null;
    } else {
      try {
        return await apiClient.get<Station>(`${API_ENDPOINTS.stations}/${id}`);
      } catch {
        return null;
      }
    }
  }

  async update(id: string, data: UpdateStationDto): Promise<Station> {
    if (isLocalMode()) {
      const stations = storageService.get<Station[]>('stations') || [];
      const index = stations.findIndex(s => s.id === id);

      if (index === -1) throw new Error('Gare introuvable');

      stations[index] = { ...stations[index], ...data };
      storageService.set('stations', stations);

      logger.success('✅ Gare mise à jour (local)', { id });
      return stations[index];
    } else {
      return await apiClient.put<Station>(`${API_ENDPOINTS.stations}/${id}`, data);
    }
  }

  async delete(id: string): Promise<void> {
    if (isLocalMode()) {
      const stations = storageService.get<Station[]>('stations') || [];
      const filtered = stations.filter(s => s.id !== id);
      storageService.set('stations', filtered);
      logger.info('🗑️ Gare supprimée (local)', { id });
    } else {
      await apiClient.delete(`${API_ENDPOINTS.stations}/${id}`);
    }
  }
}

export const stationService = new StationService();