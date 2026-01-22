/**
 * Story Service - TransportBF Mobile
 * 
 * Gère:
 * - Récupérer stories (publicités de type Stories)
 * - Stories d'un opérateur spécifique
 * - Marquer story comme vue
 * 
 * ✅ Dual-mode
 */

import { apiClient } from './apiClient';
import { storageService } from '../storage/localStorage.service';
import { API_ENDPOINTS, isDevelopment } from '../config';
import type { OperatorStory } from '../types';

class StoryService {
  /**
   * Récupère les stories (stories feed)
   */
  async getStories(limit: number = 30): Promise<OperatorStory[]> {
    if (isDevelopment()) {
      return this.mockGetStories(limit);
    }

    return apiClient.get<OperatorStory[]>(API_ENDPOINTS.stories.list);
  }

  /**
   * Récupère les stories d'un opérateur
   */
  async getOperatorStories(operatorId: string): Promise<OperatorStory[]> {
    if (isDevelopment()) {
      return this.mockGetOperatorStories(operatorId);
    }

    return apiClient.get<OperatorStory[]>(
      API_ENDPOINTS.stories.byOperator(operatorId)
    );
  }

  /**
   * Marque une story comme vue
   */
  async markStoryViewed(storyId: string): Promise<void> {
    if (isDevelopment()) {
      const viewedStories = storageService.get<string[]>('viewed_stories') || [];
      if (!viewedStories.includes(storyId)) {
        viewedStories.push(storyId);
        storageService.set('viewed_stories', viewedStories);
      }
      return;
    }

    await apiClient.post<void>(API_ENDPOINTS.stories.markViewed, { storyId });
  }

  /**
   * Récupère les stories vues par l'utilisateur
   */
  async getViewedStories(): Promise<string[]> {
    if (isDevelopment()) {
      return storageService.get<string[]>('viewed_stories') || [];
    }

    return apiClient.get<string[]>(API_ENDPOINTS.stories.viewed);
  }

  // ============================================
  // MOCK DATA
  // ============================================

  private mockGetStories(limit: number = 30): OperatorStory[] {
    const operators = ['operator_1', 'operator_2', 'operator_3'];
    const stories: OperatorStory[] = [];

    for (let i = 0; i < limit; i++) {
      const operatorId = operators[i % operators.length];
      stories.push({
        id: `story_${Date.now()}_${i}`,
        operatorId,
        title: `Story ${i}`,
        description: 'Interesting story',
        imageUrl: `https://via.placeholder.com/300x400?text=Story${i}`,
        startDate: new Date(Date.now() - i * 3600000).toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        status: 'active',
        createdAt: new Date(Date.now() - i * 3600000).toISOString(),
      });
    }

    return stories.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  private mockGetOperatorStories(operatorId: string): OperatorStory[] {
    const now = Date.now();
    return [
      {
        id: `story_${operatorId}_1`,
        operatorId,
        title: 'Special Offer',
        description: 'Check our special offer',
        imageUrl: 'https://via.placeholder.com/300x400?text=Special+Offer',
        startDate: new Date(now - 3600000).toISOString(),
        endDate: new Date(now + 86400000).toISOString(),
        status: 'active',
        createdAt: new Date(now - 3600000).toISOString(),
      },
      {
        id: `story_${operatorId}_2`,
        operatorId,
        title: 'New Routes',
        description: 'New routes available',
        imageUrl: 'https://via.placeholder.com/300x400?text=New+Routes',
        startDate: new Date(now - 7200000).toISOString(),
        endDate: new Date(now + 86400000).toISOString(),
        status: 'active',
        createdAt: new Date(now - 7200000).toISOString(),
      },
      {
        id: `story_${operatorId}_3`,
        operatorId,
        title: 'Fleet Update',
        description: 'Our fleet has been updated',
        imageUrl: 'https://via.placeholder.com/300x400?text=Fleet+Update',
        startDate: new Date(now - 10800000).toISOString(),
        endDate: new Date(now + 86400000).toISOString(),
        status: 'active',
        createdAt: new Date(now - 10800000).toISOString(),
      },
    ];
  }
}

export const storyService = new StoryService();
