/**
 * Operator Service - TransportBF Mobile
 * 
 * Gère:
 * - Récupérer opérateurs (compagnies de transport)
 * - Détails opérateur
 * - Services de l'opérateur (routes, tarifs)
 * - Stories de l'opérateur
 * 
 * ✅ Dual-mode
 */

import { apiClient } from './apiClient';
import { API_ENDPOINTS, isDevelopment } from '../config';
import type { Operator, OperatorService as OperatorServiceType, OperatorStory } from '../types';

class OperatorService {
  /**
   * Récupère la liste des opérateurs
   */
  async getOperators(limit: number = 20): Promise<Operator[]> {
    if (isDevelopment()) {
      return this.mockGetOperators(limit);
    }

    return apiClient.get<Operator[]>(API_ENDPOINTS.operators.list);
  }

  /**
   * Récupère les détails d'un opérateur
   */
  async getOperator(operatorId: string): Promise<Operator> {
    if (isDevelopment()) {
      const operators = this.mockGetOperators();
      const operator = operators.find(op => op.id === operatorId);
      if (!operator) throw new Error(`Operator ${operatorId} not found`);
      return operator;
    }

    return apiClient.get<Operator>(API_ENDPOINTS.operators.detail(operatorId));
  }

  /**
   * Récupère les services (routes) d'un opérateur
   */
  async getOperatorServices(operatorId: string): Promise<OperatorServiceType[]> {
    if (isDevelopment()) {
      return this.mockGetOperatorServices(operatorId);
    }

    return apiClient.get<OperatorServiceType[]>(
      API_ENDPOINTS.operators.services(operatorId)
    );
  }

  /**
   * Récupère les stories d'un opérateur
   */
  async getOperatorStories(operatorId: string): Promise<OperatorStory[]> {
    if (isDevelopment()) {
      return this.mockGetOperatorStories(operatorId);
    }

    return apiClient.get<OperatorStory[]>(
      API_ENDPOINTS.operators.stories(operatorId)
    );
  }

  /**
   * Récupère les avis d'un opérateur
   */
  async getOperatorReviews(operatorId: string) {
    if (isDevelopment()) {
      return this.mockGetOperatorReviews(operatorId);
    }

    return apiClient.get(API_ENDPOINTS.operators.reviews(operatorId));
  }

  // ============================================
  // MOCK DATA
  // ============================================

  private mockGetOperators(limit: number = 20): Operator[] {
    const operators: Operator[] = [
      {
        id: 'operator_1',
        name: 'Bani Express',
        phone: '+226 70 11 11 11',
        email: 'contact@baniexpress.bf',
        baseCity: 'Ouagadougou',
        logoUrl: 'https://via.placeholder.com/80',
        status: 'active',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'operator_2',
        name: 'Safara Tours',
        phone: '+226 70 22 22 22',
        email: 'contact@safaratours.bf',
        baseCity: 'Ouagadougou',
        logoUrl: 'https://via.placeholder.com/80',
        status: 'active',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'operator_3',
        name: 'Bush Transport',
        phone: '+226 70 33 33 33',
        email: 'contact@bushtransport.bf',
        baseCity: 'Bobo-Dioulasso',
        logoUrl: 'https://via.placeholder.com/80',
        status: 'active',
        createdAt: new Date().toISOString(),
      },
    ];

    return operators.slice(0, limit);
  }

  private mockGetOperatorServices(operatorId: string): OperatorServiceType[] {
    return [
      {
        operatorId,
        name: 'Standard',
        price: 5000,
        isAvailable: true,
        createdAt: new Date().toISOString(),
      },
      {
        operatorId,
        name: 'Premium',
        price: 8000,
        isAvailable: true,
        createdAt: new Date().toISOString(),
      },
    ];
  }

  private mockGetOperatorStories(operatorId: string): OperatorStory[] {
    return [
      {
        id: `story_${operatorId}_1`,
        operatorId,
        title: 'Story 1',
        description: 'Description 1',
        imageUrl: 'https://via.placeholder.com/300x400',
        startDate: new Date(Date.now() - 3600000).toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        status: 'active',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: `story_${operatorId}_2`,
        operatorId,
        title: 'Story 2',
        description: 'Description 2',
        imageUrl: 'https://via.placeholder.com/300x400',
        startDate: new Date(Date.now() - 7200000).toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        status: 'active',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
      },
    ];
  }

  private mockGetOperatorReviews(operatorId: string) {
    return {
      averageRating: 4.4,
      totalReviews: 234,
      distribution: {
        5: 120,
        4: 80,
        3: 25,
        2: 7,
        1: 2,
      },
      recentReviews: [
        {
          id: `review_${operatorId}_1`,
          userId: 'user_1',
          rating: 5,
          comment: 'Excellent service',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ],
    };
  }
}

export const operatorService = new OperatorService();
