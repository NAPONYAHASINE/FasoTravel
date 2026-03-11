/**
 * @file paydunyaService.ts
 * @description Service dédié PaydunYa — Agrégateur de paiement
 * 
 * Architecture backend-ready :
 * - Mode mock : données depuis adminMockData + données générées dans CE service
 * - Mode production : appels API vers /admin/paydunya/*
 * 
 * ENDPOINTS MAPPÉS :
 * GET    /admin/paydunya                     → getIntegration()
 * PUT    /admin/paydunya/credentials          → updateCredentials()
 * PUT    /admin/paydunya/mode                 → switchMode()
 * PUT    /admin/paydunya/channels/:key/toggle → toggleChannel()
 * PUT    /admin/paydunya/channels/:key/fee    → updateChannelFee()
 * GET    /admin/paydunya/health               → checkHealth()
 * POST   /admin/paydunya/test                 → testConnection()
 * GET    /admin/paydunya/stats/channels       → getChannelStats()
 * GET    /admin/paydunya/webhook-logs         → getWebhookLogs()
 */

import { AppConfig } from '../config/app.config';
import {
  Integration,
  PaydunyaConfig,
  PaydunyaChannel,
  PaydunyaChannelKey,
  PaydunyaChannelStats,
  PaydunyaWebhookLog,
  PaydunyaHealthStatus,
} from '../shared/types/standardized';
import { integrationsService } from './entitiesService';
import {
  MOCK_PAYDUNYA_CHANNEL_STATS,
  MOCK_PAYDUNYA_WEBHOOK_LOGS,
  MOCK_PAYDUNYA_HEALTH,
} from '../lib/adminMockData';

// ============================================================================
// TYPES INTERNES
// ============================================================================

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// SERVICE
// ============================================================================

class PaydunyaService {

  // -----------------------------------------------
  // GET PAYDUNYA INTEGRATION
  // -----------------------------------------------
  async getIntegration(): Promise<ApiResponse<Integration>> {
    if (AppConfig.isMock) {
      const all = await integrationsService.getAll();
      const paydunya = all.data?.find(i => i.type === 'payment' && i.name === 'PaydunYa');
      return paydunya
        ? { success: true, data: paydunya }
        : { success: false, error: 'PaydunYa non configuré' };
    }
    // Production: dedicated endpoint
    return { success: false, error: 'Not implemented — awaiting backend' };
  }

  // -----------------------------------------------
  // PARSE CONFIG (type-safe extraction from Integration.config)
  // -----------------------------------------------
  parseConfig(integration: Integration): PaydunyaConfig | null {
    if (!integration.config?.channels) return null;
    return integration.config as unknown as PaydunyaConfig;
  }

  // -----------------------------------------------
  // EXTRACT CHANNELS (flat array from config)
  // -----------------------------------------------
  extractChannels(config: PaydunyaConfig): PaydunyaChannel[] {
    return Object.entries(config.channels).map(([key, ch]) => ({
      key: key as PaydunyaChannelKey,
      label: ch.label,
      provider: ch.provider,
      enabled: ch.enabled,
      fee: ch.fee,
    }));
  }

  // -----------------------------------------------
  // TOGGLE CHANNEL
  // -----------------------------------------------
  async toggleChannel(channelKey: PaydunyaChannelKey): Promise<ApiResponse<PaydunyaChannel>> {
    if (AppConfig.isMock) {
      const res = await this.getIntegration();
      if (!res.success || !res.data) return { success: false, error: 'PaydunYa non trouvé' };

      const config = this.parseConfig(res.data);
      if (!config?.channels[channelKey]) return { success: false, error: 'Canal non trouvé' };

      const ch = config.channels[channelKey];
      ch.enabled = !ch.enabled;

      await integrationsService.update(res.data.id, { config: config as any });

      return {
        success: true,
        data: {
          key: channelKey,
          label: ch.label,
          provider: ch.provider,
          enabled: ch.enabled,
          fee: ch.fee,
        },
      };
    }
    return { success: false, error: 'Not implemented — PUT /admin/paydunya/channels/:key/toggle' };
  }

  // -----------------------------------------------
  // UPDATE CHANNEL FEE
  // -----------------------------------------------
  async updateChannelFee(channelKey: PaydunyaChannelKey, fee: number): Promise<ApiResponse<PaydunyaChannel>> {
    if (AppConfig.isMock) {
      const res = await this.getIntegration();
      if (!res.success || !res.data) return { success: false, error: 'PaydunYa non trouvé' };

      const config = this.parseConfig(res.data);
      if (!config?.channels[channelKey]) return { success: false, error: 'Canal non trouvé' };

      config.channels[channelKey].fee = fee;
      await integrationsService.update(res.data.id, { config: config as any });

      const ch = config.channels[channelKey];
      return {
        success: true,
        data: { key: channelKey, label: ch.label, provider: ch.provider, enabled: ch.enabled, fee: ch.fee },
      };
    }
    return { success: false, error: 'Not implemented — PUT /admin/paydunya/channels/:key/fee' };
  }

  // -----------------------------------------------
  // UPDATE CREDENTIALS
  // -----------------------------------------------
  async updateCredentials(data: { apiKey?: string; apiSecret?: string; masterKey?: string }): Promise<ApiResponse<void>> {
    if (AppConfig.isMock) {
      const res = await this.getIntegration();
      if (!res.success || !res.data) return { success: false, error: 'PaydunYa non trouvé' };

      const updates: Partial<Integration> = {};
      if (data.apiKey) updates.apiKey = data.apiKey;
      if (data.apiSecret) updates.apiSecret = data.apiSecret;
      if (data.masterKey) {
        const config = this.parseConfig(res.data);
        if (config) {
          config.masterKey = data.masterKey;
          updates.config = config as any;
        }
      }
      await integrationsService.update(res.data.id, updates);
      return { success: true };
    }
    return { success: false, error: 'Not implemented — PUT /admin/paydunya/credentials' };
  }

  // -----------------------------------------------
  // SWITCH MODE (live ↔ test)
  // -----------------------------------------------
  async switchMode(mode: 'live' | 'test'): Promise<ApiResponse<void>> {
    if (AppConfig.isMock) {
      const res = await this.getIntegration();
      if (!res.success || !res.data) return { success: false, error: 'PaydunYa non trouvé' };

      const config = this.parseConfig(res.data);
      if (!config) return { success: false, error: 'Config invalide' };

      config.mode = mode;
      await integrationsService.update(res.data.id, { config: config as any });
      return { success: true };
    }
    return { success: false, error: 'Not implemented — PUT /admin/paydunya/mode' };
  }

  // -----------------------------------------------
  // TEST CONNECTION
  // -----------------------------------------------
  async testConnection(): Promise<ApiResponse<{ latencyMs: number; success: boolean }>> {
    if (AppConfig.isMock) {
      // Simulate network latency
      await new Promise(r => setTimeout(r, 800 + Math.random() * 700));
      return { success: true, data: { latencyMs: Math.round(80 + Math.random() * 200), success: true } };
    }
    return { success: false, error: 'Not implemented — POST /admin/paydunya/test' };
  }

  // -----------------------------------------------
  // HEALTH CHECK
  // -----------------------------------------------
  async checkHealth(): Promise<ApiResponse<PaydunyaHealthStatus>> {
    if (AppConfig.isMock) {
      return { success: true, data: { ...MOCK_PAYDUNYA_HEALTH, updatedAt: new Date().toISOString() } };
    }
    return { success: false, error: 'Not implemented — GET /admin/paydunya/health' };
  }

  // -----------------------------------------------
  // CHANNEL STATS
  // -----------------------------------------------
  async getChannelStats(): Promise<ApiResponse<PaydunyaChannelStats[]>> {
    if (AppConfig.isMock) {
      return { success: true, data: [...MOCK_PAYDUNYA_CHANNEL_STATS] };
    }
    return { success: false, error: 'Not implemented — GET /admin/paydunya/stats/channels' };
  }

  // -----------------------------------------------
  // WEBHOOK LOGS
  // -----------------------------------------------
  async getWebhookLogs(limit = 20): Promise<ApiResponse<PaydunyaWebhookLog[]>> {
    if (AppConfig.isMock) {
      return { success: true, data: MOCK_PAYDUNYA_WEBHOOK_LOGS.slice(0, limit) };
    }
    return { success: false, error: 'Not implemented — GET /admin/paydunya/webhook-logs' };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const paydunyaService = new PaydunyaService();