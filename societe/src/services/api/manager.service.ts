/**
 * Service API pour la gestion des managers
 */

import { isDevelopment } from '../../shared/config/deployment';
import { API_ENDPOINTS } from '../config';
import { apiClient } from './apiClient';
import { storageService } from '../storage/localStorage.service';
import { logger } from '../../utils/logger';
import { generateId } from '../../utils/formatters';
import type { Manager } from '../../contexts/DataContext';
import type { CreateManagerDto, UpdateManagerDto } from '../types';

class ManagerService {
  async create(data: CreateManagerDto): Promise<Manager> {
    logger.info('👤 Création manager', { name: data.name, gare: data.gareName });

    if (isDevelopment()) {
      const newManager: Manager = {
        ...data,
        id: generateId(),
        joinedDate: new Date().toISOString().split('T')[0],
      };

      const managers = (storageService.get('managers') as any as Manager[]) || [];
      managers.push(newManager);
      (storageService.set as any)('managers', managers);

      logger.info('✅ Manager créé (local)', { id: newManager.id });
      return newManager;
    } else {
      return await apiClient.post<Manager>(API_ENDPOINTS.managers, data);
    }
  }

  async list(): Promise<Manager[]> {
    if (isDevelopment()) {
      return (storageService.get('managers') as any as Manager[]) || [];
    } else {
      return await apiClient.get<Manager[]>(API_ENDPOINTS.managers);
    }
  }

  async getById(id: string): Promise<Manager | null> {
    if (isDevelopment()) {
      const managers = (storageService.get('managers') as any as Manager[]) || [];
      return managers.find(m => m.id === id) || null;
    } else {
      try {
        return await apiClient.get<Manager>(`${API_ENDPOINTS.managers}/${id}`);
      } catch {
        return null;
      }
    }
  }

  async update(id: string, data: UpdateManagerDto): Promise<Manager> {
    if (isDevelopment()) {
      const managers = (storageService.get('managers') as any as Manager[]) || [];
      const index = managers.findIndex(m => m.id === id);

      if (index === -1) throw new Error('Manager introuvable');

      managers[index] = { ...managers[index], ...data };
      (storageService.set as any)('managers', managers);

      logger.info('✅ Manager mis à jour (local)', { id });
      return managers[index];
    } else {
      return await apiClient.put<Manager>(`${API_ENDPOINTS.managers}/${id}`, data);
    }
  }

  async delete(id: string): Promise<void> {
    if (isDevelopment()) {
      const managers = (storageService.get('managers') as any as Manager[]) || [];
      const filtered = managers.filter(m => m.id !== id);
      (storageService.set as any)('managers', filtered);
      logger.info('🗑️ Manager supprimé (local)', { id });
    } else {
      await apiClient.delete(`${API_ENDPOINTS.managers}/${id}`);
    }
  }
}

export const managerService = new ManagerService();