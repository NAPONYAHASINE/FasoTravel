/**
 * Referral (Parrainage) Service - TransportBF Mobile
 * 
 * Gère:
 * - Consultation code de parrainage
 * - Partage du lien de parrainage
 * - Conversion points → coupons
 * - Liste des filleuls et coupons
 * 
 * ✅ Dual-mode: LOCAL (dev) / API (prod)
 */

import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../config';
import { isDevelopment } from '../../shared/config/deployment';
import type {
  ReferralInfo,
  ReferralCoupon,
  ReferralBadgeLevel,
} from '../../shared/types/common';
import {
  REFERRAL_BADGE_THRESHOLDS,
  REFERRAL_COUPON_TIERS,
} from '../../shared/types/common';

// ============================================
// HELPERS
// ============================================

export function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `FT-226-${suffix}`;
}

export function computeBadge(totalReferrals: number): ReferralBadgeLevel {
  if (totalReferrals >= REFERRAL_BADGE_THRESHOLDS.legende) return 'legende';
  if (totalReferrals >= REFERRAL_BADGE_THRESHOLDS.super_ambassadeur) return 'super_ambassadeur';
  if (totalReferrals >= REFERRAL_BADGE_THRESHOLDS.ambassadeur) return 'ambassadeur';
  return 'standard';
}

// ============================================
// MOCK DATA (persistent across session)
// ============================================

let mockReferralInfo: ReferralInfo | null = null;
let mockCoupons: ReferralCoupon[] = [];

function getOrCreateMockInfo(): ReferralInfo {
  if (!mockReferralInfo) {
    mockReferralInfo = {
      referralCode: 'FT-226-DEMO',
      pointsBalance: 150,
      totalReferrals: 15,
      badgeLevel: 'standard',
      referredUsers: [
        { id: 'ref_001', name: 'Aminata Traoré', joinedAt: '2025-05-10T08:00:00Z', pointsEarned: 10 },
        { id: 'ref_002', name: 'Ibrahim Sawadogo', joinedAt: '2025-05-15T14:30:00Z', pointsEarned: 10 },
        { id: 'ref_003', name: 'Mariam Ouédraogo', joinedAt: '2025-06-01T09:15:00Z', pointsEarned: 10 },
        { id: 'ref_004', name: 'Ousmane Kaboré', joinedAt: '2025-06-12T11:00:00Z', pointsEarned: 10 },
        { id: 'ref_005', name: 'Fatoumata Diallo', joinedAt: '2025-06-20T16:45:00Z', pointsEarned: 10 },
        { id: 'ref_006', name: 'Aissata Sanogo', joinedAt: '2025-07-03T10:20:00Z', pointsEarned: 10 },
        { id: 'ref_007', name: 'Moussa Confé', joinedAt: '2025-07-08T08:30:00Z', pointsEarned: 10 },
        { id: 'ref_008', name: 'Kadiatou Konaté', joinedAt: '2025-07-15T15:00:00Z', pointsEarned: 10 },
        { id: 'ref_009', name: 'Abdoulaye Sall', joinedAt: '2025-08-02T09:45:00Z', pointsEarned: 10 },
        { id: 'ref_010', name: 'Rokia Sangaré', joinedAt: '2025-08-10T12:15:00Z', pointsEarned: 10 },
        { id: 'ref_011', name: 'Sékou Cissé', joinedAt: '2025-09-01T07:30:00Z', pointsEarned: 10 },
        { id: 'ref_012', name: 'Hawa Touré', joinedAt: '2025-09-18T14:00:00Z', pointsEarned: 10 },
        { id: 'ref_013', name: 'Boubacar Diarra', joinedAt: '2025-10-05T11:30:00Z', pointsEarned: 10 },
        { id: 'ref_014', name: 'Djeneba Coulibaly', joinedAt: '2025-11-12T08:45:00Z', pointsEarned: 10 },
        { id: 'ref_015', name: 'Mamadou Ba', joinedAt: '2025-12-01T10:00:00Z', pointsEarned: 10 },
      ],
      shareLink: 'https://fasotravel.bf/invite?code=FT-226-DEMO',
    };

    // Pré-remplir des coupons mixés pour tester
    mockCoupons = [
      {
        id: 'coupon_mock_001',
        code: 'FASO-AX7K2P',
        amount: 500,
        pointsCost: 100,
        status: 'active',
        createdAt: '2025-11-20T10:00:00Z',
        expiresAt: '2026-02-18T10:00:00Z',
      },
      {
        id: 'coupon_mock_002',
        code: 'FASO-BM3N8R',
        amount: 1000,
        pointsCost: 200,
        status: 'used',
        createdAt: '2025-10-05T14:30:00Z',
        expiresAt: '2026-01-03T14:30:00Z',
        usedAt: '2025-11-15T09:00:00Z',
      },
      {
        id: 'coupon_mock_003',
        code: 'FASO-CT5W9D',
        amount: 500,
        pointsCost: 100,
        status: 'expired',
        createdAt: '2025-06-01T08:00:00Z',
        expiresAt: '2025-08-30T08:00:00Z',
      },
    ];
  }
  return mockReferralInfo;
}

// ============================================
// SERVICE
// ============================================

class ReferralService {
  /**
   * Récupère les infos de parrainage de l'utilisateur connecté
   */
  async getMyReferralInfo(): Promise<ReferralInfo> {
    if (isDevelopment()) {
      return getOrCreateMockInfo();
    }
    return apiClient.get<ReferralInfo>(API_ENDPOINTS.referrals.myInfo);
  }

  /**
   * Convertit des points en coupon de réduction
   */
  async convertPointsToCoupon(pointsCost: number): Promise<ReferralCoupon> {
    const tier = REFERRAL_COUPON_TIERS.find(t => t.pointsCost === pointsCost);
    if (!tier) throw new Error('Tier de conversion invalide');

    if (isDevelopment()) {
      const info = getOrCreateMockInfo();
      if (info.pointsBalance < pointsCost) {
        throw new Error('Points insuffisants');
      }
      info.pointsBalance -= pointsCost;

      const coupon: ReferralCoupon = {
        id: `coupon_${Date.now()}`,
        code: `FASO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        amount: tier.amount,
        pointsCost: tier.pointsCost,
        status: 'active',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 jours
      };
      mockCoupons.unshift(coupon);
      return coupon;
    }

    return apiClient.post<ReferralCoupon>(API_ENDPOINTS.referrals.convertPoints, { pointsCost });
  }

  /**
   * Récupère la liste des coupons de l'utilisateur
   */
  async getMyCoupons(): Promise<ReferralCoupon[]> {
    if (isDevelopment()) {
      return [...mockCoupons];
    }
    return apiClient.get<ReferralCoupon[]>(API_ENDPOINTS.referrals.myCoupons);
  }

  /**
   * Valide un code de parrainage (utilisé lors de l'inscription)
   */
  async validateReferralCode(code: string): Promise<{ valid: boolean; referrerName?: string }> {
    if (isDevelopment()) {
      // En mock, accepter tout code au format FT-226-XXXX
      const isValid = /^FT-226-[A-Z0-9]{4}$/.test(code.toUpperCase());
      return {
        valid: isValid,
        referrerName: isValid ? 'Utilisateur FasoTravel' : undefined,
      };
    }
    return apiClient.post<{ valid: boolean; referrerName?: string }>(
      API_ENDPOINTS.referrals.validate,
      { code }
    );
  }

  /**
   * Valide un code coupon et retourne le coupon s'il est actif
   */
  async validateCouponCode(code: string): Promise<ReferralCoupon> {
    if (isDevelopment()) {
      await new Promise(r => setTimeout(r, 500));
      const normalized = code.toUpperCase().trim();
      const coupon = mockCoupons.find(c => c.code === normalized);
      if (!coupon) throw new Error('Code coupon invalide');
      if (coupon.status === 'used') throw new Error('Ce coupon a déjà été utilisé');
      if (coupon.status === 'expired') throw new Error('Ce coupon a expiré');
      return coupon;
    }
    return apiClient.post<ReferralCoupon>(API_ENDPOINTS.referrals.validateCoupon, { code });
  }

  /**
   * Marque un coupon comme utilisé après paiement
   */
  async useCoupon(couponId: string): Promise<void> {
    if (isDevelopment()) {
      const coupon = mockCoupons.find(c => c.id === couponId);
      if (coupon) {
        coupon.status = 'used';
        coupon.usedAt = new Date().toISOString();
      }
      return;
    }
    await apiClient.post(API_ENDPOINTS.referrals.useCoupon, { couponId });
  }

  /**
   * Génère le lien de partage pour WhatsApp / Natif
   */
  getShareMessage(referralCode: string): string {
    return `🚌 Rejoins FasoTravel et voyage malin ! Utilise mon code ${referralCode} lors de ton inscription et bénéficie d'avantages exclusifs.\n\n👉 https://fasotravel.bf/invite?code=${referralCode}`;
  }
}

export const referralService = new ReferralService();
