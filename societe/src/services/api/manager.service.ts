/**
 * Service API pour la gestion des managers
 */

import { isLocalMode, API_ENDPOINTS } from '../config';
import { apiClient } from './apiClient';
import { storageService } from '../storage/localStorage.service';
import { logger } from '../../utils/logger';
import { generateId } from '../../utils/formatters';
import type { Manager } from '../../contexts/DataContext';
import type { CreateManagerDto, UpdateManagerDto } from '../types';

class ManagerService {
  async create(data: CreateManagerDto): Promise<Manager> {
    logger.info('👤 Création manager', { name: data.name, gare: data.gareName });

    if (isLocalMode()) {
      const newManager: Manager = {
        ...data,
        id: generateId(),
        joinedDate: new Date().toISOString().split('T')[0],
      };

      const managers = storageService.get<Manager[]>('managers') || [];
      managers.push(newManager);
      storageService.set('managers', managers);

      logger.success('✅ Manager créé (local)', { id: newManager.id });
      return newManager;
    } else {
      return await apiClient.post<Manager>(API_ENDPOINTS.managers, data);
    }
  }

  async list(): Promise<Manager[]> {
    if (isLocalMode()) {
      return storageService.get<Manager[]>('managers') || [];
    } else {
      return await apiClient.get<Manager[]>(API_ENDPOINTS.managers);
    }
  }

  async getById(id: string): Promise<Manager | null> {
    if (isLocalMode()) {
      const managers = storageService.get<Manager[]>('managers') || [];
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
    if (isLocalMode()) {
      const managers = storageService.get<Manager[]>('managers') || [];
      const index = managers.findIndex(m => m.id === id);

      if (index === -1) throw new Error('Manager introuvable');

      managers[index] = { ...managers[index], ...data };
      storageService.set('managers', managers);

      logger.success('✅ Manager mis à jour (local)', { id });
      return managers[index];
    } else {
      return await apiClient.put<Manager>(`${API_ENDPOINTS.managers}/${id}`, data);
    }
  }

  async delete(id: string): Promise<void> {
    if (isLocalMode()) {
      const managers = storageService.get<Manager[]>('managers') || [];
      const filtered = managers.filter(m => m.id !== id);
      storageService.set('managers', filtered);
      logger.info('🗑️ Manager supprimé (local)', { id });
    } else {
      await apiClient.delete(`${API_ENDPOINTS.managers}/${id}`);
    }
  }
}

export const managerService = new ManagerService();