/**
 * Service API pour la gestion des routes
 */

import { isLocalMode, API_ENDPOINTS } from '../config';
import { apiClient } from './apiClient';
import { storageService } from '../storage/localStorage.service';
import { logger } from '../../utils/logger';
import { generateId } from '../../utils/formatters';
import type { Route } from '../../contexts/DataContext';
import type { CreateRouteDto, UpdateRouteDto } from '../types';

class RouteService {
  async create(data: CreateRouteDto): Promise<Route> {
    logger.info('🛣️ Création route', { from: data.departure, to: data.arrival });

    if (isLocalMode()) {
      const newRoute: Route = {
        ...data,
        id: generateId(),
      };

      const routes = (storageService.get('routes') as any as Route[]) || [];
      routes.push(newRoute);
      (storageService.set as any)('routes', routes);

      logger.info('✅ Route créée (local)', { id: newRoute.id });
      return newRoute;
    } else {
      return await apiClient.post<Route>(API_ENDPOINTS.routes, data);
    }
  }

  async list(): Promise<Route[]> {
    if (isLocalMode()) {
      return (storageService.get('routes') as any as Route[]) || [];
    } else {
      return await apiClient.get<Route[]>(API_ENDPOINTS.routes);
    }
  }

  async getById(id: string): Promise<Route | null> {
    if (isLocalMode()) {
      const routes = (storageService.get('routes') as any as Route[]) || [];
      return routes.find(r => r.id === id) || null;
    } else {
      try {
        return await apiClient.get<Route>(`${API_ENDPOINTS.routes}/${id}`);
      } catch {
        return null;
      }
    }
  }

  async update(id: string, data: UpdateRouteDto): Promise<Route> {
    if (isLocalMode()) {
      const routes = (storageService.get('routes') as any as Route[]) || [];
      const index = routes.findIndex(r => r.id === id);

      if (index === -1) throw new Error('Route introuvable');

      routes[index] = { ...routes[index], ...data };
      (storageService.set as any)('routes', routes);

      logger.info('✅ Route mise à jour (local)', { id });
      return routes[index];
    } else {
      return await apiClient.put<Route>(`${API_ENDPOINTS.routes}/${id}`, data);
    }
  }

  async delete(id: string): Promise<void> {
    if (isLocalMode()) {
      const routes = (storageService.get('routes') as any as Route[]) || [];
      const filtered = routes.filter(r => r.id !== id);
      (storageService.set as any)('routes', filtered);
      logger.info('🗑️ Route supprimée (local)', { id });
    } else {
      await apiClient.delete(`${API_ENDPOINTS.routes}/${id}`);
    }
  }
}

export const routeService = new RouteService();