/**
 * Service API pour la gestion des stories
 */

import { isLocalMode, buildApiUrl, API_ENDPOINTS } from '../config';
import { apiClient } from './apiClient';
import { storageService } from '../storage/localStorage.service';
import { logger } from '../../utils/logger';
import { generateId } from '../../utils/formatters';
import type { Story } from '../../contexts/DataContext';
import type { CreateStoryDto, UpdateStoryDto } from '../types';

class StoryService {
  async upload(file: File): Promise<{ url: string }> {
    logger.info('📤 Upload fichier story', { name: file.name, size: file.size });

    if (isLocalMode()) {
      // MODE LOCAL : Créer une URL temporaire
      const url = URL.createObjectURL(file);
      logger.success('✅ Fichier uploadé (local)', { url });
      return { url };
    } else {
      // MODE API : Uploader vers le backend
      const formData = new FormData();
      formData.append('file', file);

      // Pour FormData, on utilise fetch directement (pas apiClient)
      const response = await fetch(buildApiUrl(API_ENDPOINTS.storiesUpload), {
        method: 'POST',
        body: formData,
        // Note: Ne pas définir Content-Type pour FormData
      });

      if (!response.ok) throw new Error('Erreur upload fichier');

      const result = await response.json();
      logger.success('✅ Fichier uploadé (API)', { url: result.url });
      return result;
    }
  }

  async create(data: CreateStoryDto): Promise<Story> {
    logger.info('📖 Création story', { title: data.title });

    if (isLocalMode()) {
      const newStory: Story = {
        ...data,
        id: generateId(),
        views: 0,
        createdAt: new Date().toISOString(),
      };

      const stories = storageService.get<Story[]>('stories') || [];
      stories.push(newStory);
      storageService.set('stories', stories);

      logger.success('✅ Story créée (local)', { id: newStory.id });
      return newStory;
    } else {
      return await apiClient.post<Story>(API_ENDPOINTS.stories, data);
    }
  }

  async list(): Promise<Story[]> {
    if (isLocalMode()) {
      return storageService.get<Story[]>('stories') || [];
    } else {
      return await apiClient.get<Story[]>(API_ENDPOINTS.stories);
    }
  }

  async getById(id: string): Promise<Story | null> {
    if (isLocalMode()) {
      const stories = storageService.get<Story[]>('stories') || [];
      return stories.find(s => s.id === id) || null;
    } else {
      try {
        return await apiClient.get<Story>(`${API_ENDPOINTS.stories}/${id}`);
      } catch {
        return null;
      }
    }
  }

  async update(id: string, data: UpdateStoryDto): Promise<Story> {
    if (isLocalMode()) {
      const stories = storageService.get<Story[]>('stories') || [];
      const index = stories.findIndex(s => s.id === id);

      if (index === -1) throw new Error('Story introuvable');

      stories[index] = { ...stories[index], ...data };
      storageService.set('stories', stories);

      logger.success('✅ Story mise à jour (local)', { id });
      return stories[index];
    } else {
      return await apiClient.put<Story>(`${API_ENDPOINTS.stories}/${id}`, data);
    }
  }

  async delete(id: string): Promise<void> {
    if (isLocalMode()) {
      const stories = storageService.get<Story[]>('stories') || [];
      const filtered = stories.filter(s => s.id !== id);
      storageService.set('stories', filtered);
      logger.info('🗑️ Story supprimée (local)', { id });
    } else {
      await apiClient.delete(`${API_ENDPOINTS.stories}/${id}`);
    }
  }
}

export const storyService = new StoryService();