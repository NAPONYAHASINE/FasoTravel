/**
 * Service API pour la gestion des caissiers
 */

import { isLocalMode, API_ENDPOINTS } from '../config';
import { apiClient } from './apiClient';
import { storageService } from '../storage/localStorage.service';
import { logger } from '../../utils/logger';
import { generateId } from '../../utils/formatters';
import type { Cashier } from '../../contexts/DataContext';
import type { CreateCashierDto, UpdateCashierDto } from '../types';

class CashierService {
  async create(data: CreateCashierDto): Promise<Cashier> {
    logger.info('👤 Création caissier', { name: data.name, gare: data.gareName });

    if (isLocalMode()) {
      const newCashier: Cashier = {
        ...data,
        id: generateId(),
        joinedDate: new Date().toISOString().split('T')[0],
      };

      const cashiers = storageService.get<Cashier[]>('cashiers') || [];
      cashiers.push(newCashier);
      storageService.set('cashiers', cashiers);

      logger.success('✅ Caissier créé (local)', { id: newCashier.id });
      return newCashier;
    } else {
      return await apiClient.post<Cashier>(API_ENDPOINTS.cashiers, data);
    }
  }

  async list(): Promise<Cashier[]> {
    if (isLocalMode()) {
      return storageService.get<Cashier[]>('cashiers') || [];
    } else {
      return await apiClient.get<Cashier[]>(API_ENDPOINTS.cashiers);
    }
  }

  async getById(id: string): Promise<Cashier | null> {
    if (isLocalMode()) {
      const cashiers = storageService.get<Cashier[]>('cashiers') || [];
      return cashiers.find(c => c.id === id) || null;
    } else {
      try {
        return await apiClient.get<Cashier>(`${API_ENDPOINTS.cashiers}/${id}`);
      } catch {
        return null;
      }
    }
  }

  async update(id: string, data: UpdateCashierDto): Promise<Cashier> {
    if (isLocalMode()) {
      const cashiers = storageService.get<Cashier[]>('cashiers') || [];
      const index = cashiers.findIndex(c => c.id === id);

      if (index === -1) throw new Error('Caissier introuvable');

      cashiers[index] = { ...cashiers[index], ...data };
      storageService.set('cashiers', cashiers);

      logger.success('✅ Caissier mis à jour (local)', { id });
      return cashiers[index];
    } else {
      return await apiClient.put<Cashier>(`${API_ENDPOINTS.cashiers}/${id}`, data);
    }
  }

  async delete(id: string): Promise<void> {
    if (isLocalMode()) {
      const cashiers = storageService.get<Cashier[]>('cashiers') || [];
      const filtered = cashiers.filter(c => c.id !== id);
      storageService.set('cashiers', filtered);
      logger.info('🗑️ Caissier supprimé (local)', { id });
    } else {
      await apiClient.delete(`${API_ENDPOINTS.cashiers}/${id}`);
    }
  }
}

export const cashierService = new CashierService();