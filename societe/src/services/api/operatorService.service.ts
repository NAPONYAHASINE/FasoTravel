/**
 * Service API pour la gestion des services opérateur
 * 
 * Backend endpoints:
 * - GET /operators/:id/services (liste par opérateur)
 * - POST /admin/operator-services (création)
 * - PUT /admin/operator-services/:id (modification)
 * - DELETE /admin/operator-services/:id (suppression)
 */

import { isDevelopment } from '../../shared/config/deployment';
import { API_ENDPOINTS } from '../config';
import { apiClient } from './apiClient';
import { storageService } from '../storage/localStorage.service';
import { logger } from '../../utils/logger';
import { generateId } from '../../utils/formatters';

export interface OperatorServiceItem {
  id: string;
  operatorId: string;
  serviceName: string;
  serviceType: 'BAGGAGE' | 'FOOD' | 'COMFORT' | 'ENTERTAINMENT' | 'OTHER';
  description?: string;
  price: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOperatorServiceDto {
  operatorId: string;
  serviceName: string;
  serviceType?: string;
  description?: string;
  price: number;
  currency?: string;
  isActive?: boolean;
}

export interface UpdateOperatorServiceDto {
  serviceName?: string;
  serviceType?: string;
  description?: string;
  price?: number;
  currency?: string;
  isActive?: boolean;
}

class OperatorServiceService {
  private getLocalServices(): OperatorServiceItem[] {
    return (storageService.get('operatorServices') as any as OperatorServiceItem[]) || [];
  }

  private saveLocalServices(services: OperatorServiceItem[]): void {
    (storageService.set as any)('operatorServices', services);
  }

  async list(operatorId: string): Promise<OperatorServiceItem[]> {
    if (isDevelopment()) {
      return this.getLocalServices().filter(s => s.operatorId === operatorId);
    }
    return await apiClient.get<OperatorServiceItem[]>(API_ENDPOINTS.operatorServices(operatorId));
  }

  async create(data: CreateOperatorServiceDto): Promise<OperatorServiceItem> {
    logger.info('🛎️ Création service', { name: data.serviceName });

    if (isDevelopment()) {
      const newService: OperatorServiceItem = {
        id: generateId(),
        operatorId: data.operatorId,
        serviceName: data.serviceName,
        serviceType: (data.serviceType as OperatorServiceItem['serviceType']) || 'OTHER',
        description: data.description,
        price: data.price,
        currency: data.currency || 'XOF',
        isActive: data.isActive !== false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const services = this.getLocalServices();
      services.push(newService);
      this.saveLocalServices(services);

      logger.info('✅ Service créé (local)', { id: newService.id });
      return newService;
    }

    return await apiClient.post<OperatorServiceItem>(API_ENDPOINTS.adminOperatorServices, data);
  }

  async update(id: string, data: UpdateOperatorServiceDto): Promise<OperatorServiceItem> {
    logger.info('✏️ Modification service', { id });

    if (isDevelopment()) {
      const services = this.getLocalServices();
      const index = services.findIndex(s => s.id === id);
      if (index === -1) throw new Error('Service introuvable');

      services[index] = { ...services[index], ...data, updatedAt: new Date().toISOString() } as OperatorServiceItem;
      this.saveLocalServices(services);

      logger.info('✅ Service mis à jour (local)', { id });
      return services[index];
    }

    return await apiClient.put<OperatorServiceItem>(`${API_ENDPOINTS.adminOperatorServices}/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    logger.info('🗑️ Suppression service', { id });

    if (isDevelopment()) {
      const services = this.getLocalServices();
      const filtered = services.filter(s => s.id !== id);
      this.saveLocalServices(filtered);
      logger.info('✅ Service supprimé (local)', { id });
      return;
    }

    await apiClient.delete(`${API_ENDPOINTS.adminOperatorServices}/${id}`);
  }
}

export const operatorServiceService = new OperatorServiceService();
