/**
 * Hook dédié pour le Centre de Notifications Admin
 * Backend-ready: Gère le loading, erreurs, cache, et appels API
 * 
 * ARCHITECTURE:
 * - Automatisations (règles système auto-trigger)
 * - Campagnes manuelles (envoi bulk admin)
 * - Historique unifié (auto + manual)
 * - Templates réutilisables
 * - Programmations futures
 * - Statistiques (globales, canal, hebdomadaire)
 * - Segments d'audience
 * 
 * USAGE:
 * ```tsx
 * const notifAdmin = useNotificationsAdmin();
 * ```
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { notificationsService } from '../services/entitiesService';
import { toast } from 'sonner@2.0.3';
import type {
  AutomationRule,
  SentCampaign,
  NotifTemplate,
  ScheduledNotification,
  NotifStats,
  AudienceSegment,
  ChannelStat,
  WeeklyNotifStat,
  Notification,
  AutomationCategory,
} from '../shared/types/standardized';

// ============================================================================
// TYPES
// ============================================================================

export type HistorySourceFilter = 'all' | 'auto' | 'manual';

export interface UseNotificationsAdminReturn {
  // Data
  stats: NotifStats | null;
  automationRules: AutomationRule[];
  sentHistory: SentCampaign[];
  templates: NotifTemplate[];
  scheduled: ScheduledNotification[];
  audienceSegments: AudienceSegment[];
  channelStats: ChannelStat[];
  weeklyStats: WeeklyNotifStat[];

  // Derived
  activeRulesCount: number;
  totalAutoSent: number;
  filteredRules: AutomationRule[];
  filteredHistory: SentCampaign[];

  // Filters
  automationFilter: 'all' | AutomationCategory;
  setAutomationFilter: (f: 'all' | AutomationCategory) => void;
  historySearch: string;
  setHistorySearch: (s: string) => void;
  historySourceFilter: HistorySourceFilter;
  setHistorySourceFilter: (f: HistorySourceFilter) => void;

  // Actions — automation rules
  toggleRule: (id: string, isActive: boolean) => Promise<void>;
  saveRule: (rule: AutomationRule) => Promise<boolean>;
  deleteRule: (id: string) => Promise<void>;

  // Actions — send campaign
  sendCampaign: (payload: {
    title: string;
    message: string;
    type: Notification['type'];
    channels: string[];
    audience: string;
    actionUrl?: string;
    scheduledAt?: string;
  }) => Promise<{ success: boolean; sentCount?: number; scheduledAt?: string }>;
  sending: boolean;

  // Actions — templates
  createTemplate: (data: Omit<NotifTemplate, 'id' | 'usageCount' | 'lastUsed'>) => Promise<boolean>;
  updateTemplate: (id: string, data: Partial<NotifTemplate>) => Promise<boolean>;
  deleteTemplate: (id: string) => Promise<void>;
  useTemplate: (id: string) => Promise<NotifTemplate | null>;

  // Actions — scheduled
  cancelScheduled: (id: string) => Promise<void>;

  // Refresh
  refresh: () => Promise<void>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useNotificationsAdmin(): UseNotificationsAdminReturn {
  // Data state
  const [stats, setStats] = useState<NotifStats | null>(null);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [sentHistory, setSentHistory] = useState<SentCampaign[]>([]);
  const [templates, setTemplates] = useState<NotifTemplate[]>([]);
  const [scheduled, setScheduled] = useState<ScheduledNotification[]>([]);
  const [audienceSegments, setAudienceSegments] = useState<AudienceSegment[]>([]);
  const [channelStats, setChannelStats] = useState<ChannelStat[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyNotifStat[]>([]);

  // Filter state
  const [automationFilter, setAutomationFilter] = useState<'all' | AutomationCategory>('all');
  const [historySearch, setHistorySearch] = useState('');
  const [historySourceFilter, setHistorySourceFilter] = useState<HistorySourceFilter>('all');

  // Action state
  const [sending, setSending] = useState(false);

  // ========== LOAD ALL DATA ==========

  const loadAllData = useCallback(async () => {
    const [
      statsRes,
      rulesRes,
      historyRes,
      templatesRes,
      scheduledRes,
      audienceRes,
      channelRes,
      weeklyRes,
    ] = await Promise.all([
      notificationsService.getStats(),
      notificationsService.getAutomationRules(),
      notificationsService.getSentHistory(),
      notificationsService.getTemplates(),
      notificationsService.getScheduled(),
      notificationsService.getAudienceSegments(),
      notificationsService.getChannelStats(),
      notificationsService.getWeeklyStats(),
    ]);

    if (statsRes.success && statsRes.data) setStats(statsRes.data);
    if (rulesRes.success && rulesRes.data) setAutomationRules(rulesRes.data);
    if (historyRes.success && historyRes.data) setSentHistory(historyRes.data);
    if (templatesRes.success && templatesRes.data) setTemplates(templatesRes.data);
    if (scheduledRes.success && scheduledRes.data) setScheduled(scheduledRes.data);
    if (audienceRes.success && audienceRes.data) setAudienceSegments(audienceRes.data);
    if (channelRes.success && channelRes.data) setChannelStats(channelRes.data);
    if (weeklyRes.success && weeklyRes.data) setWeeklyStats(weeklyRes.data);
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // ========== DERIVED VALUES ==========

  const activeRulesCount = useMemo(() => automationRules.filter(r => r.isActive).length, [automationRules]);
  const totalAutoSent = useMemo(() => automationRules.reduce((sum, r) => sum + r.sentCount, 0), [automationRules]);

  const filteredRules = useMemo(() => {
    if (automationFilter === 'all') return automationRules;
    return automationRules.filter(r => r.category === automationFilter);
  }, [automationRules, automationFilter]);

  const filteredHistory = useMemo(() => {
    return sentHistory
      .filter(c => {
        const matchesSearch = !historySearch ||
          c.title.toLowerCase().includes(historySearch.toLowerCase()) ||
          c.message.toLowerCase().includes(historySearch.toLowerCase()) ||
          c.sourceName.toLowerCase().includes(historySearch.toLowerCase());
        const matchesSource = historySourceFilter === 'all' || c.source === historySourceFilter;
        return matchesSearch && matchesSource;
      })
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  }, [sentHistory, historySearch, historySourceFilter]);

  // ========== AUTOMATION RULES ACTIONS ==========

  const toggleRule = useCallback(async (id: string, isActive: boolean) => {
    const response = await notificationsService.toggleAutomationRule(id, isActive);
    if (response.success) {
      setAutomationRules(prev => prev.map(r => r.id === id ? { ...r, isActive } : r));
      toast.success(isActive ? 'Automatisation activée' : 'Automatisation désactivée');
    } else {
      toast.error(response.error || 'Erreur');
    }
  }, []);

  const saveRule = useCallback(async (rule: AutomationRule): Promise<boolean> => {
    if (!rule.name.trim()) { toast.error('Le nom est obligatoire'); return false; }
    if (!rule.triggerEvent) { toast.error('Sélectionnez un déclencheur'); return false; }
    if (!rule.template.title.trim()) { toast.error('Le titre du template est obligatoire'); return false; }
    if (!rule.template.message.trim()) { toast.error('Le message est obligatoire'); return false; }
    if (rule.channels.length === 0) { toast.error('Sélectionnez au moins un canal'); return false; }

    const isCreating = !rule.id;

    if (isCreating) {
      const response = await notificationsService.createAutomationRule({
        name: rule.name.trim(),
        description: rule.description.trim(),
        triggerEvent: rule.triggerEvent,
        triggerLabel: rule.triggerLabel,
        template: rule.template,
        channels: rule.channels,
        isActive: false,
        category: rule.category,
      });
      if (response.success && response.data) {
        setAutomationRules(prev => [...prev, response.data!]);
        toast.success('Automatisation créée avec succès');
        return true;
      } else {
        toast.error(response.error || 'Erreur lors de la création');
        return false;
      }
    } else {
      const response = await notificationsService.updateAutomationRule(rule.id, {
        name: rule.name.trim(),
        description: rule.description.trim(),
        triggerEvent: rule.triggerEvent,
        triggerLabel: rule.triggerLabel,
        template: rule.template,
        channels: rule.channels,
        category: rule.category,
      });
      if (response.success) {
        setAutomationRules(prev => prev.map(r => r.id === rule.id ? {
          ...r,
          name: rule.name.trim(),
          description: rule.description.trim(),
          triggerEvent: rule.triggerEvent,
          triggerLabel: rule.triggerLabel,
          template: rule.template,
          channels: rule.channels,
          category: rule.category,
        } : r));
        toast.success('Automatisation mise à jour');
        return true;
      } else {
        toast.error(response.error || 'Erreur');
        return false;
      }
    }
  }, []);

  const deleteRule = useCallback(async (id: string) => {
    const response = await notificationsService.deleteAutomationRule(id);
    if (response.success) {
      setAutomationRules(prev => prev.filter(r => r.id !== id));
      toast.success('Automatisation supprimée');
    } else {
      toast.error(response.error || 'Erreur lors de la suppression');
    }
  }, []);

  // ========== SEND CAMPAIGN ==========

  const sendCampaign = useCallback(async (payload: {
    title: string;
    message: string;
    type: Notification['type'];
    channels: string[];
    audience: string;
    actionUrl?: string;
    scheduledAt?: string;
  }) => {
    if (!payload.title.trim()) { toast.error('Le titre est obligatoire'); return { success: false }; }
    if (!payload.message.trim()) { toast.error('Le message est obligatoire'); return { success: false }; }
    if (payload.channels.length === 0) { toast.error('Sélectionnez au moins un canal'); return { success: false }; }
    if (payload.scheduledAt && !payload.scheduledAt) { toast.error('Choisissez une date'); return { success: false }; }

    setSending(true);
    try {
      const response = await notificationsService.sendBulk(payload);
      if (response.success && response.data) {
        const { sentCount, scheduledAt } = response.data;
        toast.success(scheduledAt
          ? `Campagne programmée pour ${sentCount.toLocaleString()} destinataires`
          : `Campagne envoyée à ${sentCount.toLocaleString()} destinataires`
        );

        // Refresh stats + history + scheduled after send
        const [statsRes, historyRes, scheduledRes] = await Promise.all([
          notificationsService.getStats(),
          notificationsService.getSentHistory(),
          notificationsService.getScheduled(),
        ]);
        if (statsRes.success && statsRes.data) setStats(statsRes.data);
        if (historyRes.success && historyRes.data) setSentHistory(historyRes.data);
        if (scheduledRes.success && scheduledRes.data) setScheduled(scheduledRes.data);

        return { success: true, sentCount, scheduledAt };
      } else {
        toast.error(response.error || 'Erreur lors de l\'envoi');
        return { success: false };
      }
    } catch {
      toast.error('Erreur lors de l\'envoi');
      return { success: false };
    } finally {
      setSending(false);
    }
  }, []);

  // ========== TEMPLATE ACTIONS ==========

  const createTemplate = useCallback(async (data: Omit<NotifTemplate, 'id' | 'usageCount' | 'lastUsed'>): Promise<boolean> => {
    if (!data.name.trim()) { toast.error('Le nom du template est obligatoire'); return false; }
    if (!data.title.trim()) { toast.error('Le titre est obligatoire'); return false; }
    if (!data.message.trim()) { toast.error('Le message est obligatoire'); return false; }

    const response = await notificationsService.createTemplate(data);
    if (response.success && response.data) {
      setTemplates(prev => [...prev, response.data!]);
      toast.success('Template créé avec succès');
      return true;
    } else {
      toast.error(response.error || 'Erreur lors de la création');
      return false;
    }
  }, []);

  const updateTemplateAction = useCallback(async (id: string, data: Partial<NotifTemplate>): Promise<boolean> => {
    const response = await notificationsService.updateTemplate(id, data);
    if (response.success && response.data) {
      setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
      toast.success('Template mis à jour');
      return true;
    } else {
      toast.error(response.error || 'Erreur');
      return false;
    }
  }, []);

  const deleteTemplateAction = useCallback(async (id: string) => {
    const response = await notificationsService.deleteTemplate(id);
    if (response.success) {
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast.success('Template supprimé');
    } else {
      toast.error(response.error || 'Erreur lors de la suppression');
    }
  }, []);

  const useTemplateAction = useCallback(async (id: string): Promise<NotifTemplate | null> => {
    const response = await notificationsService.useTemplate(id);
    if (response.success && response.data) {
      setTemplates(prev => prev.map(t => t.id === id ? response.data! : t));
      return response.data;
    }
    return null;
  }, []);

  // ========== SCHEDULED ACTIONS ==========

  const cancelScheduledAction = useCallback(async (id: string) => {
    const response = await notificationsService.cancelScheduled(id);
    if (response.success) {
      setScheduled(prev => prev.map(s => s.id === id ? { ...s, status: 'cancelled' as const } : s));
      // Refresh stats (scheduledCount changed)
      const statsRes = await notificationsService.getStats();
      if (statsRes.success && statsRes.data) setStats(statsRes.data);
      toast.success('Campagne programmée annulée');
    } else {
      toast.error(response.error || 'Erreur lors de l\'annulation');
    }
  }, []);

  return {
    // Data
    stats,
    automationRules,
    sentHistory,
    templates,
    scheduled,
    audienceSegments,
    channelStats,
    weeklyStats,

    // Derived
    activeRulesCount,
    totalAutoSent,
    filteredRules,
    filteredHistory,

    // Filters
    automationFilter,
    setAutomationFilter,
    historySearch,
    setHistorySearch,
    historySourceFilter,
    setHistorySourceFilter,

    // Actions
    toggleRule,
    saveRule,
    deleteRule,
    sendCampaign,
    sending,
    createTemplate,
    updateTemplate: updateTemplateAction,
    deleteTemplate: deleteTemplateAction,
    useTemplate: useTemplateAction,
    cancelScheduled: cancelScheduledAction,

    // Refresh
    refresh: loadAllData,
  };
}
