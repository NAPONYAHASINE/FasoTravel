/**
 * @file usePaydunYa.ts
 * @description Hook dédié PaydunYa — Agrégateur de paiement
 * 
 * Convention useAdminApp() appliquée :
 * - Toute la logique métier ici, ZÉRO dans le composant
 * - Backend-ready : bascule mock/prod transparente via paydunyaService
 * - Pas de spinner bloquant — data disponible immédiatement en mock
 * 
 * USAGE:
 * ```tsx
 * const { dashboard, actions, loading } = usePaydunYa();
 * // dashboard.channels, dashboard.channelStats, dashboard.health...
 * // actions.toggleChannel('orange_money'), actions.testConnection()...
 * ```
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { paydunyaService } from '../services/paydunyaService';
import type {
  Integration,
  PaydunyaConfig,
  PaydunyaChannel,
  PaydunyaChannelKey,
  PaydunyaChannelStats,
  PaydunyaWebhookLog,
  PaydunyaHealthStatus,
  PaydunyaDashboardData,
} from '../shared/types/standardized';

// ============================================================================
// TYPES
// ============================================================================

export interface UsePaydunyaReturn {
  /** Aggregated dashboard data — null only before first load */
  dashboard: PaydunyaDashboardData | null;

  /** Granular loading states — never blocks the UI */
  loading: {
    integration: boolean;
    stats: boolean;
    webhooks: boolean;
    health: boolean;
    action: boolean;
  };

  /** Last error message or null */
  error: string | null;

  /** All available actions */
  actions: {
    refresh: () => Promise<void>;
    refreshStats: () => Promise<void>;
    refreshWebhooks: () => Promise<void>;
    refreshHealth: () => Promise<void>;
    toggleChannel: (channelKey: PaydunyaChannelKey) => Promise<boolean>;
    updateChannelFee: (channelKey: PaydunyaChannelKey, fee: number) => Promise<boolean>;
    updateCredentials: (data: { apiKey?: string; apiSecret?: string; masterKey?: string }) => Promise<boolean>;
    switchMode: (mode: 'live' | 'test') => Promise<boolean>;
    testConnection: () => Promise<{ success: boolean; latencyMs?: number }>;
  };
}

// ============================================================================
// HOOK
// ============================================================================

export function usePaydunYa(): UsePaydunyaReturn {
  // --- State ---
  const [integration, setIntegration] = useState<Integration | null>(null);
  const [channelStats, setChannelStats] = useState<PaydunyaChannelStats[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<PaydunyaWebhookLog[]>([]);
  const [health, setHealth] = useState<PaydunyaHealthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [loadingIntegration, setLoadingIntegration] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingWebhooks, setLoadingWebhooks] = useState(false);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  const loadedRef = useRef(false);

  // --- Derived: config & channels ---
  const config = useMemo<PaydunyaConfig | null>(() => {
    if (!integration) return null;
    return paydunyaService.parseConfig(integration);
  }, [integration]);

  const channels = useMemo<PaydunyaChannel[]>(() => {
    if (!config) return [];
    return paydunyaService.extractChannels(config);
  }, [config]);

  // --- Derived: totals ---
  const totals = useMemo(() => {
    const totalTransactions = channelStats.reduce((s, c) => s + c.transactionsCount, 0);
    const totalRevenue = channelStats.reduce((s, c) => s + c.transactionsTotal, 0);
    const activeWithStats = channelStats.filter(c => c.transactionsCount > 0);
    const globalSuccessRate = activeWithStats.length > 0
      ? activeWithStats.reduce((s, c) => s + c.successRate, 0) / activeWithStats.length
      : 0;
    const activeChannels = channels.filter(c => c.enabled).length;
    const totalChannels = channels.length;
    return { totalTransactions, totalRevenue, globalSuccessRate, activeChannels, totalChannels };
  }, [channelStats, channels]);

  // --- Derived: full dashboard ---
  const dashboard = useMemo<PaydunyaDashboardData | null>(() => {
    if (!integration || !config || !health) return null;
    return {
      integration,
      config,
      channels,
      channelStats,
      recentWebhooks: webhookLogs,
      health,
      totals,
    };
  }, [integration, config, channels, channelStats, webhookLogs, health, totals]);

  // --- Loaders ---
  const loadIntegration = useCallback(async () => {
    setLoadingIntegration(true);
    setError(null);
    try {
      const res = await paydunyaService.getIntegration();
      if (res.success && res.data) {
        setIntegration(res.data);
      } else {
        setError(res.error || 'PaydunYa non trouvé');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoadingIntegration(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await paydunyaService.getChannelStats();
      if (res.success && res.data) setChannelStats(res.data);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const loadWebhooks = useCallback(async () => {
    setLoadingWebhooks(true);
    try {
      const res = await paydunyaService.getWebhookLogs(15);
      if (res.success && res.data) setWebhookLogs(res.data);
    } finally {
      setLoadingWebhooks(false);
    }
  }, []);

  const loadHealth = useCallback(async () => {
    setLoadingHealth(true);
    try {
      const res = await paydunyaService.checkHealth();
      if (res.success && res.data) setHealth(res.data);
    } finally {
      setLoadingHealth(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadIntegration(), loadStats(), loadWebhooks(), loadHealth()]);
  }, [loadIntegration, loadStats, loadWebhooks, loadHealth]);

  // --- Initial load ---
  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      refreshAll();
    }
  }, []);

  // --- Actions ---
  const toggleChannel = useCallback(async (channelKey: PaydunyaChannelKey): Promise<boolean> => {
    setLoadingAction(true);
    try {
      const res = await paydunyaService.toggleChannel(channelKey);
      if (res.success) {
        await loadIntegration(); // refresh integration to get updated config
        return true;
      }
      setError(res.error || 'Échec du toggle canal');
      return false;
    } finally {
      setLoadingAction(false);
    }
  }, [loadIntegration]);

  const updateChannelFee = useCallback(async (channelKey: PaydunyaChannelKey, fee: number): Promise<boolean> => {
    setLoadingAction(true);
    try {
      const res = await paydunyaService.updateChannelFee(channelKey, fee);
      if (res.success) {
        await loadIntegration();
        return true;
      }
      setError(res.error || 'Échec de la mise à jour des frais');
      return false;
    } finally {
      setLoadingAction(false);
    }
  }, [loadIntegration]);

  const updateCredentials = useCallback(async (data: { apiKey?: string; apiSecret?: string; masterKey?: string }): Promise<boolean> => {
    setLoadingAction(true);
    try {
      const res = await paydunyaService.updateCredentials(data);
      if (res.success) {
        await loadIntegration();
        return true;
      }
      setError(res.error || 'Échec de la mise à jour des identifiants');
      return false;
    } finally {
      setLoadingAction(false);
    }
  }, [loadIntegration]);

  const switchMode = useCallback(async (mode: 'live' | 'test'): Promise<boolean> => {
    setLoadingAction(true);
    try {
      const res = await paydunyaService.switchMode(mode);
      if (res.success) {
        await loadIntegration();
        return true;
      }
      setError(res.error || 'Échec du changement de mode');
      return false;
    } finally {
      setLoadingAction(false);
    }
  }, [loadIntegration]);

  const testConnection = useCallback(async (): Promise<{ success: boolean; latencyMs?: number }> => {
    setLoadingAction(true);
    try {
      const res = await paydunyaService.testConnection();
      if (res.success && res.data) {
        return { success: res.data.success, latencyMs: res.data.latencyMs };
      }
      return { success: false };
    } finally {
      setLoadingAction(false);
    }
  }, []);

  // --- Return ---
  return {
    dashboard,
    loading: {
      integration: loadingIntegration,
      stats: loadingStats,
      webhooks: loadingWebhooks,
      health: loadingHealth,
      action: loadingAction,
    },
    error,
    actions: {
      refresh: refreshAll,
      refreshStats: loadStats,
      refreshWebhooks: loadWebhooks,
      refreshHealth: loadHealth,
      toggleChannel,
      updateChannelFee,
      updateCredentials,
      switchMode,
      testConnection,
    },
  };
}
