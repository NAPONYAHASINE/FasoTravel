/**
 * @file infobipService.ts
 * @description Service dedie WhatsApp Business — OTP & Messages
 * 
 * Architecture backend-ready :
 * - Mode mock : donnees simulees avec delais realistes
 * - Mode production : appels API vers /admin/whatsapp/*
 * 
 * ENDPOINTS MAPPES :
 * GET    /admin/whatsapp/account         → getAccountInfo()
 * POST   /admin/whatsapp/test-message    → sendTestSms()
 * GET    /admin/whatsapp/health          → healthCheck()
 * GET    /admin/whatsapp/delivery-stats  → getDeliveryStats()
 */

import { AppConfig } from '../config/app.config';
import { apiService } from './apiService';
import type { WhatsAppMessageResult, WhatsAppAccountInfo } from '../shared/types/standardized';
import { MOCK_WHATSAPP_ACCOUNT, MOCK_WHATSAPP_HEALTH_CHECK, MOCK_WHATSAPP_DELIVERY_STATS } from '../lib/adminMockData';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// SERVICE
// ============================================================================

class WhatsAppBusinessService {
  /**
   * Recuperer les infos du compte WhatsApp Business
   */
  async getAccountInfo(): Promise<ApiResponse<WhatsAppAccountInfo>> {
    if (AppConfig.isMock) {
      await new Promise(r => setTimeout(r, 400));
      return { success: true, data: { ...MOCK_WHATSAPP_ACCOUNT } };
    }
    return await apiService.get('/admin/whatsapp/account');
  }

  /**
   * Envoyer un message WhatsApp de test
   */
  async sendTestSms(phoneNumber: string, message?: string): Promise<ApiResponse<WhatsAppMessageResult>> {
    if (AppConfig.isMock) {
      await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));
      // Simuler un echec si le numero est invalide
      const isValid = /^(\+?226|00226)?[0-9]{8}$/.test(phoneNumber.replace(/\s/g, ''));
      if (!isValid) {
        return {
          success: true,
          data: {
            success: false,
            to: phoneNumber,
            status: 'REJECTED',
            errorMessage: 'Numero invalide — format attendu: +226 XX XX XX XX',
          },
        };
      }
      return {
        success: true,
        data: {
          success: true,
          messageId: `MSG_TEST_${Date.now()}`,
          to: phoneNumber,
          status: 'DELIVERED',
          deliveryTime: Math.round(2 + Math.random() * 5),
        },
      };
    }
    return await apiService.post('/admin/whatsapp/test-message', {
      to: phoneNumber,
      message: message || '[FasoTravel] Ceci est un message WhatsApp de test depuis le dashboard admin.',
    });
  }

  /**
   * Health check WhatsApp Business
   */
  async healthCheck(): Promise<ApiResponse<{
    apiReachable: boolean;
    latencyMs: number;
    accountStatus: string;
    senderIdActive: boolean;
    lastDelivery?: string;
  }>> {
    if (AppConfig.isMock) {
      await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
      return {
        success: true,
        data: {
          ...MOCK_WHATSAPP_HEALTH_CHECK,
          latencyMs: Math.round(120 + Math.random() * 250),
          lastDelivery: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        },
      };
    }
    return await apiService.get('/admin/whatsapp/health');
  }

  /**
   * Statistiques de livraison detaillees
   */
  async getDeliveryStats(): Promise<ApiResponse<typeof MOCK_WHATSAPP_DELIVERY_STATS>> {
    if (AppConfig.isMock) {
      await new Promise(r => setTimeout(r, 500));
      return { success: true, data: { ...MOCK_WHATSAPP_DELIVERY_STATS } };
    }
    return await apiService.get('/admin/whatsapp/delivery-stats');
  }
}

export const whatsappService = new WhatsAppBusinessService();
/** @deprecated Use whatsappService */
export const infobipService = whatsappService;