/**
 * @file infobipService.ts
 * @description Service dedie Infobip — SMS & OTP
 * 
 * Architecture backend-ready :
 * - Mode mock : donnees simulees avec delais realistes
 * - Mode production : appels API vers /admin/infobip/*
 * 
 * ENDPOINTS MAPPES :
 * GET    /admin/infobip/account        → getAccountInfo()
 * POST   /admin/infobip/test-sms       → sendTestSms()
 * GET    /admin/infobip/health         → healthCheck()
 * GET    /admin/infobip/delivery-stats → getDeliveryStats()
 */

import { AppConfig } from '../config/app.config';
import { apiService } from './apiService';
import type { InfobipSmsResult, InfobipAccountInfo } from '../shared/types/standardized';
import { MOCK_INFOBIP_ACCOUNT, MOCK_INFOBIP_HEALTH_CHECK, MOCK_INFOBIP_DELIVERY_STATS } from '../lib/adminMockData';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// SERVICE
// ============================================================================

class InfobipService {
  /**
   * Recuperer les infos du compte Infobip
   */
  async getAccountInfo(): Promise<ApiResponse<InfobipAccountInfo>> {
    if (AppConfig.isMock) {
      await new Promise(r => setTimeout(r, 400));
      return { success: true, data: { ...MOCK_INFOBIP_ACCOUNT } };
    }
    return await apiService.get('/admin/infobip/account');
  }

  /**
   * Envoyer un SMS de test
   */
  async sendTestSms(phoneNumber: string, message?: string): Promise<ApiResponse<InfobipSmsResult>> {
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
    return await apiService.post('/admin/infobip/test-sms', {
      to: phoneNumber,
      message: message || '[FasoTravel] Ceci est un SMS de test depuis le dashboard admin.',
    });
  }

  /**
   * Health check Infobip
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
          ...MOCK_INFOBIP_HEALTH_CHECK,
          latencyMs: Math.round(120 + Math.random() * 250),
          lastDelivery: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        },
      };
    }
    return await apiService.get('/admin/infobip/health');
  }

  /**
   * Statistiques de livraison detaillees
   */
  async getDeliveryStats(): Promise<ApiResponse<typeof MOCK_INFOBIP_DELIVERY_STATS>> {
    if (AppConfig.isMock) {
      await new Promise(r => setTimeout(r, 500));
      return { success: true, data: { ...MOCK_INFOBIP_DELIVERY_STATS } };
    }
    return await apiService.get('/admin/infobip/delivery-stats');
  }
}

export const infobipService = new InfobipService();