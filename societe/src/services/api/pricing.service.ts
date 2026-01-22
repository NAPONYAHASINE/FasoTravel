/**
 * Service API pour la gestion de la tarification
 */

import { isLocalMode, API_ENDPOINTS } from '../config';
import { apiClient } from './apiClient';
import { storageService } from '../storage/localStorage.service';
import { logger } from '../../utils/logger';
import type { PricingSegment, PriceHistory, UpdatePriceDto } from '../types';

class PricingService {
  async listSegments(): Promise<PricingSegment[]> {
    if (isLocalMode()) {
      return (storageService.get('priceSegments') as any as PricingSegment[]) || [];
    } else {
      return await apiClient.get<PricingSegment[]>(API_ENDPOINTS.priceSegments);
    }
  }

  async updatePrice(segmentId: string, data: UpdatePriceDto): Promise<PricingSegment> {
    logger.info('💰 Mise à jour tarif', { segmentId, newPrice: data.currentPrice });

    if (isLocalMode()) {
      const segments = (storageService.get('priceSegments') as any as PricingSegment[]) || [];
      const index = segments.findIndex(s => s.id === segmentId);

      if (index === -1) throw new Error('Segment introuvable');

      const oldPrice = segments[index].currentPrice;
      segments[index] = {
        ...segments[index],
        previousPrice: oldPrice,
        currentPrice: data.currentPrice,
        lastUpdate: new Date().toISOString().split('T')[0],
      };

      storageService.set('priceSegments', segments);

      // Enregistrer dans l'historique si une raison est fournie
      if (data.reason) {
        const history = (storageService.get('priceHistory') as any as PriceHistory[]) || [];
        history.push({
          id: `ph_${Date.now()}`,
          segmentId,
          price: data.currentPrice,
          previousPrice: oldPrice,
          reason: data.reason,
          date: new Date().toISOString().split('T')[0],
        });
        storageService.set('priceHistory', history);
      }

      logger.info('✅ Tarif mis à jour (local)', { segmentId });
      return segments[index];
    } else {
      return await apiClient.put<PricingSegment>(`${API_ENDPOINTS.priceSegments}/${segmentId}`, data);
    }
  }

  async getHistory(segmentId: string): Promise<PriceHistory[]> {
    if (isLocalMode()) {
      const history = (storageService.get('priceHistory') as any as PriceHistory[]) || [];
      return history.filter(h => h.segmentId === segmentId);
    } else {
      return await apiClient.get<PriceHistory[]>(`${API_ENDPOINTS.priceHistory}?segmentId=${segmentId}`);
    }
  }
}

export const pricingService = new PricingService();