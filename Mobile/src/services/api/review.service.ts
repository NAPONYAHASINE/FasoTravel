/**
 * Review Service - TransportBF Mobile
 * 
 * Gère:
 * - Récupérer avis (reviews)
 * - Créer un nouvel avis
 * - Avis d'un opérateur
 * 
 * ✅ Dual-mode
 */

import { apiClient } from './apiClient';
import { storageService } from '../storage/localStorage.service';
import { API_ENDPOINTS, isDevelopment } from '../config';
import type { Review } from '../types';

interface CreateReviewParams {
  operatorId: string;
  tripId?: string;
  rating: number;
  comment: string;
  tags?: string[];
}

class ReviewService {
  /**
   * Récupère les avis d'un opérateur
   */
  async getReviews(operatorId: string, limit: number = 20): Promise<Review[]> {
    if (isDevelopment()) {
      return this.mockGetReviews(operatorId, limit);
    }

    return apiClient.get<Review[]>(API_ENDPOINTS.reviews.byOperator(operatorId));
  }

  /**
   * Crée un nouvel avis
   */
  async createReview(params: CreateReviewParams): Promise<Review> {
    if (isDevelopment()) {
      return this.mockCreateReview(params);
    }

    return apiClient.post<Review>(
      API_ENDPOINTS.reviews.create,
      params
    );
  }

  /**
   * Récupère les avis de l'utilisateur
   */
  async getMyReviews(): Promise<Review[]> {
    if (isDevelopment()) {
      return storageService.get<Review[]>('user_reviews') || [];
    }

    return apiClient.get<Review[]>(API_ENDPOINTS.reviews.myReviews);
  }

  /**
   * Modifie un avis
   */
  async updateReview(reviewId: string, params: Partial<CreateReviewParams>): Promise<Review> {
    if (isDevelopment()) {
      const reviews = storageService.get<Review[]>('user_reviews') || [];
      const review = reviews.find(r => r.id === reviewId);
      if (!review) throw new Error(`Review ${reviewId} not found`);

      Object.assign(review, params, { updatedAt: new Date().toISOString() });
      storageService.set('user_reviews', reviews);
      return review;
    }

    return apiClient.put<Review>(
      API_ENDPOINTS.reviews.update(reviewId),
      params
    );
  }

  /**
   * Supprime un avis
   */
  async deleteReview(reviewId: string): Promise<void> {
    if (isDevelopment()) {
      const reviews = storageService.get<Review[]>('user_reviews') || [];
      const filtered = reviews.filter(r => r.id !== reviewId);
      storageService.set('user_reviews', filtered);
      return;
    }

    await apiClient.delete(API_ENDPOINTS.reviews.delete(reviewId));
  }

  // ============================================
  // MOCK DATA
  // ============================================

  private mockGetReviews(operatorId: string, limit: number = 20): Review[] {
    const reviews: Review[] = [];
    const comments = [
      'Excellent service, très confortable',
      'Ponctuel et professionnel',
      'Bonne atmosphère dans le bus',
      'Chauffeur très courtois',
      'Excellent rapport qualité-prix',
      'À refaire sans hésiter',
    ];

    for (let i = 0; i < Math.min(limit, 6); i++) {
      reviews.push({
        id: `review_${operatorId}_${i}`,
        tripId: `trip_${i}`,
        userId: `user_${i}`,
        operatorId,
        rating: 3 + Math.floor(Math.random() * 3),
        comment: comments[i],
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
        status: 'APPROVED',
      });
    }

    return reviews;
  }

  private mockCreateReview(params: CreateReviewParams): Review {
    const review: Review = {
      id: `review_${Date.now()}`,
      tripId: `trip_${Date.now()}`,
      userId: 'current_user',
      operatorId: params.operatorId,
      rating: params.rating,
      comment: params.comment,
      createdAt: new Date().toISOString(),
      status: 'PENDING',
    };

    const reviews = storageService.get<Review[]>('user_reviews') || [];
    reviews.push(review);
    storageService.set('user_reviews', reviews);

    return review;
  }
}

export const reviewService = new ReviewService();
