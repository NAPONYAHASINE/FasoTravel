/**
 * Ads Service - Gestion des publicités
 * 
 * SERVICE BACKEND-READY (dual-mode mock/API)
 * 
 * Endpoints API:
 *   - GET  /ads/active              → Récupère annonces actives ciblées
 *   - POST /ads/:id/impression      → Track vue
 *   - POST /ads/:id/click           → Track clic
 *   - POST /ads/:id/conversion      → Track conversion
 * 
 * Admin endpoints (gestion):
 *   - GET    /admin/ads             → Liste toutes les annonces
 *   - POST   /admin/ads             → Créer annonce
 *   - PUT    /admin/ads/:id         → Modifier annonce
 *   - DELETE /admin/ads/:id         → Supprimer annonce
 */

import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../config';
import { isDevelopment } from '../../shared/config/deployment';
import type { Advertisement } from '../../data/models';
import { MOCK_ADVERTISEMENTS } from '../../data/models';

// ============================================
// SERVICE
// ============================================

class AdsService {
  /**
   * Récupère les annonces actives ciblées pour la page et l'utilisateur
   */
  async getActiveAds(params: {
    page: string;
    userId?: string;
    isNewUser?: boolean;
  }): Promise<Advertisement[]> {
    if (isDevelopment()) {
      await new Promise(r => setTimeout(r, 200));
      return this.filterMockAds(MOCK_ADVERTISEMENTS, params.page, params.isNewUser);
    }

    const query = new URLSearchParams({ page: params.page });
    if (params.userId) query.set('user_id', params.userId);
    if (params.isNewUser) query.set('is_new', 'true');

    return apiClient.get<Advertisement[]>(`${API_ENDPOINTS.ads.active}?${query}`);
  }

  /**
   * Track impression d'une annonce
   */
  async trackImpression(adId: string, data: {
    userId?: string;
    page: string;
  }): Promise<void> {
    if (isDevelopment()) return;

    await apiClient.post(API_ENDPOINTS.ads.impression(adId), {
      user_id: data.userId,
      page: data.page,
      device_type: /mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
    });
  }

  /**
   * Track clic sur une annonce
   */
  async trackClick(adId: string, data: {
    userId?: string;
    page: string;
    actionType?: string;
  }): Promise<void> {
    if (isDevelopment()) return;

    await apiClient.post(API_ENDPOINTS.ads.click(adId), {
      user_id: data.userId,
      page: data.page,
      action_type: data.actionType,
      device_type: /mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
    });
  }

  // ============================================
  // PRIVATE — Mock filtering logic
  // ============================================

  private filterMockAds(ads: Advertisement[], currentPage: string, isNewUser?: boolean): Advertisement[] {
    const now = new Date();

    return ads.filter(ad => {
      if (ad.status !== 'active') return false;
      if (new Date(ad.startDate) > now || new Date(ad.endDate) < now) return false;
      if (ad.targetPages.length > 0 && !ad.targetPages.includes(currentPage)) return false;
      if (ad.targetNewUsers && !isNewUser) return false;
      if (ad.maxImpressions && ad.impressions >= ad.maxImpressions) return false;
      if (ad.maxClicks && ad.clicks >= ad.maxClicks) return false;
      return true;
    });
  }
}

export const adsService = new AdsService();
