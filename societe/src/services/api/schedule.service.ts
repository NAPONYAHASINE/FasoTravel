/**
 * Service API pour la gestion des horaires récurrents (schedule templates)
 */

import { isLocalMode, API_ENDPOINTS } from '../config';
import { apiClient } from './apiClient';
import { storageService } from '../storage/localStorage.service';
import { logger } from '../../utils/logger';
import { generateId } from '../../utils/formatters';
import type { ScheduleTemplate } from '../../contexts/DataContext';
import type { CreateScheduleTemplateDto, UpdateScheduleTemplateDto } from '../types';

class ScheduleService {
  async create(data: CreateScheduleTemplateDto): Promise<ScheduleTemplate> {
    logger.info('📅 Création horaire récurrent', { gare: data.gareName, time: data.departureTime });

    if (isLocalMode()) {
      const newTemplate: ScheduleTemplate = {
        ...data,
        id: generateId(),
      };

      const templates = storageService.get<ScheduleTemplate[]>('scheduleTemplates') || [];
      templates.push(newTemplate);
      storageService.set('scheduleTemplates', templates);

      logger.success('✅ Horaire créé (local)', { id: newTemplate.id });
      return newTemplate;
    } else {
      return await apiClient.post<ScheduleTemplate>(API_ENDPOINTS.scheduleTemplates, data);
    }
  }

  async list(): Promise<ScheduleTemplate[]> {
    if (isLocalMode()) {
      return storageService.get<ScheduleTemplate[]>('scheduleTemplates') || [];
    } else {
      return await apiClient.get<ScheduleTemplate[]>(API_ENDPOINTS.scheduleTemplates);
    }
  }

  async getById(id: string): Promise<ScheduleTemplate | null> {
    if (isLocalMode()) {
      const templates = storageService.get<ScheduleTemplate[]>('scheduleTemplates') || [];
      return templates.find(t => t.id === id) || null;
    } else {
      try {
        return await apiClient.get<ScheduleTemplate>(`${API_ENDPOINTS.scheduleTemplates}/${id}`);
      } catch {
        return null;
      }
    }
  }

  async update(id: string, data: UpdateScheduleTemplateDto): Promise<ScheduleTemplate> {
    if (isLocalMode()) {
      const templates = storageService.get<ScheduleTemplate[]>('scheduleTemplates') || [];
      const index = templates.findIndex(t => t.id === id);

      if (index === -1) throw new Error('Horaire introuvable');

      templates[index] = { ...templates[index], ...data };
      storageService.set('scheduleTemplates', templates);

      logger.success('✅ Horaire mis à jour (local)', { id });
      return templates[index];
    } else {
      return await apiClient.put<ScheduleTemplate>(`${API_ENDPOINTS.scheduleTemplates}/${id}`, data);
    }
  }

  async delete(id: string): Promise<void> {
    if (isLocalMode()) {
      const templates = storageService.get<ScheduleTemplate[]>('scheduleTemplates') || [];
      const filtered = templates.filter(t => t.id !== id);
      storageService.set('scheduleTemplates', filtered);
      logger.info('🗑️ Horaire supprimé (local)', { id });
    } else {
      await apiClient.delete(`${API_ENDPOINTS.scheduleTemplates}/${id}`);
    }
  }
}

export const scheduleService = new ScheduleService();