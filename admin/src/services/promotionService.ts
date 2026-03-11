/**
 * Service Promotions FasoTravel Admin
 * Backend-ready: Mock service qui peut être facilement remplacé par de vrais appels API
 * 
 * GÈRE: Réductions de prix créées par les opérateurs (Societe app) ET par l'admin
 * L'admin supervise, approuve/rejette, crée, modifie, supprime, et voit les analytics
 * 
 * RESPONSABILITÉS:
 * - Fournir l'interface entre le frontend et le backend
 * - En mode MOCK: utilise les données de /lib/adminMockData.ts avec mutations locales
 * - En mode PRODUCTION: effectue de vrais appels API
 * - ZÉRO génération de données dans ce service
 */

import { AppConfig } from '../config/app.config';
import { apiService } from './apiService';
import {
  MOCK_PROMOTIONS,
  MOCK_PROMOTION_STATS
} from '../lib/adminMockData';
import type { Promotion, PromotionStats } from '../shared/types/standardized';

// Re-export types
export type { Promotion, PromotionStats };

// ============================================================================
// TYPE POUR CRÉATION/MODIFICATION
// ============================================================================

export interface PromotionFormData {
  title: string;
  description?: string;
  code?: string; // DEPRECATED: conservé pour rétro-compatibilité backend — non rempli depuis le formulaire admin
  operatorId: string;
  operatorName: string;
  tripId?: string;
  tripRoute?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageLimitPerUser?: number;
  startDate: string;
  endDate: string;
  // Story associée (contenu visuel mobile)
  storyEnabled?: boolean;
  storyMediaType?: 'image' | 'video';
  storyMediaUrl?: string;
  storyThumbnailUrl?: string;
  storyCtaText?: string;
  storyCtaLink?: string;
}

// ============================================================================
// CACHE EN MÉMOIRE + DONNÉES MOCK MUTABLES
// ============================================================================

let localPromotions: Promotion[] | null = null;
let cachedStats: PromotionStats | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60000; // 1 minute

function getMutablePromotions(): Promotion[] {
  if (!localPromotions) {
    localPromotions = JSON.parse(JSON.stringify(MOCK_PROMOTIONS));
  }
  return localPromotions!;
}

function recalculateStats(): PromotionStats {
  const promos = getMutablePromotions();
  const now = new Date();
  
  let active = 0, pending = 0, expired = 0, rejected = 0;
  let totalUsage = 0, totalSavings = 0, totalPercent = 0, percentCount = 0;
  
  promos.forEach(p => {
    if (p.approvalStatus === 'rejected') { rejected++; }
    else if (p.approvalStatus === 'pending') { pending++; }
    else if (now > new Date(p.endDate)) { expired++; }
    else if (p.isActive && p.approvalStatus === 'approved') { active++; }
    else { expired++; }
    
    totalUsage += p.usageCount;
    if (p.discountType === 'percentage') {
      totalSavings += p.usageCount * p.discountValue * 100; // Estimation
      totalPercent += p.discountValue;
      percentCount++;
    } else {
      totalSavings += p.usageCount * p.discountValue;
    }
  });

  return {
    total: promos.length,
    active,
    pending,
    expired,
    rejected,
    totalUsage,
    totalSavings,
    avgDiscountPercent: percentCount > 0 ? Math.round((totalPercent / percentCount) * 10) / 10 : 0,
  };
}

// ============================================================================
// SERVICE API
// ============================================================================

class PromotionService {
  // ==================== LECTURE ====================

  async getAllPromotions(): Promise<Promotion[]> {
    if (AppConfig.isMock) {
      return getMutablePromotions();
    }
    const response = await apiService.get<Promotion[]>('/admin/promotions');
    return response;
  }

  async getPromotionStats(): Promise<PromotionStats> {
    if (AppConfig.isMock) {
      return recalculateStats();
    }
    const response = await apiService.get<PromotionStats>('/admin/promotions/stats');
    return response;
  }

  async getPromotionById(promoId: string): Promise<Promotion | null> {
    if (AppConfig.isMock) {
      return getMutablePromotions().find(p => p.id === promoId) || null;
    }
    return await apiService.get<Promotion>(`/admin/promotions/${promoId}`);
  }

  // ==================== CRÉATION ====================

  async createPromotion(data: PromotionFormData): Promise<Promotion> {
    if (AppConfig.isMock) {
      const promos = getMutablePromotions();
      const newPromo: Promotion = {
        id: `promo_${String(promos.length + 1).padStart(3, '0')}`,
        operatorId: data.operatorId,
        operatorName: data.operatorName,
        tripId: data.tripId,
        tripRoute: data.tripRoute,
        title: data.title,
        description: data.description,
        code: data.code,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minPurchaseAmount: data.minPurchaseAmount,
        maxDiscountAmount: data.maxDiscountAmount,
        usageLimit: data.usageLimit,
        usageLimitPerUser: data.usageLimitPerUser,
        usageCount: 0,
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: false,
        approvalStatus: 'approved', // Admin-created = auto-approved
        approvedBy: 'admin_current',
        approvedByName: 'Admin FasoTravel',
        approvedAt: new Date().toISOString(),
        createdBy: 'admin_current',
        createdByName: 'Admin FasoTravel',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Story associée (contenu visuel mobile)
        storyEnabled: data.storyEnabled,
        storyMediaType: data.storyMediaType,
        storyMediaUrl: data.storyMediaUrl,
        storyThumbnailUrl: data.storyThumbnailUrl,
        storyCtaText: data.storyCtaText,
        storyCtaLink: data.storyCtaLink,
      };
      promos.unshift(newPromo);
      cachedStats = null;
      return newPromo;
    }
    return await apiService.post<Promotion>('/admin/promotions', data);
  }

  // ==================== MODIFICATION ====================

  async updatePromotion(promoId: string, data: Partial<PromotionFormData>): Promise<Promotion> {
    if (AppConfig.isMock) {
      const promos = getMutablePromotions();
      const idx = promos.findIndex(p => p.id === promoId);
      if (idx === -1) throw new Error('Promotion introuvable');
      promos[idx] = {
        ...promos[idx],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      cachedStats = null;
      return promos[idx];
    }
    return await apiService.patch<Promotion>(`/admin/promotions/${promoId}`, data);
  }

  // ==================== APPROBATION ====================

  async approvePromotion(promoId: string): Promise<Promotion> {
    if (AppConfig.isMock) {
      const promos = getMutablePromotions();
      const idx = promos.findIndex(p => p.id === promoId);
      if (idx === -1) throw new Error('Promotion introuvable');
      promos[idx] = {
        ...promos[idx],
        approvalStatus: 'approved',
        isActive: true,
        approvedBy: 'admin_current',
        approvedByName: 'Admin FasoTravel',
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      cachedStats = null;
      return promos[idx];
    }
    return await apiService.patch<Promotion>(`/admin/promotions/${promoId}/approve`);
  }

  async rejectPromotion(promoId: string, reason: string): Promise<Promotion> {
    if (AppConfig.isMock) {
      const promos = getMutablePromotions();
      const idx = promos.findIndex(p => p.id === promoId);
      if (idx === -1) throw new Error('Promotion introuvable');
      promos[idx] = {
        ...promos[idx],
        approvalStatus: 'rejected',
        isActive: false,
        rejectionReason: reason,
        approvedBy: 'admin_current',
        approvedByName: 'Admin FasoTravel',
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      cachedStats = null;
      return promos[idx];
    }
    return await apiService.patch<Promotion>(`/admin/promotions/${promoId}/reject`, { reason });
  }

  // ==================== ACTIVATION ====================

  async activatePromotion(promoId: string): Promise<Promotion> {
    if (AppConfig.isMock) {
      const promos = getMutablePromotions();
      const idx = promos.findIndex(p => p.id === promoId);
      if (idx === -1) throw new Error('Promotion introuvable');
      promos[idx] = { ...promos[idx], isActive: true, updatedAt: new Date().toISOString() };
      cachedStats = null;
      return promos[idx];
    }
    return await apiService.patch<Promotion>(`/admin/promotions/${promoId}/activate`);
  }

  async deactivatePromotion(promoId: string): Promise<Promotion> {
    if (AppConfig.isMock) {
      const promos = getMutablePromotions();
      const idx = promos.findIndex(p => p.id === promoId);
      if (idx === -1) throw new Error('Promotion introuvable');
      promos[idx] = { ...promos[idx], isActive: false, updatedAt: new Date().toISOString() };
      cachedStats = null;
      return promos[idx];
    }
    return await apiService.patch<Promotion>(`/admin/promotions/${promoId}/deactivate`);
  }

  // ==================== SUPPRESSION ====================

  async deletePromotion(promoId: string): Promise<void> {
    if (AppConfig.isMock) {
      const promos = getMutablePromotions();
      const idx = promos.findIndex(p => p.id === promoId);
      if (idx === -1) throw new Error('Promotion introuvable');
      promos.splice(idx, 1);
      localPromotions = promos;
      cachedStats = null;
      return;
    }
    await apiService.delete(`/admin/promotions/${promoId}`);
  }

  // ==================== CACHE ====================

  clearCache(): void {
    cachedStats = null;
    cacheTimestamp = 0;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const promotionService = new PromotionService();